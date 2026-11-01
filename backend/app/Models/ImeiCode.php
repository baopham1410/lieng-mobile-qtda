<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ImeiCode extends Model
{
    protected $fillable = [
        'product_variant_id', 'imei', 'status', 'stock_import_item_id',
        'order_item_id', 'import_cost', 'notes',
    ];

    protected $casts = ['import_cost' => 'decimal:2'];

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function stockImportItem(): BelongsTo
    {
        return $this->belongsTo(StockImportItem::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function warranty(): HasOne
    {
        return $this->hasOne(Warranty::class);
    }
}
