<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BoostStatisticsSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        $therapists = DB::table('therapists')->get()->keyBy('id');
        $rooms = DB::table('rooms')->pluck('id')->toArray();
        $treatments = DB::table('treatments')->get()->keyBy('id');

        $guests = [];
        $firstNames = ['Emma', 'James', 'Sophie', 'Michael', 'Olivia', 'William', 'Amanda', 'Daniel', 'Jennifer', 'Robert',
                       'Lisa', 'David', 'Sarah', 'Christopher', 'Jessica', 'Matthew', 'Ashley', 'Joshua', 'Stephanie', 'Andrew'];

        $lastNames = ['Thompson', 'Wilson', 'Martinez', 'Brown', 'Davis', 'Garcia', 'Rodriguez', 'Lee', 'White', 'Johnson',
                     'Anderson', 'Kim', 'Taylor', 'Moore', 'Jackson', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker'];

        foreach ($firstNames as $i => $first) {
            $last = $lastNames[$i % count($lastNames)];
            $email = strtolower($first[0] . $last) . mt_rand(100, 999) . '@email.com';
            $guests[] = [
                'name' => "$first $last",
                'email' => $email,
                'phone' => '555-' . str_pad((string)mt_rand(1001, 9999), 4, '0', STR_PAD_LEFT),
            ];
        }

        $notes = [
            'Regular client', '', 'VIP', 'First time', '',
            'Prefers morning', 'Gift certificate', '', 'Allergic to scents', '',
            'Birthday treat', '', 'Deep tissue preferred', '', 'Monthly regular',
        ];

        $bookingsCreated = 0;
        $now = now();
        $currentMonth = $now->month;
        $currentYear = $now->year;

        // Ensure we have data
        if ($therapists->isEmpty() || $treatments->isEmpty()) {
            $this->command->error('No therapists or treatments found.');
            return;
        }

        $this->command->info('Boosting statistics with more bookings...');

        // Create bookings focusing on peak hours (10 AM - 4 PM)
        $peakHours = [10, 11, 13, 14, 15, 16];

        // Try to create 200 more bookings
        $targetBookings = 200;

        for ($i = 0; $i < $targetBookings; $i++) {
            $guest = $guests[array_rand($guests)];

            // Weight treatments to make some more popular
            $treatmentKeys = $treatments->keys()->toArray();
            $treatmentKey = $treatmentKeys[array_rand($treatmentKeys)];
            $treatment = $treatments->get($treatmentKey);

            // Random day in current month
            $day = mt_rand(1, $now->day);

            // Use peak hours more often
            $hour = $peakHours[array_rand($peakHours)];
            $minute = (mt_rand(0, 1) === 1) ? 30 : 0;

            $startTime = $now->copy()->setDate($currentYear, $currentMonth, $day)
                ->setHour($hour)
                ->setMinute($minute)
                ->setSecond(0);

            $endTime = $startTime->copy()->addMinutes($treatment->duration);

            // Prefer top therapists (create skew in performance data)
            $therapistKeys = $therapists->keys()->toArray();
            $topTherapistIds = array_slice($therapistKeys, 0, max(1, count($therapistKeys) / 2));
            $otherTherapistIds = array_slice($therapistKeys, count($topTherapistIds));

            // 70% chance to pick top therapist
            $therapistId = (mt_rand(1, 10) <= 7)
                ? $topTherapistIds[array_rand($topTherapistIds)]
                : $otherTherapistIds[array_rand($otherTherapistIds)];

            $roomId = $rooms[array_rand($rooms)];

            // Check for conflicts with more lenient timing
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
                    'created_at' => $startTime->copy()->subDays(mt_rand(1, 30)),
                    'updated_at' => $now,
                ]);

                // Add products to 60% of bookings
                if (mt_rand(1, 10) <= 6) {
                    $productCount = mt_rand(1, 3);
                    $products = Product::inRandomOrder()->limit($productCount)->get();

                    foreach ($products as $product) {
                        if ($product->quantity > 0) {
                            $quantity = min(mt_rand(1, 2), $product->quantity);

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

                if ($bookingsCreated % 20 === 0) {
                    $this->command->info("Created {$bookingsCreated} additional bookings...");
                }
            }
        }

        $this->command->info("Total additional bookings created: {$bookingsCreated}");
        $this->command->info('Statistics boost complete!');

        // Show summary
        $totalBookings = DB::table('bookings')
            ->whereBetween('start_time', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->count();

        $this->command->info("Total MTD bookings now: {$totalBookings}");
    }
}
