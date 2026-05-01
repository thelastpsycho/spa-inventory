<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FreshBookingDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();

        // Empty the bookings table first
        $this->command->info('Emptying bookings table...');
        DB::table('booking_products')->truncate();
        DB::table('bookings')->truncate();
        $this->command->info('Bookings table emptied.');

        $therapists = DB::table('therapists')->get()->keyBy('id');
        $rooms = DB::table('rooms')->pluck('id')->toArray();
        $treatments = DB::table('treatments')->get()->keyBy('id');

        if ($therapists->isEmpty() || $treatments->isEmpty() || empty($rooms)) {
            $this->command->error('Missing therapists, treatments, or rooms. Please seed basic data first.');
            return;
        }

        // Generate guest names
        $guests = [];
        $firstNames = ['Emma', 'James', 'Sophie', 'Michael', 'Olivia', 'William', 'Amanda', 'Daniel', 'Jennifer', 'Robert',
                       'Lisa', 'David', 'Sarah', 'Christopher', 'Jessica', 'Matthew', 'Ashley', 'Joshua', 'Stephanie', 'Andrew',
                       'Emily', 'Ryan', 'Nicole', 'Brandon', 'Megan', 'Jason', 'Laura', 'Justin', 'Kimberly', 'Kyle',
                       'Rebecca', 'Nathan', 'Samantha', 'Kevin', 'Elizabeth', 'Brian', 'Michelle', 'Adam', 'Dorothy', 'Eric',
                       'Patricia', 'Mark', 'Linda', 'Steven', 'Barbara', 'Paul', 'Susan', 'Andrew', 'Jessica', 'Thomas'];

        $lastNames = ['Thompson', 'Wilson', 'Martinez', 'Brown', 'Davis', 'Garcia', 'Rodriguez', 'Lee', 'White', 'Johnson',
                     'Anderson', 'Kim', 'Taylor', 'Moore', 'Jackson', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker',
                     'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Hill', 'Flores', 'Green', 'Adams',
                     'Nelson', 'Baker', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker',
                     'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan'];

        $guestCounter = 0;
        foreach ($firstNames as $first) {
            foreach ($lastNames as $last) {
                $email = strtolower($first[0] . $last . ($guestCounter + 1)) . '@spa.com';
                $guests[] = [
                    'name' => "$first $last",
                    'email' => $email,
                    'phone' => '555-' . str_pad((string)($guestCounter + 1001), 4, '0', STR_PAD_LEFT),
                ];
                $guestCounter++;
                if ($guestCounter >= 100) break  // Limit to 100 guests
                ;
            }
            if ($guestCounter >= 100) break;
        }

        $notes = [
            'First time client', 'Regular client', 'VIP', 'Prefers light pressure', 'Has sensitive skin',
            'Prefers hot room', 'Back pain focus', 'Birthday treat', 'Gift certificate', 'Prefers aromatherapy',
            'Morning preference', 'Allergic to lavender', 'Weekly regular', 'Monthly regular', 'Deep tissue preferred',
            'Minimal talking', 'Neck pain focus', 'Requested female therapist', 'Heated blanket preferred', 'Celebration booking',
            'Anniversary treat', 'Stress relief needed', 'Sports massage', 'Prenatal care', 'Post-surgery recovery',
        ];

        $bookingsCreated = 0;
        $now = now();

        // Define months: March, April, May 2026
        $months = [
            ['year' => 2026, 'month' => 3, 'name' => 'March'],
            ['year' => 2026, 'month' => 4, 'name' => 'April'],
            ['year' => 2026, 'month' => 5, 'name' => 'May'],
        ];

        $this->command->info('Starting fresh booking data generation...');

        foreach ($months as $monthData) {
            $year = $monthData['year'];
            $month = $monthData['month'];
            $monthName = $monthData['name'];

            $this->command->info("Processing {$monthName} {$year}...");

            // Get number of days in this month
            $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);

            // For each day in the month
            for ($day = 1; $day <= $daysInMonth; $day++) {
                // Skip future dates in May if we're not there yet
                if ($month === 5 && $day > $now->day) {
                    continue;
                }

                // Random number of bookings for this day: 10-15
                $dailyBookingsTarget = rand(10, 15);
                $dailyBookingsCreated = 0;
                $attempts = 0;
                $maxAttempts = $dailyBookingsTarget * 10;  // Allow many attempts

                while ($dailyBookingsCreated < $dailyBookingsTarget && $attempts < $maxAttempts) {
                    $attempts++;

                    $guest = $guests[array_rand($guests)];

                    // Random treatment (cycle through to ensure variety)
                    $treatmentKeys = $treatments->keys()->toArray();
                    $treatmentKey = $treatmentKeys[array_rand($treatmentKeys)];
                    $treatment = $treatments->get($treatmentKey);

                    // Random time slot (9 AM to 6 PM)
                    $hour = rand(9, 17);
                    $minute = (rand(0, 3) === 0) ? 30 : 0;  // 25% chance of :30

                    $startTime = \Carbon\Carbon::create($year, $month, $day, $hour, $minute, 0);
                    $endTime = $startTime->copy()->addMinutes($treatment->duration);

                    // Random therapist (ensure distribution)
                    $therapistKeys = $therapists->keys()->toArray();
                    $therapistId = $therapistKeys[array_rand($therapistKeys)];

                    // Random room
                    $roomId = $rooms[array_rand($rooms)];

                    // Check for therapist conflicts
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

                    // Check for room conflicts
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
                        // Set booking status
                        $status = 'confirmed';

                        // For past bookings, some should be completed
                        if ($startTime->lt($now)) {
                            $status = (rand(1, 10) <= 9) ? 'completed' : 'cancelled';  // 90% completed, 10% cancelled
                        }

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
                            'status' => $status,
                            'created_by' => $admin->id,
                            'created_at' => $startTime->copy()->subDays(rand(1, 60)),
                            'updated_at' => $now,
                        ]);

                        // Add products to 50% of bookings
                        if (rand(1, 2) === 1) {
                            $productCount = rand(1, 2);
                            $products = Product::inRandomOrder()->limit($productCount)->get();

                            foreach ($products as $product) {
                                if ($product->quantity > 0) {
                                    $quantity = min(rand(1, 2), $product->quantity);

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

                        $dailyBookingsCreated++;
                        $bookingsCreated++;
                    }
                }

                if ($day % 10 === 0) {
                    $this->command->info("  Day {$day}: {$dailyBookingsCreated} bookings created");
                }
            }

            $this->command->info("{$monthName} {$year}: Total bookings created");
        }

        $this->command->info("===============================================");
        $this->command->info("Total bookings created: {$bookingsCreated}");
        $this->command->info('===============================================');

        // Show summary statistics
        $this->displaySummary($year, $month);
    }

    private function displaySummary($year, $month)
    {
        $this->command->info('');
        $this->command->info('BOOKING SUMMARY:');
        $this->command->info(str_repeat('=', 50));

        // By month
        foreach ([3, 4, 5] as $m) {
            $count = DB::table('bookings')
                ->whereYear('start_time', 2026)
                ->whereMonth('start_time', $m)
                ->count();
            $monthName = date('F', mktime(0, 0, 0, $m, 1));
            $this->command->info("{$monthName} 2026: {$count} bookings");
        }

        $this->command->info('');

        // Therapist distribution
        $this->command->info('THERAPIST PERFORMANCE:');
        $therapists = DB::table('therapists')->get();
        foreach ($therapists as $t) {
            $count = DB::table('bookings')
                ->where('therapist_id', $t->id)
                ->whereYear('start_time', 2026)
                ->count();
            $this->command->info("  {$t->name}: {$count} bookings");
        }

        $this->command->info('');

        // Treatment popularity
        $this->command->info('TREATMENT POPULARITY:');
        $treatments = DB::table('treatments')->get();
        $treatmentData = [];
        foreach ($treatments as $t) {
            $count = DB::table('bookings')
                ->where('treatment_id', $t->id)
                ->whereYear('start_time', 2026)
                ->count();
            $treatmentData[] = ['name' => $t->name, 'count' => $count];
        }

        // Sort by count
        usort($treatmentData, function($a, $b) {
            return $b['count'] - $a['count'];
        });

        foreach ($treatmentData as $t) {
            $this->command->info("  {$t['name']}: {$t['count']} bookings");
        }

        $this->command->info(str_repeat('=', 50));
    }
}
