<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray($request): array
    {
        $orders = $this->whenLoaded('orders', fn () => $this->orders);
        $orderCount = $orders ? $orders->count() : ($this->orders_count ?? 0);
        $totalSpent = $orders ? (float) $orders->where('status', 'completed')->sum('total') : (float) ($this->total_spent ?? 0);
        $lastOrder = $orders?->sortByDesc('paid_at')->first();

        $tier = 'regular';
        if ($totalSpent >= 150000000) {
            $tier = 'diamond';
        } elseif ($totalSpent >= 80000000) {
            $tier = 'gold';
        } elseif ($totalSpent >= 30000000) {
            $tier = 'silver';
        } elseif ($orderCount === 0) {
            $tier = 'walkin';
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'tier' => $tier,
            'loyaltyPoints' => $this->loyalty_points,
            'orderCount' => $orderCount,
            'totalSpent' => $totalSpent,
            'lastOrderAt' => $lastOrder?->paid_at?->toIso8601String(),
            'lastOrderCode' => $lastOrder?->code,
            'notes' => '',
            'recentOrders' => $this->whenLoaded('orders', function () {
                return $this->orders
                    ->sortByDesc('paid_at')
                    ->take(5)
                    ->values()
                    ->map(fn ($o) => [
                        'code' => $o->code,
                        'total' => (float) $o->total,
                        'paidAt' => $o->paid_at?->toIso8601String(),
                    ]);
            }),
        ];
    }
}
