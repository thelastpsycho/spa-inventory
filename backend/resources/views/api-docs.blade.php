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
                    @foreach($routes as $group => $endpoints)
                        @if(in_array($group, ['auth', 'health']))
                            @continue
                        @endif
                        <li>
                            <a href="#{{ $group }}" class="block py-2 px-3 rounded hover:bg-slate-800">
                                {{ ucfirst($group) }}
                            </a>
                        </li>
                    @endforeach
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

                <!-- Auth Instructions -->
                @if(isset($routes['auth']))
                <section id="auth-info" class="mb-8 bg-slate-50 border border-slate-200 rounded-lg p-6">
                    <h2 class="text-lg font-bold text-slate-900 mb-3">🔐 Authentication</h2>
                    <p class="text-sm text-slate-700 mb-3">
                        Protected endpoints require a Bearer token. Include it in the Authorization header:
                    </p>
                    <div class="bg-slate-800 text-green-400 p-3 rounded font-mono text-sm">
                        Authorization: Bearer {your_token}
                    </div>
                    <p class="text-xs text-slate-600 mt-3">
                        💡 Get your token by logging in to <code>/login</code> first
                    </p>
                </section>
                @endif

                @foreach($routes as $group => $endpoints)
                    @if(in_array($group, ['health']))
                        @continue
                    @endif

                    <section id="{{ $group }}" class="mb-8">
                        @if($group === 'auth')
                            <h2 class="text-xl font-bold text-slate-900 mb-4">Authentication</h2>
                        @else
                            <h2 class="text-xl font-bold text-slate-900 mb-4">{{ ucfirst($group) }}</h2>
                        @endif

                        <div class="grid grid-cols-1 gap-3">
                            @foreach($endpoints as $endpoint)
                                <div class="border border-slate-200 rounded-lg p-4">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="method-badge method-{{ strtolower($endpoint['method']) }}">
                                            {{ $endpoint['method'] }}
                                        </span>
                                        <code class="text-sm">/{{ $endpoint['path'] }}</code>
                                        @if($endpoint['protected'])
                                            <span class="ml-auto text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Protected</span>
                                        @else
                                            <span class="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Public</span>
                                        @endif
                                    </div>
                                    <p class="text-xs text-slate-600">
                                        → {{ $endpoint['action'] }}
                                    </p>
                                </div>
                            @endforeach
                        </div>
                    </section>
                @endforeach

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