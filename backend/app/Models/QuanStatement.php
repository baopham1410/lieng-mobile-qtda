<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuanStatement extends Model
{
    protected $fillable = [
        'code',
        'statement_date',
        'income_total',
        'expense_total',
        'cash_total',
        'transfer_total',
        'net_total',
        'sales_count',
        'expense_count',
        'row_count',
        'rows_snapshot',
        'note',
        'user_id',
    ];

    protected $casts = [
        'statement_date' => 'date',
        'income_total' => 'decimal:2',
        'expense_total' => 'decimal:2',
        'cash_total' => 'decimal:2',
        'transfer_total' => 'decimal:2',
        'net_total' => 'decimal:2',
        'sales_count' => 'integer',
        'expense_count' => 'integer',
        'row_count' => 'integer',
        'rows_snapshot' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
