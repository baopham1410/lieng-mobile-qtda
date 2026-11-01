<?php

namespace App\Http\Resources;

use App\Services\ProductImageResolver;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductFormResource extends JsonResource
{
    public function toArray($request): array
    {
        $variant = $this->variants->first();
        $resolver = app(ProductImageResolver::class);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'categoryId' => $this->category_id,
            'categoryName' => $this->category?->name,
            'categorySlug' => $this->category?->slug,
            'brand' => $this->brand,
            'modelCode' => $this->model_code,
            'description' => $this->description,
            'isActive' => (bool) $this->is_active,
            'image' => $resolver->resolveProduct($this->resource),
            'hasCustomImage' => filled($this->image_path),
            'variant' => $variant ? [
                'id' => $variant->id,
                'sku' => $variant->sku,
                'color' => $variant->color,
                'storage' => $variant->storage,
                'ram' => $variant->ram,
                'condition' => $variant->condition ?? 'new',
            ] : null,
            'prices' => [
                'import' => $this->priceAmount($variant, 'import'),
                'retail' => $this->priceAmount($variant, 'retail'),
                'wholesale' => $this->priceAmount($variant, 'wholesale'),
            ],
        ];
    }

    private function priceAmount($variant, string $type): ?float
    {
        if (! $variant || ! $variant->relationLoaded('prices')) {
            return null;
        }

        $price = $variant->prices
            ->where('price_type', $type)
            ->sortByDesc('effective_from')
            ->first();

        return $price ? (float) $price->amount : null;
    }
}
