<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class QuanEntryResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type,
            'title' => $this->title,
            'quanProductId' => $this->quan_product_id,
            'qty' => (int) ($this->qty ?? 1),
            'amount' => (float) $this->amount,
            'unitCost' => $this->unit_cost !== null ? (float) $this->unit_cost : null,
            'paymentMethod' => $this->payment_method,
            'cashAmount' => (float) ($this->cash_amount ?? 0),
            'transferAmount' => (float) ($this->transfer_amount ?? 0),
            'note' => $this->note,
            'staffName' => $this->user?->name ?? '',
            'occurredAt' => $this->occurred_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
