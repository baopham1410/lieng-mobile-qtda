<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuanEntry extends Model
{
    protected $table = 'quan_entries';

    protected $fillable = [
        'code',
        'type',
        'title',
        'quan_product_id',
        'qty',
        'amount',
        'unit_cost',
        'payment_method',
        'cash_amount',
        'transfer_amount',
        'user_id',
        'note',
        'occurred_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'cash_amount' => 'decimal:2',
        'transfer_amount' => 'decimal:2',
        'qty' => 'integer',
        'occurred_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(QuanProduct::class, 'quan_product_id');
    }
}
