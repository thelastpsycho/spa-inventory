<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update existing bookings to use new status names
        DB::statement("UPDATE bookings SET status = 'definite' WHERE status = 'confirmed'");
        DB::statement("UPDATE bookings SET status = 'cancelled' WHERE status = 'cancelled'");

        // Set default for future bookings
        DB::statement("ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'tentative'");

        // Add comment on table (PostgreSQL uses COMMENT ON COLUMN)
        DB::statement("COMMENT ON COLUMN bookings.status IS 'definite, tentative, waiting_list, cancelled'");
    }

    public function down(): void
    {
        // Revert to old status names
        DB::statement("UPDATE bookings SET status = 'confirmed' WHERE status = 'definite'");
        DB::statement("UPDATE bookings SET status = 'confirmed' WHERE status = 'tentative'");
        DB::statement("UPDATE bookings SET status = 'confirmed' WHERE status = 'waiting_list'");

        // Restore original default
        DB::statement("ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'confirmed'");

        // Restore original comment
        DB::statement("COMMENT ON COLUMN bookings.status IS 'confirmed, cancelled, completed'");
    }
};
