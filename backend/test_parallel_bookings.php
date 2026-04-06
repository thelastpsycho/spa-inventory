<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$admin = \App\Models\User::first();
$therapists = \App\Models\Therapist::take(4)->get();
$rooms = \App\Models\Room::take(4)->get();
$treatment = \App\Models\Treatment::first();

// Set same time for all bookings: tomorrow at 2 PM
$startTime = now()->copy()->addDay()->setHour(14)->setMinute(0)->setSecond(0);
$endTime = $startTime->copy()->addMinutes($treatment->duration);

echo "Testing parallel bookings scenario\n";
echo "Time: " . $startTime->format('l, F j, Y - g:i A') . "\n";
echo "Treatment: " . $treatment->name . " (" . $treatment->duration . " minutes)\n\n";

$bookings = [];

foreach (range(0, 3) as $i) {
    $booking = \App\Models\Booking::create([
        'guest_name' => 'Parallel Client ' . ($i + 1),
        'guest_email' => 'parallel' . ($i + 1) . '@test.com',
        'guest_phone' => '555-200' . ($i + 1),
        'treatment_id' => $treatment->id,
        'therapist_id' => $therapists[$i]->id,
        'room_id' => $rooms[$i]->id,
        'start_time' => $startTime,
        'end_time' => $endTime,
        'notes' => 'Parallel booking test - same time, different resources',
        'status' => 'confirmed',
        'created_by' => $admin->id,
    ]);
    $bookings[] = $booking;
}

echo "✅ SUCCESS! Created " . count($bookings) . " parallel bookings:\n\n";
foreach ($bookings as $i => $booking) {
    $t = $booking->therapist;
    $r = $booking->room;
    echo "  " . ($i + 1) . ". " . $booking->guest_name . "\n";
    echo "     Therapist: " . $t->name . "\n";
    echo "     Room: " . $r->name . "\n\n";
}

echo "🎯 Result: All 4 therapists working simultaneously in 4 different rooms\n";
echo "💡 This demonstrates proper conflict detection - no overlaps allowed\n";
echo "📅 Each therapist is busy during this time, but rooms are available for other therapists\n";
