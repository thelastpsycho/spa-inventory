<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RealisticBookingsSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        $therapists = DB::table('therapists')->pluck('id')->toArray();
        $rooms = DB::table('rooms')->pluck('id')->toArray();
        $treatments = DB::table('treatments')->get()->toArray();

        // Realistic guest data
        $guests = [
            ['name' => 'Emma Thompson', 'email' => 'emma.t@email.com', 'phone' => '555-1001'],
            ['name' => 'James Wilson', 'email' => 'james.wilson@email.com', 'phone' => '555-1002'],
            ['name' => 'Sophie Martinez', 'email' => 'sophie.m@email.com', 'phone' => '555-1003'],
            ['name' => 'Michael Brown', 'email' => 'michael.brown@email.com', 'phone' => '555-1004'],
            ['name' => 'Olivia Davis', 'email' => 'olivia.d@email.com', 'phone' => '555-1005'],
            ['name' => 'William Garcia', 'email' => 'william.garcia@email.com', 'phone' => '555-1006'],
            ['name' => 'Amanda Rodriguez', 'email' => 'amanda.r@email.com', 'phone' => '555-1007'],
            ['name' => 'Daniel Lee', 'email' => 'daniel.lee@email.com', 'phone' => '555-1008'],
            ['name' => 'Jennifer White', 'email' => 'jennifer.white@email.com', 'phone' => '555-1009'],
            ['name' => 'Robert Johnson', 'email' => 'robert.j@email.com', 'phone' => '555-1010'],
            ['name' => 'Lisa Anderson', 'email' => 'lisa.anderson@email.com', 'phone' => '555-1011'],
            ['name' => 'David Kim', 'email' => 'david.kim@email.com', 'phone' => '555-1012'],
            ['name' => 'Sarah Taylor', 'email' => 'sarah.taylor@email.com', 'phone' => '555-1013'],
            ['name' => 'Christopher Moore', 'email' => 'c.moore@email.com', 'phone' => '555-1014'],
            ['name' => 'Jessica Jackson', 'email' => 'jessica.j@email.com', 'phone' => '555-1015'],
        ];

        $notes = [
            'First time client - prefers light pressure',
            'Regular client - has sensitive skin',
            'Prefers hot room temperature',
            'Returning client - mentioned back pain focus',
            'VIP client - extra attention to detail',
            'Birthday treat - make it special',
            'Prefers aromatherapy oils',
            'Has appointment preference for morning slots',
            'Allergic to lavender - use alternative oils',
            'Regular weekly booking',
            '', // No notes
            'Gift certificate booking',
            'Prefers minimal talking during treatment',
            'Requested deep tissue work on shoulders',
            'First-time spa experience',
        ];

        $bookingsCreated = 0;
        $now = now();

        foreach ($guests as $index => $guest) {
            // Random treatment
            $treatmentKey = array_rand($treatments);
            $treatment = $treatments[$treatmentKey];

            // Random time in next 5 days (between 9 AM - 6 PM)
            $daysOffset = rand(0, 5);
            $hour = rand(9, 17);
            $minute = (rand(0, 1) === 1) ? 30 : 0;

            $startTime = $now->copy()->addDays($daysOffset)
                ->setHour($hour)
                ->setMinute($minute)
                ->setSecond(0);

            $endTime = $startTime->copy()->addMinutes($treatment->duration);

            // Random therapist and room
            $therapistId = $therapists[array_rand($therapists)];
            $roomId = $rooms[array_rand($rooms)];

            // Check for conflicts
            $hasConflict = DB::table('bookings')
                ->where('therapist_id', $therapistId)
                ->where('status', '!=', 'cancelled')
                ->where(function ($query) use ($startTime, $endTime) {
                    $query->whereBetween('start_time', [$startTime, $endTime])
                        ->orWhereBetween('end_time', [$startTime, $endTime])
                        ->orWhere(function ($q) use ($startTime, $endTime) {
                            $q->where('start_time', '<', $startTime)
                                ->where('end_time', '>', $endTime);
                        });
                })->exists();

            // Also check room conflicts
            $hasRoomConflict = DB::table('bookings')
                ->where('room_id', $roomId)
                ->where('status', '!=', 'cancelled')
                ->where(function ($query) use ($startTime, $endTime) {
                    $query->whereBetween('start_time', [$startTime, $endTime])
                        ->orWhereBetween('end_time', [$startTime, $endTime])
                        ->orWhere(function ($q) use ($startTime, $endTime) {
                            $q->where('start_time', '<', $startTime)
                                ->where('end_time', '>', $endTime);
                        });
                })->exists();

            if (!$hasConflict && !$hasRoomConflict) {
                $bookingId = DB::table('bookings')->insertGetId([
                    'guest_name' => $guest['name'],
                    'guest_email' => $guest['email'],
                    'guest_phone' => $guest['phone'],
                    'treatment_id' => $treatment->id,
                    'therapist_id' => $therapistId,
                    'room_id' => $roomId,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'notes' => $notes[array_rand($notes)],
                    'status' => 'confirmed',
                    'created_by' => $admin->id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                // Add products to some bookings (inventory usage)
                if (rand(0, 1) === 1) {
                    $productCount = rand(1, 2);
                    $products = Product::inRandomOrder()->limit($productCount)->get();

                    foreach ($products as $product) {
                        if ($product->quantity > 0) {
                            $quantity = min(rand(1, 3), $product->quantity);

                            DB::table('booking_products')->insert([
                                'booking_id' => $bookingId,
                                'product_id' => $product->id,
                                'quantity' => $quantity,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ]);

                            $product->decrement('quantity', $quantity);
                        }
                    }
                }

                $bookingsCreated++;
                $this->command->info("Created booking: {$guest['name']} - {$treatment->name} on {$startTime->format('Y-m-d H:i')}");
            }
        }

        $this->command->info("Total realistic bookings created: {$bookingsCreated}");
    }
}
