<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Treatment>
 */
class TreatmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $treatments = [
            'Swedish Massage' => 60,
            'Deep Tissue Massage' => 90,
            'Hot Stone Therapy' => 75,
            'Aromatherapy Massage' => 60,
            'Sports Massage' => 45,
            'Prenatal Massage' => 60,
            'Couples Massage' => 90,
            'Reflexology' => 45,
            'Thai Massage' => 90,
            'Shiatsu Massage' => 60,
            'Facial Treatment' => 60,
            'Anti-Aging Facial' => 90,
            'Deep Cleansing Facial' => 75,
            'Body Scrub' => 45,
            'Body Wrap' => 60,
        ];

        $treatmentName = fake()->randomElement(array_keys($treatments));
        $duration = $treatments[$treatmentName];

        return [
            'name' => $treatmentName,
            'description' => fake()->paragraph(3),
            'duration' => $duration,
            'price' => fake()->randomFloat(2, 50, 200),
            'is_active' => true,
        ];
    }
}
