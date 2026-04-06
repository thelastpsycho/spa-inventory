<?php

namespace App\Http\Controllers;

use App\Models\Treatment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TreatmentController extends Controller
{
    public function index(): JsonResponse
    {
        $treatments = Treatment::active()->get();

        return response()->json($treatments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration' => ['required', 'integer', 'min:1'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $treatment = Treatment::create($validated);

        return response()->json($treatment, 201);
    }

    public function show(Treatment $treatment): JsonResponse
    {
        return response()->json($treatment);
    }

    public function update(Request $request, Treatment $treatment): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration' => ['integer', 'min:1'],
            'price' => ['numeric', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $treatment->update($validated);

        return response()->json($treatment);
    }

    public function destroy(Treatment $treatment): JsonResponse
    {
        $treatment->delete();

        return response()->json([
            'message' => 'Treatment deleted successfully',
        ]);
    }
}
