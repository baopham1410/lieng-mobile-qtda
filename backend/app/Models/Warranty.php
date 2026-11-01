<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Warranty extends Model
{
    protected $fillable = [
        'imei_code_id', 'customer_id', 'order_id',
        'start_date', 'end_date', 'warranty_months', 'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'warranty_months' => 'integer',
    ];

    public function imeiCode(): BelongsTo
    {
        return $this->belongsTo(ImeiCode::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function repairs(): HasMany
    {
        return $this->hasMany(WarrantyRepair::class);
    }
}
