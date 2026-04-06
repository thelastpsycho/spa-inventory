<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Room>
 */
class RoomFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $roomNames = [
            'Serenity Room',
            'Harmony Suite',
            'Tranquility Room',
            'Bliss Space',
            'Zen Garden Room',
            'Peaceful Haven',
            'Relaxation Station',
            'Calming Corner',
        ];

        return [
            'name' => fake()->unique()->randomElement($roomNames),
            'capacity' => fake()->numberBetween(1, 4),
        ];
    }
}
