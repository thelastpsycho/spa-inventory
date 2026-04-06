<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $docs['name'] }} Documentation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .code-block {
            background: #1e293b;
            border-radius: 6px;
            padding: 12px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 12px;
            color: #e2e8f0;
            overflow-x: auto;
        }
        .code-block .string { color: #86efac; }
        .code-block .key { color: #93c5fd; }
        .code-block .comment { color: #64748b; }
        .method-badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .method-get { background: #dcfce7; color: #166534; }
        .method-post { background: #dbeafe; color: #1e40af; }
        .method-put { background: #fef3c7; color: #92400e; }
        .method-delete { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body class="bg-white">
    <div class="flex h-screen">
        <!-- Sidebar -->
        <div class="w-64 bg-slate-900 text-white flex-shrink-0">
            <div class="p-6 border-b border-slate-700">
                <h1 class="text-xl font-semibold">{{ $docs['name'] }}</h1>
                <p class="text-slate-400 text-sm mt-1">v{{ $docs['version'] }}</p>
            </div>
            <nav class="p-4">
                <ul class="space-y-2 text-sm">
                    <li><a href="#auth" class="block py-2 px-3 rounded hover:bg-slate-800">Authentication</a></li>
                    <li><a href="#therapists" class="block py-2 px-3 rounded hover:bg-slate-800">Therapists</a></li>
                    <li><a href="#rooms" class="block py-2 px-3 rounded hover:bg-slate-800">Rooms</a></li>
                    <li><a href="#treatments" class="block py-2 px-3 rounded hover:bg-slate-800">Treatments</a></li>
                    <li><a href="#products" class="block py-2 px-3 rounded hover:bg-slate-800">Products</a></li>
                    <li><a href="#bookings" class="block py-2 px-3 rounded hover:bg-slate-800">Bookings</a></li>
                    <li><a href="#statistics" class="block py-2 px-3 rounded hover:bg-slate-800">Statistics</a></li>
                </ul>
            </nav>
            <div class="p-4 border-t border-slate-700">
                <p class="text-xs text-slate-400 mb-2">Test Credentials:</p>
                <p class="text-xs text-slate-300">admin@spa.com</p>
                <p class="text-xs text-slate-300">password</p>
            </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto">
            <div class="max-w-4xl mx-auto p-8">
                <!-- Header -->
                <div class="mb-8">
                    <h1 class="text-3xl font-bold text-slate-900">{{ $docs['name'] }}</h1>
                    <p class="text-slate-600 mt-2">{{ $docs['description'] }}</p>
                    <p class="text-sm text-slate-500 mt-1">{{ $docs['base_url'] }}</p>
                </div>

                <!-- Auth Section -->
                <section id="auth" class="mb-8">
                    <h2 class="text-xl font-bold text-slate-900 mb-4">Authentication</h2>
                    <div class="bg-slate-50 p-4 rounded-lg mb-4">
                        <p class="text-sm text-slate-700">Include token in Authorization header:</p>
                        <div class="code-block mt-2">
                            Authorization: Bearer {token}
                        </div>
                    </div>

                    <div class="space-y-3">
                        <div class="border border-slate-200 rounded-lg p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="method-badge method-post">POST</span>
                                <code class="text-sm">/login</code>
                            </div>
                            <div class="code-block">
                                {<span class="key">"email"</span>: <span class="string">"admin@spa.com"</span>, <span class="key">"password"</span>: <span class="string">"password"</span>}
                            </div>
                        </div>

                        <div class="border border-slate-200 rounded-lg p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="method-badge method-post">POST</span>
                                <code class="text-sm">/register</code>
                            </div>
                            <div class="code-block">
                                {<span class="key">"name"</span>: <span class="string">"John"</span>, <span class="key">"email"</span>: <span class="string">"john@example.com"</span>, <span class="key">"password"</span>: <span class="string">"pass123"</span>}
                            </div>
                        </div>

                        <div class="border border-slate-200 rounded-lg p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="method-badge method-get">GET</span>
                                <code class="text-sm">/me</code>
                            </div>
                            <p class="text-xs text-slate-600">Returns current user</p>
                        </div>
                    </div>
                </section>

                <!-- Therapists -->
                <section id="therapists" class="mb-8">
                    <h2 class="text-xl font-bold text-slate-900 mb-4">Therapists</h2>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-get">GET</span>
                                <code class="text-xs">/therapists</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-post">POST</span>
                                <code class="text-xs">/therapists</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-get">GET</span>
                                <code class="text-xs">/therapists/{id}</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-put">PUT</span>
                                <code class="text-xs">/therapists/{id}</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-delete">DELETE</span>
                                <code class="text-xs">/therapists/{id}</code>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Rooms -->
                <section id="rooms" class="mb-8">
                    <h2 class="text-xl font-bold text-slate-900 mb-4">Rooms</h2>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-get">GET</span>
                                <code class="text-xs">/rooms</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-post">POST</span>
                                <code class="text-xs">/rooms</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-get">GET</span>
                                <code class="text-xs">/rooms/{id}</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-put">PUT</span>
                                <code class="text-xs">/rooms/{id}</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-delete">DELETE</span>
                                <code class="text-xs">/rooms/{id}</code>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Treatments -->
                <section id="treatments" class="mb-8">
                    <h2 class="text-xl font-bold text-slate-900 mb-4">Treatments</h2>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-get">GET</span>
                                <code class="text-xs">/treatments</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-post">POST</span>
                                <code class="text-xs">/treatments</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-get">GET</span>
                                <code class="text-xs">/treatments/{id}</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-put">PUT</span>
                                <code class="text-xs">/treatments/{id}</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-delete">DELETE</span>
                                <code class="text-xs">/treatments/{id}</code>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Products -->
                <section id="products" class="mb-8">
                    <h2 class="text-xl font-bold text-slate-900 mb-4">Products</h2>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-get">GET</span>
                                <code class="text-xs">/products</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-get">GET</span>
                                <code class="text-xs">/products/low-stock</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-post">POST</span>
                                <code class="text-xs">/products</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-put">PUT</span>
                                <code class="text-xs">/products/{id}</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-delete">DELETE</span>
                                <code class="text-xs">/products/{id}</code>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Bookings -->
                <section id="bookings" class="mb-8">
                    <h2 class="text-xl font-bold text-slate-900 mb-4">Bookings</h2>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-get">GET</span>
                                <code class="text-xs">/bookings</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-post">POST</span>
                                <code class="text-xs">/bookings</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-get">GET</span>
                                <code class="text-xs">/bookings/conflicts/check</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-put">PUT</span>
                                <code class="text-xs">/bookings/{id}</code>
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-lg p-3">
                            <div class="flex items-center gap-2">
                                <span class="method-badge method-delete">DELETE</span>
                                <code class="text-xs">/bookings/{id}</code>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Statistics -->
                <section id="statistics" class="mb-8">
                    <h2 class="text-xl font-bold text-slate-900 mb-4">Statistics</h2>
                    <div class="border border-slate-200 rounded-lg p-3">
                        <div class="flex items-center gap-2">
                            <span class="method-badge method-get">GET</span>
                            <code class="text-xs">/statistics</code>
                        </div>
                    </div>
                </section>

                <!-- Status Codes -->
                <section class="mt-12 pt-8 border-t border-slate-200">
                    <h2 class="text-lg font-bold text-slate-900 mb-3">Status Codes</h2>
                    <div class="flex flex-wrap gap-2 text-sm">
                        <span class="px-3 py-1 bg-slate-100 rounded">200 OK</span>
                        <span class="px-3 py-1 bg-slate-100 rounded">401 Unauthorized</span>
                        <span class="px-3 py-1 bg-slate-100 rounded">403 Forbidden</span>
                        <span class="px-3 py-1 bg-slate-100 rounded">404 Not Found</span>
                        <span class="px-3 py-1 bg-slate-100 rounded">422 Validation Error</span>
                        <span class="px-3 py-1 bg-slate-100 rounded">500 Server Error</span>
                    </div>
                </section>
            </div>
        </div>
    </div>
</body>
</html>