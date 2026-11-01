<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockImport extends Model
{
    protected $fillable = [
        'code', 'supplier_id', 'user_id', 'total_amount', 'status', 'imported_at', 'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'imported_at' => 'datetime',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockImportItem::class);
    }
}
