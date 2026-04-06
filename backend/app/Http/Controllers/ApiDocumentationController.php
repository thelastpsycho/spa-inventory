<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

class ApiDocumentationController extends Controller
{
    public function index()
    {
        $apiUrl = config('app.url') . '/api';

        // Get all API routes
        $routes = collect(Route::getRoutes()->get())
            ->filter(function ($route) {
                // Filter to only include API routes (excluding docs itself)
                $uri = $route->uri;
                return str_starts_with($uri, 'api') && !str_ends_with($uri, 'docs');
            })
            ->map(function ($route) {
                $methods = array_diff($route->methods, ['HEAD']);
                $middleware = $route->middleware();
                $isProtected = in_array('auth:sanctum', $middleware);

                // Clean up the path
                $path = str_replace('api/', '', $route->uri);

                // Extract controller info
                $action = $route->getActionName();
                if (strpos($action, '@') !== false) {
                    [$controller, $method] = explode('@', $action);
                    $controller = class_basename($controller);
                    $action = $controller . '@' . $method;
                }

                return [
                    'method' => reset($methods),
                    'path' => $path,
                    'action' => $action,
                    'protected' => $isProtected,
                ];
            })
            ->groupBy(function ($route) {
                // Group by resource
                $path = $route['path'];
                if (preg_match('#^(\w+)#', $path, $matches)) {
                    $resource = $matches[1];
                    // Map common patterns
                    if (in_array($resource, ['login', 'register', 'me', 'logout'])) {
                        return 'auth';
                    }
                    if (in_array($resource, ['health'])) {
                        return 'health';
                    }
                    return $resource;
                }
                return 'other';
            })
            ->sortKeys()
            ->toArray();

        return view('api-docs', [
            'apiUrl' => $apiUrl,
            'docs' => [
                'name' => 'Spa Booking API',
                'version' => '1.0.0',
                'description' => 'API for managing spa operations including therapists, rooms, treatments, products, and bookings',
                'base_url' => $apiUrl,
            ],
            'routes' => $routes,
        ]);
    }
}