<?php

namespace App\Http\Controllers;

use App\Models\Therapist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TherapistController extends Controller
{
    public function index(): JsonResponse
    {
        $therapists = Therapist::active()->get();

        return response()->json($therapists);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $therapist = Therapist::create($validated);

        return response()->json($therapist, 201);
    }

    public function show(Therapist $therapist): JsonResponse
    {
        return response()->json($therapist);
    }

    public function update(Request $request, Therapist $therapist): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $therapist->update($validated);

        return response()->json($therapist);
    }

    public function destroy(Therapist $therapist): JsonResponse
    {
        $therapist->delete();

        return response()->json([
            'message' => 'Therapist deleted successfully',
        ]);
    }
}
