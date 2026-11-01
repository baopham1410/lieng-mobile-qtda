<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class QuanProductResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category ?: 'khac',
            'categoryLabel' => $this->category_label,
            'price' => (float) $this->price,
            'costPrice' => $this->cost_price !== null ? (float) $this->cost_price : null,
            'isActive' => (bool) $this->is_active,
            'sortOrder' => (int) $this->sort_order,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
