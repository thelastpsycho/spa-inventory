<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Focus on April-July 2026
        $months = [4, 5, 6, 7]; // April, May, June, July 2026
        $month = fake()->randomElement($months);
        $day = fake()->numberBetween(1, 28);

        // Business hours: 6 AM to 11 PM (17 hours available)
        $startHour = fake()->numberBetween(6, 20); // Start between 6 AM and 8 PM
        $startMinute = fake()->randomElement([0, 15, 30, 45]);

        $startTime = Carbon::create(2026, $month, $day, $startHour, $startMinute, 0);

        // Duration options that won't exceed business hours
        $duration = fake()->randomElement([30, 45, 60, 75, 90, 120]);

        // Calculate end time and ensure it doesn't go past 11 PM (23:00)
        $endTime = $startTime->copy()->addMinutes($duration);

        // If booking would end after 11 PM, adjust it
        if ($endTime->hour >= 23 || ($endTime->hour === 22 && $endTime->minute > 0)) {
            // Reduce duration to fit within business hours
            $maxEndTime = Carbon::create(2026, $month, $day, 22, 30, 0); // Latest end time: 10:30 PM
            $availableMinutes = $maxEndTime->diffInMinutes($startTime);

            if ($availableMinutes >= 30) {
                $duration = min($duration, $availableMinutes);
                $endTime = $startTime->copy()->addMinutes($duration);
            } else {
                // If not enough time left, pick a new start time
                $startHour = fake()->numberBetween(6, 16);
                $startTime = Carbon::create(2026, $month, $day, $startHour, $startMinute, 0);
                $duration = fake()->randomElement([30, 45, 60, 90]);
                $endTime = $startTime->copy()->addMinutes($duration);
            }
        }

        return [
            'guest_name' => fake()->name(),
            'guest_email' => fake()->optional(0.8)->safeEmail(),
            'guest_phone' => fake()->phoneNumber(),
            'treatment_id' => \App\Models\Treatment::inRandomOrder()->first()->id,
            'therapist_id' => \App\Models\Therapist::inRandomOrder()->first()->id,
            'room_id' => \App\Models\Room::inRandomOrder()->first()->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'duration' => $duration,
            'notes' => fake()->optional(0.6)->sentence(),
            'status' => fake()->randomElement(['definite', 'tentative', 'waiting_list', 'cancelled']),
            'created_by' => \App\Models\User::inRandomOrder()->first()->id,
        ];
    }

    /**
     * Create a definite booking
     */
    public function definite(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'definite',
        ]);
    }

    /**
     * Create a tentative booking
     */
    public function tentative(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'tentative',
        ]);
    }

    /**
     * Create a waiting list booking
     */
    public function waitingList(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'waiting_list',
        ]);
    }

    /**
     * Create a cancelled booking
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }
}
