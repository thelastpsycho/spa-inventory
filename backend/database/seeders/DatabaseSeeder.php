<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Only create admin user (production-friendly, no faker needed)
        User::firstOrCreate(
            ['email' => 'admin@spa.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
            ]
        );

        $this->command->info('Database seeded successfully!');
        $this->command->info('Admin login: admin@spa.com / password');

        // Only seed development data in local environment
        if (app()->environment('local')) {
            $this->command->info('Seeding development data...');

            // Create additional users
            User::factory(5)->create();

            // Create treatments
            \App\Models\Treatment::factory(15)->create();

            // Create 7 therapists as requested
            \App\Models\Therapist::factory(7)->create();

            // Create 5 rooms as requested
            \App\Models\Room::factory(5)->create();

            // Create products
            \App\Models\Product::factory(20)->create();

            // Create 300 bookings concentrated in April-July 2026
            \App\Models\Booking::factory(300)->create();

            $this->command->info('Created: 7 therapists, 5 rooms, 300 bookings');
        }
    }
}
