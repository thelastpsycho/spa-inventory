<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the Laravel RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return response()->json([
        'message' => 'Spa Booking API',
        'version' => '1.0.0',
        'endpoints' => [
            'auth' => '/api/register, /api/login',
            'bookings' => '/api/bookings',
            'resources' => '/api/therapists, /api/rooms, /api/treatments',
            'inventory' => '/api/products',
        ]
    ]);
});
