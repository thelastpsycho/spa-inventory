<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ApiDocumentationController extends Controller
{
    public function index()
    {
        $apiUrl = config('app.url') . '/api';

        return view('api-docs', [
            'apiUrl' => $apiUrl,
            'docs' => [
                'name' => 'Spa Booking API',
                'version' => '1.0.0',
                'description' => 'API for managing spa operations including therapists, rooms, treatments, products, and bookings',
                'base_url' => $apiUrl,
            ]
        ]);
    }
}