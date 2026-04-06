<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\TherapistController;
use App\Http\Controllers\TreatmentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Therapists
    Route::apiResource('therapists', TherapistController::class);

    // Rooms
    Route::apiResource('rooms', RoomController::class);

    // Treatments
    Route::apiResource('treatments', TreatmentController::class);

    // Products
    Route::apiResource('products', ProductController::class);
    Route::get('/products/low-stock', [ProductController::class, 'index']);

    // Bookings
    Route::apiResource('bookings', BookingController::class);
    Route::get('/bookings/conflicts/check', [BookingController::class, 'checkConflicts']);

    // Statistics
    Route::get('/statistics', [StatisticsController::class, 'index']);
});
Route::get('/api/health', function () { return response()->json(['status' => 'ok', 'timestamp' => now()]); });
