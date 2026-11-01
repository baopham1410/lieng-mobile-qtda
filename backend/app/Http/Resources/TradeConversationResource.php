<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TradeConversationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'laoText' => $this->lao_text,
            'viText' => $this->vi_text,
            'customerName' => $this->customer_name,
            'note' => $this->note,
            'staffName' => $this->user?->name ?? '',
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
