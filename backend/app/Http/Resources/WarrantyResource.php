<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

class WarrantyResource extends JsonResource
{
    public function toArray($request): array
    {
        $imei = $this->imeiCode;
        $variant = $imei?->productVariant;
        $product = $variant?->product;
        $endDate = $this->end_date ? Carbon::parse($this->end_date) : null;
        $daysRemaining = $endDate ? max(0, now()->diffInDays($endDate, false)) : 0;
        $inRepair = $this->relationLoaded('repairs') && $this->repairs->isNotEmpty()
            && $this->repairs->sortByDesc('repaired_at')->first()?->repaired_at > now()->subDays(30);

        $status = $this->status;
        if ($status === 'active' && $daysRemaining <= 30 && $daysRemaining > 0) {
            $status = 'expiring';
        }
        if ($inRepair) {
            $status = 'in_repair';
        }

        return [
            'id' => $this->id,
            'code' => 'BH-'.str_pad((string) $this->id, 4, '0', STR_PAD_LEFT),
            'imei' => $imei?->imei,
            'productName' => $product?->name,
            'variant' => trim(implode(' · ', array_filter([$variant?->color, $variant?->storage]))),
            'customerName' => $this->customer?->name,
            'customerPhone' => $this->customer?->phone,
            'orderCode' => $this->order?->code,
            'startDate' => $this->start_date?->format('Y-m-d'),
            'endDate' => $this->end_date?->format('Y-m-d'),
            'warrantyMonths' => $this->warranty_months,
            'status' => $status,
            'repairStatus' => $inRepair ? 'in_progress' : 'none',
            'daysRemaining' => $daysRemaining,
            'repairs' => $this->whenLoaded('repairs', function () {
                return $this->repairs->map(fn ($r) => [
                    'id' => $r->id,
                    'description' => $r->description,
                    'cost' => (float) $r->cost,
                    'repairedAt' => $r->repaired_at?->toIso8601String(),
                    'staffName' => $r->user?->name,
                ]);
            }),
        ];
    }
}
