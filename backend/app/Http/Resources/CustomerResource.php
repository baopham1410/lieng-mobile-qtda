<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray($request): array
    {
        $orders = $this->relationLoaded('orders') ? $this->orders : null;
        $orderCount = $orders ? $orders->count() : ($this->orders_count ?? 0);
        $totalSpent = $orders
            ? (float) $orders->where('status', 'completed')->sum('total')
            : (float) ($this->total_spent ?? 0);
        $lastOrder = $orders?->sortByDesc('paid_at')->first();

        $tier = self::resolveTier($totalSpent, (int) $orderCount);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'tier' => $tier,
            'loyaltyPoints' => $this->loyalty_points,
            'orderCount' => $orderCount,
            'warrantyCount' => $this->relationLoaded('warranties')
                ? $this->warranties->count()
                : ($this->warranties_count ?? 0),
            'totalSpent' => $totalSpent,
            'lastOrderAt' => $lastOrder?->paid_at?->toIso8601String(),
            'lastOrderCode' => $lastOrder?->code,
            'notes' => $this->notes ?? '',
            'recentOrders' => $this->whenLoaded('orders', function () {
                return $this->orders
                    ->sortByDesc('paid_at')
                    ->take(10)
                    ->values()
                    ->map(fn ($o) => [
                        'code' => $o->code,
                        'total' => (float) $o->total,
                        'paidAt' => $o->paid_at?->toIso8601String(),
                    ]);
            }),
            'warranties' => $this->whenLoaded('warranties', function () {
                return $this->warranties
                    ->sortByDesc('created_at')
                    ->values()
                    ->map(function ($w) {
                        $imei = $w->imeiCode;
                        $variant = $imei?->productVariant;
                        $product = $variant?->product;
                        $endDate = $w->end_date ? Carbon::parse($w->end_date) : null;
                        $daysRemaining = $endDate ? max(0, now()->diffInDays($endDate, false)) : 0;
                        $status = $w->status;
                        if ($status === 'active' && $daysRemaining <= 30 && $daysRemaining > 0) {
                            $status = 'expiring';
                        } elseif ($status === 'active' && $endDate && $endDate->isPast()) {
                            $status = 'expired';
                        }

                        return [
                            'id' => $w->id,
                            'code' => 'BH-'.str_pad((string) $w->id, 4, '0', STR_PAD_LEFT),
                            'imei' => $imei?->imei,
                            'productName' => $product?->name ?? 'Thiết bị',
                            'variant' => trim(implode(' · ', array_filter([$variant?->color, $variant?->storage]))),
                            'status' => $status,
                            'startDate' => $w->start_date?->format('Y-m-d'),
                            'endDate' => $w->end_date?->format('Y-m-d'),
                            'daysRemaining' => $daysRemaining,
                        ];
                    });
            }),
            'appraisals' => $this->when(isset($this->appraisals_list), fn () => $this->appraisals_list),
        ];
    }

    public static function resolveTier(float $totalSpent, int $orderCount): string
    {
        if ($totalSpent >= 150000000) {
            return 'diamond';
        }
        if ($totalSpent >= 80000000) {
            return 'gold';
        }
        if ($totalSpent >= 30000000) {
            return 'silver';
        }
        if ($orderCount === 0) {
            return 'walkin';
        }

        return 'regular';
    }
}
