<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class StockImportResource extends JsonResource
{
    public function toArray($request): array
    {
        $items = $this->items->map(function ($item) {
            $variant = $item->productVariant;
            $product = $variant?->product;

            return [
                'id' => $item->id,
                'productVariantId' => $item->product_variant_id,
                'category' => 'phone',
                'name' => $product?->name ?? 'Sản phẩm',
                'variant' => trim(implode(' · ', array_filter([$variant?->color, $variant?->storage]))),
                'quantity' => $item->quantity,
                'unitPrice' => (float) $item->unit_cost,
            ];
        });

        $imeis = $this->items->flatMap(fn ($item) => $item->imeiCodes->pluck('imei'))->values();

        return [
            'code' => $this->code,
            'supplierId' => $this->supplier_id,
            'supplierName' => $this->supplier?->name,
            'notes' => $this->notes ?? '',
            'status' => $this->status,
            'items' => $items,
            'imeis' => $imeis,
            'createdAt' => $this->created_at?->toIso8601String(),
            'confirmedAt' => $this->status === 'confirmed' ? ($this->imported_at?->toIso8601String() ?? $this->updated_at?->toIso8601String()) : null,
            'totalAmount' => (float) $this->total_amount,
            'totalQuantity' => $items->sum('quantity'),
            'importedQuantity' => $imeis->count(),
        ];
    }
}
