<?php

namespace App\Http\Resources;

use App\Services\ProductImageResolver;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductListResource extends JsonResource
{
    public function toArray($request): array
    {
        $variants = $this->variants;
        $stock = $variants->sum('in_stock_count');
        $firstVariant = $variants->first();
        $retail = $this->priceFromVariant($firstVariant, 'retail');
        $import = $this->priceFromVariant($firstVariant, 'import');
        $wholesale = $this->priceFromVariant($firstVariant, 'wholesale');
        $condition = $firstVariant?->condition ?? 'new';

        $status = 'Đang bán';
        if (! $this->is_active) {
            $status = 'Tạm ẩn';
        } elseif ($stock === 0) {
            $status = 'Hết hàng';
        } elseif ($stock <= 3) {
            $status = 'Sắp hết';
        }

        $resolver = app(ProductImageResolver::class);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category?->name,
            'categorySlug' => $this->category?->slug,
            'brand' => $this->brand,
            'modelCode' => $this->model_code,
            'image' => $resolver->resolveProduct($this->resource),
            'variants' => $variants->count(),
            'variantLabel' => $this->variantLabel($firstVariant),
            'sku' => $firstVariant?->sku,
            'stock' => $stock,
            'retailPrice' => (float) $retail,
            'importPrice' => (float) $import,
            'wholesalePrice' => (float) $wholesale,
            'warrantyMonths' => $firstVariant?->resolvedWarrantyMonths() ?? 12,
            'condition' => $condition,
            'conditionLabel' => $this->conditionLabel($condition),
            'description' => $this->description,
            'updatedAt' => $this->updated_at?->format('d/m/Y'),
            'status' => $status,
        ];
    }

    private function variantLabel($variant): ?string
    {
        if (! $variant) {
            return null;
        }

        $label = implode(' · ', array_filter([$variant->color, $variant->storage, $variant->ram]));

        return $label !== '' ? $label : null;
    }

    private function conditionLabel(string $condition): string
    {
        return match ($condition) {
            'new' => 'Mới',
            'likenew_99' => 'Like new 99%',
            'used' => 'Đã qua sử dụng',
            default => $condition,
        };
    }

    private function priceFromVariant($variant, string $type): float
    {
        if (! $variant) {
            return 0;
        }

        return (float) ($variant->currentPrice($type) ?? 0);
    }
}
