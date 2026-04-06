<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'guest_name' => ['sometimes', 'string', 'max:255'],
            'guest_email' => ['nullable', 'string', 'email', 'max:255'],
            'guest_phone' => ['nullable', 'string', 'max:50'],
            'treatment_id' => ['sometimes', 'exists:treatments,id'],
            'therapist_id' => ['sometimes', 'exists:therapists,id'],
            'room_id' => ['sometimes', 'exists:rooms,id'],
            'start_time' => ['sometimes', 'date'],
            'end_time' => ['nullable', 'date', 'after:start_time'],
            'duration' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:confirmed,cancelled,completed'],
            'products' => ['array'],
            'products.*.product_id' => ['required', 'exists:products,id'],
            'products.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }
}
