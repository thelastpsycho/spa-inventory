<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Collection;

class BookingService
{
    public function getBookings(
        ?string $startDate = null,
        ?string $endDate = null,
        ?int $therapistId = null,
        ?int $roomId = null,
        ?int $treatmentId = null,
        ?string $search = null,
        ?bool $includeCancelled = false
    ): Collection {
        $query = Booking::with(['treatment', 'therapist', 'room', 'createdBy']);

        // Only filter out cancelled if not explicitly including them
        if (!$includeCancelled) {
            $query->whereNot('status', 'cancelled');
        }

        if ($startDate && $endDate) {
            $query->whereBetween('start_time', [$startDate, $endDate]);
        }

        if ($therapistId) {
            $query->where('therapist_id', $therapistId);
        }

        if ($roomId) {
            $query->where('room_id', $roomId);
        }

        if ($treatmentId) {
            $query->where('treatment_id', $treatmentId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('guest_name', 'like', "%{$search}%")
                    ->orWhere('guest_phone', 'like', "%{$search}%")
                    ->orWhere('guest_email', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('start_time')->get();
    }

    public function createBooking(array $data): Booking
    {
        $products = $data['products'] ?? [];
        unset($data['products']);

        // Calculate end_time from duration if not provided
        if (!isset($data['end_time']) && isset($data['start_time'])) {
            $startTime = \Carbon\Carbon::parse($data['start_time']);

            // Use custom duration if provided, otherwise use treatment duration
            if (isset($data['duration'])) {
                $duration = (int) $data['duration'];
                $data['duration'] = $duration;
                $data['end_time'] = $startTime->copy()->addMinutes($duration)->toDateTimeString();
            } elseif (isset($data['treatment_id'])) {
                $treatment = \App\Models\Treatment::find($data['treatment_id']);
                if ($treatment) {
                    $data['duration'] = $treatment->duration;
                    $data['end_time'] = $startTime->copy()->addMinutes($treatment->duration)->toDateTimeString();
                }
            }
        }

        $booking = Booking::create($data);

        // Attach products and deduct from inventory
        foreach ($products as $product) {
            $booking->products()->attach($product['product_id'], [
                'quantity' => $product['quantity'],
            ]);

            // Deduct from inventory
            $productModel = \App\Models\Product::find($product['product_id']);
            if ($productModel) {
                $productModel->decrement('quantity', $product['quantity']);
            }
        }

        return $booking->load(['treatment', 'therapist', 'room', 'products']);
    }

    public function updateBooking(Booking $booking, array $data): Booking
    {
        $products = $data['products'] ?? null;
        unset($data['products']);

        // Calculate end_time from duration if needed
        if (!isset($data['end_time'])) {
            $startTime = isset($data['start_time']) ? \Carbon\Carbon::parse($data['start_time']) : $booking->start_time;

            // Use custom duration if provided, otherwise use treatment or existing duration
            if (isset($data['duration'])) {
                $duration = (int) $data['duration'];
                $data['duration'] = $duration;
                $data['end_time'] = $startTime->copy()->addMinutes($duration)->toDateTimeString();
            } elseif (isset($data['treatment_id'])) {
                $treatment = \App\Models\Treatment::find($data['treatment_id']);
                if ($treatment) {
                    $data['duration'] = $treatment->duration;
                    $data['end_time'] = $startTime->copy()->addMinutes($treatment->duration)->toDateTimeString();
                }
            } elseif (isset($data['start_time']) && $booking->duration) {
                // If only start_time is being updated, use existing duration
                $data['end_time'] = $startTime->copy()->addMinutes($booking->duration)->toDateTimeString();
            }
        }

        // If products are being updated, restore old inventory first
        if ($products !== null) {
            foreach ($booking->products as $existingProduct) {
                $existingProduct->increment('quantity', $existingProduct->pivot->quantity);
            }
            $booking->products()->detach();
        }

        $booking->update($data);

        // Attach new products and deduct from inventory
        if ($products !== null) {
            foreach ($products as $product) {
                $booking->products()->attach($product['product_id'], [
                    'quantity' => $product['quantity'],
                ]);

                $productModel = \App\Models\Product::find($product['product_id']);
                if ($productModel) {
                    $productModel->decrement('quantity', $product['quantity']);
                }
            }
        }

        return $booking->load(['treatment', 'therapist', 'room', 'products']);
    }

    public function deleteBooking(Booking $booking): void
    {
        // Restore inventory
        foreach ($booking->products as $product) {
            $product->increment('quantity', $product->pivot->quantity);
        }

        $booking->delete();
    }

    public function checkConflicts(
        ?int $therapistId = null,
        ?int $roomId = null,
        ?string $startTime = null,
        ?string $endTime = null,
        ?int $excludeBookingId = null
    ): Collection {
        $query = Booking::confirmed()->where('id', '!=', $excludeBookingId ?? 0);

        $conflicts = collect();

        if ($therapistId && $startTime && $endTime) {
            $therapistConflicts = (clone $query)
                ->where('therapist_id', $therapistId)
                ->where(function ($q) use ($startTime, $endTime) {
                    $q->whereBetween('start_time', [$startTime, $endTime])
                        ->orWhereBetween('end_time', [$startTime, $endTime])
                        ->orWhere(function ($q2) use ($startTime, $endTime) {
                            $q2->where('start_time', '<', $startTime)
                                ->where('end_time', '>', $endTime);
                        });
                })
                ->with(['therapist', 'room', 'treatment'])
                ->get();

            $conflicts = $conflicts->concat($therapistConflicts);
        }

        if ($roomId && $startTime && $endTime) {
            $roomConflicts = (clone $query)
                ->where('room_id', $roomId)
                ->where(function ($q) use ($startTime, $endTime) {
                    $q->whereBetween('start_time', [$startTime, $endTime])
                        ->orWhereBetween('end_time', [$startTime, $endTime])
                        ->orWhere(function ($q2) use ($startTime, $endTime) {
                            $q2->where('start_time', '<', $startTime)
                                ->where('end_time', '>', $endTime);
                        });
                })
                ->with(['therapist', 'room', 'treatment'])
                ->get();

            $conflicts = $conflicts->concat($roomConflicts);
        }

        return $conflicts->unique('id');
    }
}
