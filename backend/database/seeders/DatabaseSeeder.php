<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        User::factory()->create([
            'email' => 'admin@spa.com',
        ]);

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
        // The factory automatically handles business hours and realistic scheduling
        \App\Models\Booking::factory(300)->create();

        $this->command->info('Database seeded successfully!');
        $this->command->info('Admin login: admin@spa.com / password');
        $this->command->info('Created: 7 therapists, 5 rooms, 300 bookings');
        $this->command->info('Bookings concentrated in April-July 2026');
    }
}
