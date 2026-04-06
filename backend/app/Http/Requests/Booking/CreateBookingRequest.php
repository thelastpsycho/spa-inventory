<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class CreateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['nullable', 'string', 'email', 'max:255'],
            'guest_phone' => ['nullable', 'string', 'max:50'],
            'treatment_id' => ['required', 'exists:treatments,id'],
            'therapist_id' => ['required', 'exists:therapists,id'],
            'room_id' => ['required', 'exists:rooms,id'],
            'start_time' => ['required', 'date', 'after:now'],
            'end_time' => ['nullable', 'date', 'after:start_time'],
            'duration' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
            'products' => ['array'],
            'products.*.product_id' => ['required', 'exists:products,id'],
            'products.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }
}
