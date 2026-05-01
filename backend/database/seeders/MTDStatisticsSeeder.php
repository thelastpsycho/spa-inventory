<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MTDStatisticsSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        $therapists = DB::table('therapists')->pluck('id')->toArray();
        $rooms = DB::table('rooms')->pluck('id')->toArray();
        $treatments = DB::table('treatments')->get()->keyBy('id');

        // Generate realistic guests
        $guests = [];
        $firstNames = ['Emma', 'James', 'Sophie', 'Michael', 'Olivia', 'William', 'Amanda', 'Daniel', 'Jennifer', 'Robert',
                       'Lisa', 'David', 'Sarah', 'Christopher', 'Jessica', 'Matthew', 'Ashley', 'Joshua', 'Stephanie', 'Andrew',
                       'Emily', 'Ryan', 'Nicole', 'Brandon', 'Megan', 'Jason', 'Laura', 'Justin', 'Kimberly', 'Kyle',
                       'Rebecca', 'Nathan', 'Samantha', 'Kevin', 'Elizabeth', 'Brian', 'Michelle', 'Adam', 'Dorothy', 'Eric'];

        $lastNames = ['Thompson', 'Wilson', 'Martinez', 'Brown', 'Davis', 'Garcia', 'Rodriguez', 'Lee', 'White', 'Johnson',
                     'Anderson', 'Kim', 'Taylor', 'Moore', 'Jackson', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker',
                     'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Hill', 'Flores', 'Green', 'Adams',
                     'Nelson', 'Baker', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker'];

        foreach ($firstNames as $i => $first) {
            $last = $lastNames[$i % count($lastNames)];
            $email = strtolower($first[0] . $last) . '@email.com';
            $guests[] = [
                'name' => "$first $last",
                'email' => $email,
                'phone' => '555-' . str_pad((string)rand(1001, 9999), 4, '0', STR_PAD_LEFT),
            ];
        }

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
            '',
            'Gift certificate booking',
            'Prefers minimal talking during treatment',
            'Requested deep tissue work on shoulders',
            'First-time spa experience',
            'Prefers heated blanket during treatment',
            'Has neck pain - focus on upper back',
            'Regular monthly treatment',
            'Requested female therapist',
            'Celebration booking',
        ];

        $bookingsCreated = 0;
        $now = now();
        $currentMonth = $now->month;
        $currentYear = $now->year;

        // Create 150 bookings distributed throughout the current month
        $totalBookings = 150;

        // Ensure we have therapists and treatments
        if (empty($therapists) || $treatments->isEmpty()) {
            $this->command->error('No therapists or treatments found. Please seed basic data first.');
            return;
        }

        $this->command->info("Creating {$totalBookings} bookings for month to date...");

        for ($i = 0; $i < $totalBookings; $i++) {
            $guest = $guests[array_rand($guests)];

            // Random treatment
            $treatment = $treatments->random();
            $treatmentId = $treatment->id;

            // Random day in current month (from 1st to today)
            $day = rand(1, $now->day);

            // Random time between 9 AM - 6 PM
            $hour = rand(9, 17);
            $minute = (rand(0, 1) === 1) ? 30 : 0;

            $startTime = $now->copy()->setDate($currentYear, $currentMonth, $day)
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
                    'treatment_id' => $treatmentId,
                    'therapist_id' => $therapistId,
                    'room_id' => $roomId,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'notes' => $notes[array_rand($notes)],
                    'status' => 'confirmed',
                    'created_by' => $admin->id,
                    'created_at' => $startTime->copy()->subDays(rand(1, 30)),
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

                if ($bookingsCreated % 10 === 0) {
                    $this->command->info("Created {$bookingsCreated} bookings...");
                }
            }
        }

        $this->command->info("Total MTD bookings created: {$bookingsCreated}");
        $this->command->info('MTD Statistics data seeded successfully!');
    }
}
