<?php

namespace App\Http\Controllers;

use App\Http\Requests\Booking\CreateBookingRequest;
use App\Http\Requests\Booking\UpdateBookingRequest;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(
        private BookingService $bookingService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $bookings = $this->bookingService->getBookings(
            startDate: $request->query('start'),
            endDate: $request->query('end'),
            therapistId: $request->query('therapist_id'),
            roomId: $request->query('room_id'),
            treatmentId: $request->query('treatment_id'),
            search: $request->query('search'),
            includeCancelled: $request->query('include_cancelled') === 'true',
        );

        return response()->json($bookings);
    }

    public function store(CreateBookingRequest $request): JsonResponse
    {
        $booking = $this->bookingService->createBooking($request->validated());

        return response()->json($booking, 201);
    }

    public function show(Booking $booking): JsonResponse
    {
        $booking->load(['treatment', 'therapist', 'room', 'products', 'createdBy']);

        return response()->json($booking);
    }

    public function update(UpdateBookingRequest $request, Booking $booking): JsonResponse
    {
        $booking = $this->bookingService->updateBooking($booking, $request->validated());

        return response()->json($booking);
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $this->bookingService->deleteBooking($booking);

        return response()->json([
            'message' => 'Booking deleted successfully',
        ]);
    }

    public function checkConflicts(Request $request): JsonResponse
    {
        $conflicts = $this->bookingService->checkConflicts(
            therapistId: $request->query('therapist_id'),
            roomId: $request->query('room_id'),
            startTime: $request->query('start_time'),
            endTime: $request->query('end_time'),
            excludeBookingId: $request->query('exclude_booking_id'),
        );

        return response()->json([
            'has_conflicts' => $conflicts->isNotEmpty(),
            'conflicts' => $conflicts,
        ]);
    }
}
