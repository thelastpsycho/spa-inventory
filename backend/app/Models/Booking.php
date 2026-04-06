<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends \Illuminate\Database\Eloquent\Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'guest_name',
        'guest_email',
        'guest_phone',
        'treatment_id',
        'therapist_id',
        'room_id',
        'start_time',
        'end_time',
        'duration',
        'notes',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'duration' => 'integer',
        ];
    }

    public function treatment(): BelongsTo
    {
        return $this->belongsTo(Treatment::class);
    }

    public function therapist(): BelongsTo
    {
        return $this->belongsTo(Therapist::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'booking_products')
            ->withPivot('quantity')
            ->withTimestamps();
    }

    public function scopeConfirmed($query)
    {
        return $query->whereIn('status', ['definite', 'tentative']);
    }

    public function scopeDefinite($query)
    {
        return $query->where('status', 'definite');
    }

    public function scopeTentative($query)
    {
        return $query->where('status', 'tentative');
    }

    public function scopeWaitingList($query)
    {
        return $query->where('status', 'waiting_list');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeUpcoming($query)
    {
        return $query->where('start_time', '>=', now());
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('start_time', [$startDate, $endDate]);
    }

    /**
     * Check if booking conflicts with therapist
     */
    public function hasTherapistConflict(): bool
    {
        return static::where('id', '!=', $this->id)
            ->where('therapist_id', $this->therapist_id)
            ->whereIn('status', ['definite', 'tentative'])
            ->where(function ($query) {
                $query->whereBetween('start_time', [$this->start_time, $this->end_time])
                    ->orWhereBetween('end_time', [$this->start_time, $this->end_time])
                    ->orWhere(function ($q) {
                        $q->where('start_time', '<', $this->start_time)
                            ->where('end_time', '>', $this->end_time);
                    });
            })
            ->exists();
    }

    /**
     * Check if booking conflicts with room
     */
    public function hasRoomConflict(): bool
    {
        return static::where('id', '!=', $this->id)
            ->where('room_id', $this->room_id)
            ->whereIn('status', ['definite', 'tentative'])
            ->where(function ($query) {
                $query->whereBetween('start_time', [$this->start_time, $this->end_time])
                    ->orWhereBetween('end_time', [$this->start_time, $this->end_time])
                    ->orWhere(function ($q) {
                        $q->where('start_time', '<', $this->start_time)
                            ->where('end_time', '>', $this->end_time);
                    });
            })
            ->exists();
    }
}
