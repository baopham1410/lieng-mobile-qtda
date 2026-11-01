<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id', 'sku', 'color', 'storage', 'ram', 'condition',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function prices(): HasMany
    {
        return $this->hasMany(ProductPrice::class);
    }

    public function imeiCodes(): HasMany
    {
        return $this->hasMany(ImeiCode::class);
    }

    public function currentPrice(string $type): ?float
    {
        $today = now()->toDateString();

        if ($this->relationLoaded('prices')) {
            $price = $this->prices
                ->filter(fn ($row) => $row->price_type === $type
                    && $row->effective_from?->toDateString() <= $today
                    && ($row->effective_to === null || $row->effective_to->toDateString() >= $today))
                ->sortByDesc(fn ($row) => $row->effective_from?->toDateString())
                ->first();

            return $price ? (float) $price->amount : null;
        }

        $price = $this->prices()
            ->where('price_type', $type)
            ->where('effective_from', '<=', $today)
            ->where(function ($q) use ($today) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $today);
            })
            ->orderByDesc('effective_from')
            ->first();

        return $price ? (float) $price->amount : null;
    }
}
