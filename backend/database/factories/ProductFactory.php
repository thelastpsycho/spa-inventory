<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $products = [
            'Massage Oil - Lavender' => 25.00,
            'Massage Oil - Eucalyptus' => 22.00,
            'Essential Oil Set' => 45.00,
            'Body Lotion - Aloe Vera' => 18.00,
            'Body Lotion - Coconut' => 18.00,
            'Face Cream - Anti-Aging' => 55.00,
            'Face Cream - Hydrating' => 45.00,
            'Body Scrub - Sea Salt' => 32.00,
            'Body Scrub - Sugar' => 28.00,
            'Candle - Soy Lavender' => 15.00,
            'Candle - Vanilla' => 15.00,
            'Hot Stones Set' => 120.00,
            'Towels - Premium Cotton' => 12.00,
            'Robe - Egyptian Cotton' => 85.00,
            'Slippers - Plush' => 18.00,
        ];

        $productName = fake()->randomElement(array_keys($products));
        $cost = $products[$productName];

        return [
            'name' => $productName,
            'description' => fake()->sentence(),
            'quantity' => fake()->numberBetween(5, 50),
            'unit' => fake()->randomElement(['pcs', 'ml', 'gr', 'oz', 'set']),
            'cost' => $cost,
            'reorder_level' => fake()->numberBetween(5, 10),
            'is_active' => true,
        ];
    }
}
