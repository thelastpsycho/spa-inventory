<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ApiDocumentationController extends Controller
{
    public function index()
    {
        $apiUrl = config('app.url') . '/api';

        return response()->json([
            'name' => 'Spa Booking API',
            'version' => '1.0.0',
            'description' => 'API for managing spa operations including therapists, rooms, treatments, products, and bookings',
            'base_url' => $apiUrl,
            'endpoints' => [
                'authentication' => [
                    'POST /register' => [
                        'description' => 'Register a new user',
                        'public' => true,
                        'request' => [
                            'name' => 'string (required)',
                            'email' => 'string (required, email)',
                            'password' => 'string (required, min:8)',
                        ],
                        'response' => [
                            'user' => 'User object',
                            'token' => 'Authentication token'
                        ]
                    ],
                    'POST /login' => [
                        'description' => 'Login user and get token',
                        'public' => true,
                        'request' => [
                            'email' => 'string (required, email)',
                            'password' => 'string (required)',
                        ],
                        'response' => [
                            'user' => 'User object',
                            'token' => 'Authentication token'
                        ]
                    ],
                    'POST /logout' => [
                        'description' => 'Logout user (requires auth)',
                        'public' => false,
                        'headers' => [
                            'Authorization' => 'Bearer {token}'
                        ]
                    ],
                    'GET /me' => [
                        'description' => 'Get current authenticated user',
                        'public' => false,
                        'headers' => [
                            'Authorization' => 'Bearer {token}'
                        ],
                        'response' => [
                            'user' => 'User object'
                        ]
                    ]
                ],
                'therapists' => [
                    'GET /therapists' => [
                        'description' => 'List all therapists',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}'],
                        'response' => ['data' => 'Array of therapists']
                    ],
                    'POST /therapists' => [
                        'description' => 'Create new therapist',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}'],
                        'request' => [
                            'name' => 'string (required)',
                            'email' => 'string (required, email)',
                            'phone' => 'string',
                            'specialization' => 'string'
                        ]
                    ],
                    'GET /therapists/{id}' => [
                        'description' => 'Get specific therapist',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ],
                    'PUT /therapists/{id}' => [
                        'description' => 'Update therapist',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ],
                    'DELETE /therapists/{id}' => [
                        'description' => 'Delete therapist',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ]
                ],
                'rooms' => [
                    'GET /rooms' => [
                        'description' => 'List all rooms',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}'],
                        'response' => ['data' => 'Array of rooms']
                    ],
                    'POST /rooms' => [
                        'description' => 'Create new room',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}'],
                        'request' => [
                            'name' => 'string (required)',
                            'capacity' => 'integer',
                            'price_per_hour' => 'numeric',
                            'amenities' => 'array'
                        ]
                    ],
                    'GET /rooms/{id}' => [
                        'description' => 'Get specific room',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ],
                    'PUT /rooms/{id}' => [
                        'description' => 'Update room',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ],
                    'DELETE /rooms/{id}' => [
                        'description' => 'Delete room',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ]
                ],
                'treatments' => [
                    'GET /treatments' => [
                        'description' => 'List all treatments',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}'],
                        'response' => ['data' => 'Array of treatments']
                    ],
                    'POST /treatments' => [
                        'description' => 'Create new treatment',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}'],
                        'request' => [
                            'name' => 'string (required)',
                            'description' => 'string',
                            'duration' => 'integer (minutes)',
                            'price' => 'numeric'
                        ]
                    ],
                    'GET /treatments/{id}' => [
                        'description' => 'Get specific treatment',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ],
                    'PUT /treatments/{id}' => [
                        'description' => 'Update treatment',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ],
                    'DELETE /treatments/{id}' => [
                        'description' => 'Delete treatment',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ]
                ],
                'products' => [
                    'GET /products' => [
                        'description' => 'List all products',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}'],
                        'response' => ['data' => 'Array of products']
                    ],
                    'GET /products/low-stock' => [
                        'description' => 'Get low stock products',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ],
                    'POST /products' => [
                        'description' => 'Create new product',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}'],
                        'request' => [
                            'name' => 'string (required)',
                            'description' => 'string',
                            'stock_quantity' => 'integer',
                            'min_stock_level' => 'integer',
                            'price' => 'numeric'
                        ]
                    ],
                    'GET /products/{id}' => [
                        'description' => 'Get specific product',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ],
                    'PUT /products/{id}' => [
                        'description' => 'Update product',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ],
                    'DELETE /products/{id}' => [
                        'description' => 'Delete product',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ]
                ],
                'bookings' => [
                    'GET /bookings' => [
                        'description' => 'List all bookings',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}'],
                        'response' => ['data' => 'Array of bookings']
                    ],
                    'POST /bookings' => [
                        'description' => 'Create new booking',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}'],
                        'request' => [
                            'customer_name' => 'string (required)',
                            'customer_email' => 'string (required, email)',
                            'therapist_id' => 'integer (required)',
                            'room_id' => 'integer (required)',
                            'treatment_id' => 'integer (required)',
                            'start_time' => 'datetime (required)',
                            'end_time' => 'datetime (required)',
                            'notes' => 'string'
                        ]
                    ],
                    'GET /bookings/{id}' => [
                        'description' => 'Get specific booking',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ],
                    'PUT /bookings/{id}' => [
                        'description' => 'Update booking',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ],
                    'DELETE /bookings/{id}' => [
                        'description' => 'Delete booking',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}']
                    ],
                    'GET /bookings/conflicts/check' => [
                        'description' => 'Check for booking conflicts',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}'],
                        'request' => [
                            'therapist_id' => 'integer',
                            'room_id' => 'integer',
                            'start_time' => 'datetime',
                            'end_time' => 'datetime'
                        ]
                    ]
                ],
                'statistics' => [
                    'GET /statistics' => [
                        'description' => 'Get spa statistics',
                        'public' => false,
                        'headers' => ['Authorization' => 'Bearer {token}'],
                        'response' => [
                            'total_bookings' => 'integer',
                            'total_revenue' => 'numeric',
                            'active_therapists' => 'integer',
                            'popular_treatments' => 'array'
                        ]
                    ]
                ],
                'health' => [
                    'GET /health' => [
                        'description' => 'API health check',
                        'public' => true,
                        'response' => [
                            'status' => 'string',
                            'timestamp' => 'datetime'
                        ]
                    ]
                ]
            ],
            'authentication' => [
                'method' => 'Bearer Token',
                'header' => 'Authorization: Bearer {your_token}',
                'description' => 'Include your authentication token in the Authorization header for protected routes'
            ],
            'errors' => [
                '401' => 'Unauthorized - Invalid or missing authentication token',
                '403' => 'Forbidden - You don\'t have permission to access this resource',
                '404' => 'Not Found - Resource not found',
                '422' => 'Validation Error - Invalid input data',
                '500' => 'Server Error - Something went wrong on the server'
            ],
            'test_credentials' => [
                'email' => 'admin@spa.com',
                'password' => 'password'
            ]
        ]);
    }
}