<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'code', 'customer_id', 'user_id', 'subtotal', 'discount', 'total',
        'payment_method', 'status', 'payment_status', 'payment_provider',
        'payment_reference', 'checkout_url', 'qr_code', 'payment_payload',
        'payment_expires_at', 'payment_confirmed_at', 'paid_at', 'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'payment_payload' => 'array',
        'payment_expires_at' => 'datetime',
        'payment_confirmed_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function incomeTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'reference_id')
            ->where('reference_type', 'Order')
            ->where('type', 'income');
    }

    public function paymentBreakdown(): ?array
    {
        if ($this->payment_method !== 'mixed') {
            return null;
        }

        $payload = is_array($this->payment_payload) ? $this->payment_payload : [];
        if (($payload['type'] ?? null) === 'mixed') {
            return [
                'cashAmount' => (float) ($payload['cash_amount'] ?? 0),
                'transferAmount' => (float) ($payload['transfer_amount'] ?? 0),
            ];
        }

        $transactions = $this->relationLoaded('incomeTransactions')
            ? $this->incomeTransactions
            : $this->incomeTransactions()->get();

        if ($transactions->isEmpty()) {
            return null;
        }

        $cashAmount = (float) $transactions->where('payment_method', 'cash')->sum('amount');
        $transferAmount = (float) $transactions->where('payment_method', 'transfer')->sum('amount');

        if ($cashAmount <= 0 && $transferAmount <= 0) {
            return null;
        }

        return [
            'cashAmount' => $cashAmount,
            'transferAmount' => $transferAmount,
        ];
    }
}
