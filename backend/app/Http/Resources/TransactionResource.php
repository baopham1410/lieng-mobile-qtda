<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray($request): array
    {
        $categoryType = $this->category?->type ?? 'other';
        $isManualIncome = $this->type === 'income' && $this->reference_type === 'Manual';

        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type,
            'amount' => (float) $this->amount,
            'paymentMethod' => $this->payment_method,
            'category' => $isManualIncome ? 'other' : ($this->type === 'income' ? 'sales' : $categoryType),
            'categoryName' => $this->category?->name ?? ($isManualIncome ? 'Thu khác' : ($this->type === 'income' ? 'Bán hàng' : 'Khác')),
            'referenceType' => $this->reference_type,
            'referenceId' => $this->reference_id,
            'referenceCode' => $this->reference_code,
            'isAuto' => $this->reference_type !== 'Manual',
            'staffName' => $this->user?->name ?? '',
            'description' => $this->description,
            'transactedAt' => $this->transacted_at?->toIso8601String(),
        ];
    }
}
