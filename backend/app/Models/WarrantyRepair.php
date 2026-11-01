<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarrantyRepair extends Model
{
    protected $fillable = [
        'warranty_id', 'description', 'cost', 'repaired_at', 'user_id',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'repaired_at' => 'datetime',
    ];

    public function warranty(): BelongsTo
    {
        return $this->belongsTo(Warranty::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
