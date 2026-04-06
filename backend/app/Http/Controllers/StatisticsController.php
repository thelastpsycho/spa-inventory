<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Therapist;
use App\Models\Room;
use App\Models\Treatment;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatisticsController extends Controller
{
    /**
     * Get comprehensive statistics for the SPA
     */
    public function index(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        // If no date range provided, use current month
        if (!$startDate || !$endDate) {
            $startDate = now()->startOfMonth()->toDateString();
            $endDate = now()->endOfMonth()->toDateString();
        }

        // Basic counts
        $totalBookings = Booking::whereBetween('start_time', [$startDate, $endDate])->count();
        $definiteBookings = Booking::whereBetween('start_time', [$startDate, $endDate])
            ->where('status', 'definite')->count();
        $tentativeBookings = Booking::whereBetween('start_time', [$startDate, $endDate])
            ->where('status', 'tentative')->count();
        $waitingListBookings = Booking::whereBetween('start_time', [$startDate, $endDate])
            ->where('status', 'waiting_list')->count();
        $cancelledBookings = Booking::whereBetween('start_time', [$startDate, $endDate])
            ->where('status', 'cancelled')->count();

        // Therapist stats
        $totalTherapists = Therapist::count();
        $activeTherapists = Therapist::where('is_active', true)->count();

        // Room stats
        $totalRooms = Room::count();
        $totalCapacity = Room::sum('capacity');

        // Treatment stats
        $totalTreatments = Treatment::count();
        $activeTreatments = Treatment::where('is_active', true)->count();

        // Revenue calculation (only definite and tentative bookings count for revenue)
        $bookingsWithRevenue = Booking::whereBetween('start_time', [$startDate, $endDate])
            ->whereIn('status', ['definite', 'tentative'])
            ->with('treatment')
            ->get();

        $totalRevenue = $bookingsWithRevenue->sum(function ($booking) {
            return $booking->treatment?->price ?? 0;
        });

        // Treatment hours calculation
        $totalTreatmentHours = $bookingsWithRevenue->sum(function ($booking) {
            return $booking->duration ?? 0;
        }) / 60; // Convert minutes to hours

        // Average booking value
        $confirmedBookingsCount = $definiteBookings + $tentativeBookings;
        $averageBookingValue = $confirmedBookingsCount > 0
            ? $totalRevenue / $confirmedBookingsCount
            : 0;

        // Therapist performance
        $therapistStats = Therapist::with(['bookings' => function ($query) use ($startDate, $endDate) {
            $query->whereBetween('start_time', [$startDate, $endDate])
                ->whereIn('status', ['definite', 'tentative']);
        }, 'bookings.treatment'])
        ->get()
        ->map(function ($therapist) {
            $bookings = $therapist->bookings;
            $totalHours = $bookings->sum('duration') / 60;
            $revenue = $bookings->sum(function ($booking) {
                return $booking->treatment?->price ?? 0;
            });

            return [
                'id' => $therapist->id,
                'name' => $therapist->name,
                'email' => $therapist->email,
                'total_bookings' => $bookings->count(),
                'total_hours' => round($totalHours, 2),
                'total_revenue' => round($revenue, 2),
                'average_booking_value' => $bookings->count() > 0
                    ? round($revenue / $bookings->count(), 2)
                    : 0,
            ];
        })->sortByDesc('total_revenue')->values();

        // Room utilization
        $roomStats = Room::with(['bookings' => function ($query) use ($startDate, $endDate) {
            $query->whereBetween('start_time', [$startDate, $endDate])
                ->whereIn('status', ['definite', 'tentative']);
        }])
        ->get()
        ->map(function ($room) {
            $bookings = $room->bookings;
            $totalHours = $bookings->sum('duration') / 60;

            return [
                'id' => $room->id,
                'name' => $room->name,
                'capacity' => $room->capacity,
                'total_bookings' => $bookings->count(),
                'total_hours' => round($totalHours, 2),
                'utilization_percentage' => $totalHours > 0
                    ? round(($totalHours / ($room->capacity * 8 * 30)) * 100, 2)
                    : 0, // Assuming 8 working hours/day for 30 days
            ];
        })->sortByDesc('total_bookings')->values();

        // Treatment popularity
        $treatmentStats = Treatment::with(['bookings' => function ($query) use ($startDate, $endDate) {
            $query->whereBetween('start_time', [$startDate, $endDate])
                ->whereIn('status', ['definite', 'tentative']);
        }])
        ->get()
        ->map(function ($treatment) {
            $bookings = $treatment->bookings;
            $revenue = $bookings->count() * $treatment->price;

            return [
                'id' => $treatment->id,
                'name' => $treatment->name,
                'duration' => $treatment->duration,
                'price' => round($treatment->price, 2),
                'total_bookings' => $bookings->count(),
                'total_revenue' => round($revenue, 2),
                'revenue_percentage' => 0, // Will calculate after total
            ];
        })->sortByDesc('total_bookings')->values();

        // Calculate revenue percentage for treatments
        $totalTreatmentRevenue = $treatmentStats->sum('total_revenue');
        $treatmentStats = $treatmentStats->map(function ($treatment) use ($totalTreatmentRevenue) {
            $treatment['revenue_percentage'] = $totalTreatmentRevenue > 0
                ? round(($treatment['total_revenue'] / $totalTreatmentRevenue) * 100, 2)
                : 0;
            return $treatment;
        });

        // Inventory stats
        $totalProducts = Product::count();
        $lowStockProducts = Product::where('quantity', '<=', DB::raw('reorder_level'))->count();
        $products = Product::all();
        $totalInventoryValue = $products->sum(function ($product) {
            return $product->quantity * $product->cost;
        });

        // Occupancy rate calculation
        $workingDays = 30; // Assuming 30 days period
        $workingHoursPerDay = 8; // 8 working hours per day
        $totalPossibleHours = $totalCapacity * $workingHoursPerDay * $workingDays;
        $occupancyRate = $totalPossibleHours > 0
            ? round(($totalTreatmentHours / $totalPossibleHours) * 100, 2)
            : 0;

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'overview' => [
                'total_bookings' => $totalBookings,
                'definite_bookings' => $definiteBookings,
                'tentative_bookings' => $tentativeBookings,
                'waiting_list_bookings' => $waitingListBookings,
                'cancelled_bookings' => $cancelledBookings,
                'total_revenue' => round($totalRevenue, 2),
                'total_treatment_hours' => round($totalTreatmentHours, 2),
                'average_booking_value' => round($averageBookingValue, 2),
                'occupancy_rate' => $occupancyRate,
            ],
            'resources' => [
                'total_therapists' => $totalTherapists,
                'active_therapists' => $activeTherapists,
                'total_rooms' => $totalRooms,
                'total_capacity' => $totalCapacity,
                'total_treatments' => $totalTreatments,
                'active_treatments' => $activeTreatments,
            ],
            'inventory' => [
                'total_products' => $totalProducts,
                'low_stock_products' => $lowStockProducts,
                'total_inventory_value' => round($totalInventoryValue, 2),
            ],
            'therapist_performance' => $therapistStats,
            'room_utilization' => $roomStats,
            'treatment_popularity' => $treatmentStats,
        ]);
    }
}