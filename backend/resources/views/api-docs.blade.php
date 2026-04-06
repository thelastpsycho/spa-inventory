<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $docs['name'] }} Documentation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

        body {
            font-family: 'Inter', sans-serif;
        }

        .font-display {
            font-family: 'Playfair Display', serif;
        }

        .gradient-bg {
            background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #065f46 100%);
        }

        .code-block {
            background: #1e293b;
            border-radius: 8px;
            padding: 16px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
            line-height: 1.6;
            color: #e2e8f0;
            overflow-x: auto;
        }

        .code-block .string { color: #86efac; }
        .code-block .number { color: #fcd34d; }
        .code-block .boolean { color: #f9a8d4; }
        .code-block .key { color: #93c5fd; }
        .code-block .comment { color: #64748b; }

        .endpoint-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;
        }

        .endpoint-card:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transform: translateY(-2px);
        }

        .method-badge {
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .method-get { background: #dcfce7; color: #166534; }
        .method-post { background: #dbeafe; color: #1e40af; }
        .method-put { background: #fef3c7; color: #92400e; }
        .method-delete { background: #fee2e2; color: #991b1b; }

        .nav-link {
            transition: all 0.2s ease;
        }

        .nav-link:hover {
            color: #d4af37;
            transform: translateX(4px);
        }

        .smooth-scroll {
            scroll-behavior: smooth;
        }
    </style>
</head>
<body class="bg-gray-50 smooth-scroll">
    <!-- Header -->
    <header class="gradient-bg text-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div class="text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
                    <span class="text-3xl font-display">S</span>
                </div>
                <h1 class="text-4xl md:text-5xl font-display font-semibold mb-4">{{ $docs['name'] }}</h1>
                <p class="text-xl text-emerald-100 max-w-2xl mx-auto mb-6">{{ $docs['description'] }}</p>
                <div class="flex items-center justify-center gap-4 text-sm">
                    <span class="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">Version {{ $docs['version'] }}</span>
                    <span class="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">{{ $docs['base_url'] }}</span>
                </div>
            </div>
        </div>

        <!-- Decorative elements -->
        <div class="absolute top-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-0 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl"></div>
    </header>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <!-- Sidebar Navigation -->
            <div class="lg:col-span-1">
                <nav class="lg:sticky lg:top-8 space-y-6">
                    <div>
                        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Links</h3>
                        <ul class="space-y-2">
                            <li><a href="#authentication" class="nav-link text-emerald-700 hover:text-emerald-900 block py-1">Authentication</a></li>
                            <li><a href="#therapists" class="nav-link text-emerald-700 hover:text-emerald-900 block py-1">Therapists</a></li>
                            <li><a href="#rooms" class="nav-link text-emerald-700 hover:text-emerald-900 block py-1">Rooms</a></li>
                            <li><a href="#treatments" class="nav-link text-emerald-700 hover:text-emerald-900 block py-1">Treatments</a></li>
                            <li><a href="#products" class="nav-link text-emerald-700 hover:text-emerald-900 block py-1">Products</a></li>
                            <li><a href="#bookings" class="nav-link text-emerald-700 hover:text-emerald-900 block py-1">Bookings</a></li>
                            <li><a href="#statistics" class="nav-link text-emerald-700 hover:text-emerald-900 block py-1">Statistics</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Test Credentials</h3>
                        <div class="bg-emerald-50 rounded-lg p-4">
                            <p class="text-sm text-gray-700 mb-1"><strong>Email:</strong> admin@spa.com</p>
                            <p class="text-sm text-gray-700"><strong>Password:</strong> password</p>
                        </div>
                    </div>
                </nav>
            </div>

            <!-- API Documentation -->
            <div class="lg:col-span-3 space-y-8">
                <!-- Authentication Section -->
                <section id="authentication" class="scroll-mt-8">
                    <h2 class="text-2xl font-display font-semibold text-emerald-900 mb-4 flex items-center gap-3">
                        <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Authentication
                    </h2>

                    <div class="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                        <p class="text-sm text-amber-900"><strong>Note:</strong> All protected endpoints require a Bearer token in the Authorization header.</p>
                        <div class="code-block mt-3">
                            <span class="key">Authorization:</span> <span class="string">Bearer {your_token}</span>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <!-- Register -->
                        <div class="endpoint-card p-6">
                            <div class="flex items-center gap-3 mb-4">
                                <span class="method-badge method-post">POST</span>
                                <code class="text-lg font-mono text-gray-800">/register</code>
                            </div>
                            <p class="text-gray-600 mb-4">Register a new user account</p>
                            <div class="code-block">
                                <span class="comment">// Request</span><br>
                                {<br>
                                &nbsp;&nbsp;<span class="key">"name"</span>: <span class="string">"John Doe"</span>,<br>
                                &nbsp;&nbsp;<span class="key">"email"</span>: <span class="string">"john@example.com"</span>,<br>
                                &nbsp;&nbsp;<span class="key">"password"</span>: <span class="string">"password123"</span><br>
                                }
                            </div>
                        </div>

                        <!-- Login -->
                        <div class="endpoint-card p-6">
                            <div class="flex items-center gap-3 mb-4">
                                <span class="method-badge method-post">POST</span>
                                <code class="text-lg font-mono text-gray-800">/login</code>
                                <span class="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Public</span>
                            </div>
                            <p class="text-gray-600 mb-4">Login and receive authentication token</p>
                            <div class="code-block">
                                <span class="comment">// Request</span><br>
                                {<br>
                                &nbsp;&nbsp;<span class="key">"email"</span>: <span class="string">"admin@spa.com"</span>,<br>
                                &nbsp;&nbsp;<span class="key">"password"</span>: <span class="string">"password"</span><br>
                                }<br><br>
                                <span class="comment">// Response</span><br>
                                {<br>
                                &nbsp;&nbsp;<span class="key">"user"</span>: { <span class="key">"id"</span>: <span class="number">1</span>, <span class="key">"name"</span>: <span class="string">"Admin"</span>, ... },<br>
                                &nbsp;&nbsp;<span class="key">"token"</span>: <span class="string">"1|abc123..."</span><br>
                                }
                            </div>
                        </div>

                        <!-- Get Current User -->
                        <div class="endpoint-card p-6">
                            <div class="flex items-center gap-3 mb-4">
                                <span class="method-badge method-get">GET</span>
                                <code class="text-lg font-mono text-gray-800">/me</code>
                                <span class="ml-auto text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Protected</span>
                            </div>
                            <p class="text-gray-600 mb-4">Get currently authenticated user details</p>
                            <div class="code-block">
                                <span class="comment">// Response</span><br>
                                {<br>
                                &nbsp;&nbsp;<span class="key">"id"</span>: <span class="number">1</span>,<br>
                                &nbsp;&nbsp;<span class="key">"name"</span>: <span class="string">"Admin"</span>,<br>
                                &nbsp;&nbsp;<span class="key">"email"</span>: <span class="string">"admin@spa.com"</span>,<br>
                                &nbsp;&nbsp;<span class="key">"role"</span>: <span class="string">"admin"</span><br>
                                }
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Therapists Section -->
                <section id="therapists" class="scroll-mt-8">
                    <h2 class="text-2xl font-display font-semibold text-emerald-900 mb-4 flex items-center gap-3">
                        <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Therapists
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-get">GET</span>
                                <code class="font-mono text-gray-800">/therapists</code>
                            </div>
                            <p class="text-sm text-gray-600">List all therapists</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-post">POST</span>
                                <code class="font-mono text-gray-800">/therapists</code>
                            </div>
                            <p class="text-sm text-gray-600">Create new therapist</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-get">GET</span>
                                <code class="font-mono text-gray-800">/therapists/{id}</code>
                            </div>
                            <p class="text-sm text-gray-600">Get specific therapist</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-put">PUT</span>
                                <code class="font-mono text-gray-800">/therapists/{id}</code>
                            </div>
                            <p class="text-sm text-gray-600">Update therapist</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-delete">DELETE</span>
                                <code class="font-mono text-gray-800">/therapists/{id}</code>
                            </div>
                            <p class="text-sm text-gray-600">Delete therapist</p>
                        </div>
                    </div>
                </section>

                <!-- Rooms Section -->
                <section id="rooms" class="scroll-mt-8">
                    <h2 class="text-2xl font-display font-semibold text-emerald-900 mb-4 flex items-center gap-3">
                        <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Rooms
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-get">GET</span>
                                <code class="font-mono text-gray-800">/rooms</code>
                            </div>
                            <p class="text-sm text-gray-600">List all rooms</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-post">POST</span>
                                <code class="font-mono text-gray-800">/rooms</code>
                            </div>
                            <p class="text-sm text-gray-600">Create new room</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-get">GET</span>
                                <code class="font-mono text-gray-800">/rooms/{id}</code>
                            </div>
                            <p class="text-sm text-gray-600">Get specific room</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-put">PUT</span>
                                <code class="font-mono text-gray-800">/rooms/{id}</code>
                            </div>
                            <p class="text-sm text-gray-600">Update room</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-delete">DELETE</span>
                                <code class="font-mono text-gray-800">/rooms/{id}</code>
                            </div>
                            <p class="text-sm text-gray-600">Delete room</p>
                        </div>
                    </div>
                </section>

                <!-- Treatments Section -->
                <section id="treatments" class="scroll-mt-8">
                    <h2 class="text-2xl font-display font-semibold text-emerald-900 mb-4 flex items-center gap-3">
                        <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Treatments
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-get">GET</span>
                                <code class="font-mono text-gray-800">/treatments</code>
                            </div>
                            <p class="text-sm text-gray-600">List all treatments</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-post">POST</span>
                                <code class="font-mono text-gray-800">/treatments</code>
                            </div>
                            <p class="text-sm text-gray-600">Create new treatment</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-get">GET</span>
                                <code class="font-mono text-gray-800">/treatments/{id}</code>
                            </div>
                            <p class="text-sm text-gray-600">Get specific treatment</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-put">PUT</span>
                                <code class="font-mono text-gray-800">/treatments/{id}</code>
                            </div>
                            <p class="text-sm text-gray-600">Update treatment</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-delete">DELETE</span>
                                <code class="font-mono text-gray-800">/treatments/{id}</code>
                            </div>
                            <p class="text-sm text-gray-600">Delete treatment</p>
                        </div>
                    </div>
                </section>

                <!-- Products Section -->
                <section id="products" class="scroll-mt-8">
                    <h2 class="text-2xl font-display font-semibold text-emerald-900 mb-4 flex items-center gap-3">
                        <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Products
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-get">GET</span>
                                <code class="font-mono text-gray-800">/products</code>
                            </div>
                            <p class="text-sm text-gray-600">List all products</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-get">GET</span>
                                <code class="font-mono text-gray-800">/products/low-stock</code>
                            </div>
                            <p class="text-sm text-gray-600">Get low stock products</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-post">POST</span>
                                <code class="font-mono text-gray-800">/products</code>
                            </div>
                            <p class="text-sm text-gray-600">Create new product</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-put">PUT</span>
                                <code class="font-mono text-gray-800">/products/{id}</code>
                            </div>
                            <p class="text-sm text-gray-600">Update product</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-delete">DELETE</span>
                                <code class="font-mono text-gray-800">/products/{id}</code>
                            </div>
                            <p class="text-sm text-gray-600">Delete product</p>
                        </div>
                    </div>
                </section>

                <!-- Bookings Section -->
                <section id="bookings" class="scroll-mt-8">
                    <h2 class="text-2xl font-display font-semibold text-emerald-900 mb-4 flex items-center gap-3">
                        <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Bookings
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-get">GET</span>
                                <code class="font-mono text-gray-800">/bookings</code>
                            </div>
                            <p class="text-sm text-gray-600">List all bookings</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-post">POST</span>
                                <code class="font-mono text-gray-800">/bookings</code>
                            </div>
                            <p class="text-sm text-gray-600">Create new booking</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-get">GET</span>
                                <code class="font-mono text-gray-800">/bookings/conflicts/check</code>
                            </div>
                            <p class="text-sm text-gray-600">Check booking conflicts</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-put">PUT</span>
                                <code class="font-mono text-gray-800">/bookings/{id}</code>
                            </div>
                            <p class="text-sm text-gray-600">Update booking</p>
                        </div>

                        <div class="endpoint-card p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="method-badge method-delete">DELETE</span>
                                <code class="font-mono text-gray-800">/bookings/{id}</code>
                            </div>
                            <p class="text-sm text-gray-600">Delete booking</p>
                        </div>
                    </div>
                </section>

                <!-- Statistics Section -->
                <section id="statistics" class="scroll-mt-8">
                    <h2 class="text-2xl font-display font-semibold text-emerald-900 mb-4 flex items-center gap-3">
                        <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Statistics
                    </h2>

                    <div class="endpoint-card p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="method-badge method-get">GET</span>
                            <code class="text-lg font-mono text-gray-800">/statistics</code>
                            <span class="ml-auto text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Protected</span>
                        </div>
                        <p class="text-gray-600 mb-4">Get spa statistics and analytics</p>
                        <div class="code-block">
                            <span class="comment">// Response</span><br>
                            {<br>
                            &nbsp;&nbsp;<span class="key">"total_bookings"</span>: <span class="number">150</span>,<br>
                            &nbsp;&nbsp;<span class="key">"total_revenue"</span>: <span class="number">45000.50</span>,<br>
                            &nbsp;&nbsp;<span class="key">"active_therapists"</span>: <span class="number">8</span>,<br>
                            &nbsp;&nbsp;<span class="key">"popular_treatments"</span>: [...]<br>
                            }
                        </div>
                    </div>
                </section>

                <!-- Health Check Section -->
                <section class="scroll-mt-8">
                    <h2 class="text-2xl font-display font-semibold text-emerald-900 mb-4 flex items-center gap-3">
                        <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Health Check
                    </h2>

                    <div class="endpoint-card p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="method-badge method-get">GET</span>
                            <code class="text-lg font-mono text-gray-800">/health</code>
                            <span class="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Public</span>
                        </div>
                        <p class="text-gray-600 mb-4">Check API health status</p>
                        <div class="code-block">
                            <span class="comment">// Response</span><br>
                            {<br>
                            &nbsp;&nbsp;<span class="key">"status"</span>: <span class="string">"ok"</span>,<br>
                            &nbsp;&nbsp;<span class="key">"timestamp"</span>: <span class="string">"2026-04-06T13:57:02.236818Z"</span><br>
                            }
                        </div>
                    </div>
                </section>

                <!-- Error Codes -->
                <section class="mt-12 p-6 bg-white rounded-xl shadow-lg">
                    <h2 class="text-xl font-display font-semibold text-emerald-900 mb-4">HTTP Status Codes</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex items-start gap-3">
                            <span class="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">401</span>
                            <p class="text-sm text-gray-600">Unauthorized - Invalid or missing authentication token</p>
                        </div>
                        <div class="flex items-start gap-3">
                            <span class="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">403</span>
                            <p class="text-sm text-gray-600">Forbidden - You don't have permission to access this resource</p>
                        </div>
                        <div class="flex items-start gap-3">
                            <span class="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">404</span>
                            <p class="text-sm text-gray-600">Not Found - Resource not found</p>
                        </div>
                        <div class="flex items-start gap-3">
                            <span class="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">422</span>
                            <p class="text-sm text-gray-600">Validation Error - Invalid input data</p>
                        </div>
                        <div class="flex items-start gap-3">
                            <span class="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">500</span>
                            <p class="text-sm text-gray-600">Server Error - Something went wrong on the server</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p class="text-gray-400 text-sm">&copy; 2026 Kael Luxury Spa Management. All rights reserved.</p>
            <p class="text-gray-500 text-xs mt-2">API Documentation v{{ $docs['version'] }}</p>
        </div>
    </footer>
</body>
</html>