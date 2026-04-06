<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('guest_name');
            $table->string('guest_email')->nullable();
            $table->string('guest_phone')->nullable();
            $table->foreignId('treatment_id')->constrained()->onDelete('restrict');
            $table->foreignId('therapist_id')->constrained()->onDelete('restrict');
            $table->foreignId('room_id')->constrained()->onDelete('restrict');
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->text('notes')->nullable();
            $table->string('status')->default('confirmed'); // confirmed, cancelled, completed
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            // Indexes for conflict detection and queries
            $table->index(['therapist_id', 'start_time', 'end_time']);
            $table->index(['room_id', 'start_time', 'end_time']);
            $table->index(['status', 'start_time']);
            $table->index('guest_name');
            $table->index('guest_phone');
            $table->index('guest_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
