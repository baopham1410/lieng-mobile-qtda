<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray($request): array
    {
        $items = $this->whenLoaded('items', fn () => $this->items, collect());

        return [
            'id' => $this->id,
            'code' => $this->code,
            'customerName' => $this->customer?->name ?? 'Khách lẻ',
            'customer_name' => $this->customer?->name ?? 'Khách lẻ',
            'customerPhone' => $this->customer?->phone ?? '',
            'customer_phone' => $this->customer?->phone ?? '',
            'staffName' => $this->user?->name ?? '',
            'itemCount' => $items->count(),
            'itemsSummary' => $items->take(2)->map(function ($item) {
                return $item->productVariant?->product?->name;
            })->filter()->implode(' + ') ?: '—',
            'subtotal' => (float) $this->subtotal,
            'discount' => (float) $this->discount,
            'total' => (float) $this->total,
            'total_amount' => (float) $this->total,
            'paymentMethod' => $this->payment_method,
            'payment_method' => $this->payment_method,
            'paymentBreakdown' => $this->resource->paymentBreakdown(),
            'status' => $this->status,
            'paymentStatus' => $this->payment_status,
            'payment_status' => $this->payment_status,
            'paymentProvider' => $this->payment_provider,
            'paymentReference' => $this->payment_reference,
            'checkoutUrl' => $this->checkout_url,
            'qrCode' => $this->qr_code,
            'paymentExpiresAt' => $this->payment_expires_at?->toIso8601String(),
            'paymentConfirmedAt' => $this->payment_confirmed_at?->toIso8601String(),
            'paidAt' => $this->paid_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'notes' => $this->notes ?? '',
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(function ($item) {
                    $variant = $item->productVariant;
                    $product = $variant?->product;

                    return [
                        'name' => $product?->name ?? 'Sản phẩm',
                        'variant' => trim(implode(' · ', array_filter([
                            $variant?->color,
                            $variant?->storage,
                        ]))),
                        'imei' => $item->imeiCode?->imei,
                        'unitPrice' => (float) $item->unit_price,
                        'discount' => (float) $item->discount,
                        'total' => (float) $item->total,
                    ];
                });
            }),
        ];
    }
}
