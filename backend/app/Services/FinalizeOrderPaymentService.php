<?php

namespace App\Services;

use App\Models\ImeiCode;
use App\Models\Order;
use App\Models\Transaction;
use App\Models\Warranty;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class FinalizeOrderPaymentService
{
    public function finalize(Order $order, array $context = []): Order
    {
        return DB::transaction(function () use ($order, $context) {
            $order->loadMissing(['items.imeiCode', 'items.productVariant.prices', 'customer', 'user']);

            if ($order->payment_status === 'paid' && $order->status === 'completed') {
                return $order;
            }

            foreach ($order->items as $item) {
                $imei = $item->imeiCode;
                if (! $imei) {
                    throw new RuntimeException('Không tìm thấy IMEI gắn với đơn hàng.');
                }

                if (! in_array($imei->status, ['in_stock', 'reserved', 'sold'], true)) {
                    throw new RuntimeException('IMEI '.$imei->imei.' không sẵn sàng để hoàn tất thanh toán.');
                }

                if ($imei->status !== 'sold') {
                    $imei->update([
                        'status' => 'sold',
                        'order_item_id' => $item->id,
                    ]);
                }

                if ($order->customer_id) {
                    Warranty::firstOrCreate(
                        ['imei_code_id' => $imei->id],
                        [
                            'customer_id' => $order->customer_id,
                            'order_id' => $order->id,
                            'start_date' => now()->toDateString(),
                            'end_date' => now()->addMonths(12)->toDateString(),
                            'warranty_months' => 12,
                            'status' => 'active',
                        ]
                    );
                }
            }

            if ($order->payment_method === 'mixed') {
                $this->syncMixedPaymentTransactions($order, $context);
            } else {
                $this->syncSinglePaymentTransaction($order, $context);
            }

            $order->forceFill([
                'status' => 'completed',
                'payment_status' => 'paid',
                'payment_confirmed_at' => $context['paid_at'] ?? now(),
                'paid_at' => $context['paid_at'] ?? now(),
                'payment_payload' => $this->resolvePaymentPayload(
                    $order,
                    array_key_exists('payment_payload', $context) ? $context['payment_payload'] : null,
                ),
            ])->save();

            ReportCacheService::bustAll();

            ActivityLogger::record($order->user, [
                'action' => 'checkout',
                'module' => 'orders',
                'title' => 'Bán POS '.$order->code,
                'description' => $order->items->count().' món · '.ActivityLogger::formatMoney((float) $order->total),
                'link' => '/orders',
                'metadata' => [
                    'order_code' => $order->code,
                    'payment_status' => 'paid',
                ],
            ]);

            return $order->fresh(['items.imeiCode', 'customer', 'user']);
        });
    }

    public function release(Order $order, string $paymentStatus, ?array $paymentPayload = null): Order
    {
        return DB::transaction(function () use ($order, $paymentStatus, $paymentPayload) {
            $order->loadMissing('items.imeiCode');

            foreach ($order->items as $item) {
                $imei = $item->imeiCode;
                if ($imei && $imei->status === 'reserved') {
                    $imei->update([
                        'status' => 'in_stock',
                        'order_item_id' => null,
                    ]);
                }
            }

            $order->forceFill([
                'payment_status' => $paymentStatus,
                'status' => $paymentStatus === 'failed' ? 'cancelled' : $order->status,
                'payment_payload' => $paymentPayload ?? $order->payment_payload,
            ])->save();

            return $order->fresh();
        });
    }

    private function resolvePaymentPayload(Order $order, ?array $incoming): ?array
    {
        $existing = is_array($order->payment_payload) ? $order->payment_payload : null;
        $hasMixedBreakdown = is_array($existing) && ($existing['type'] ?? null) === 'mixed';

        if ($incoming === null) {
            return $existing;
        }

        if ($hasMixedBreakdown) {
            return array_merge($existing, [
                'payos' => $incoming,
            ]);
        }

        return $incoming;
    }

    private function syncSinglePaymentTransaction(Order $order, array $context): void
    {
        Transaction::firstOrCreate(
            [
                'reference_type' => 'Order',
                'reference_id' => $order->id,
                'type' => 'income',
                'payment_method' => $order->payment_method,
            ],
            [
                'code' => 'TC-'.now()->format('Ymd').'-'.strtoupper(Str::random(4)),
                'amount' => $order->total,
                'user_id' => $context['user_id'] ?? $order->user_id,
                'description' => 'Bán hàng POS '.$order->code,
                'transacted_at' => $context['paid_at'] ?? now(),
            ]
        );
    }

    private function syncMixedPaymentTransactions(Order $order, array $context): void
    {
        $breakdown = is_array($order->payment_payload) ? $order->payment_payload : [];
        $cashAmount = (float) ($breakdown['cash_amount'] ?? 0);
        $transferAmount = (float) ($breakdown['transfer_amount'] ?? 0);
        $userId = $context['user_id'] ?? $order->user_id;
        $paidAt = $context['paid_at'] ?? now();
        $baseDescription = 'Bán hàng POS '.$order->code;

        if ($cashAmount > 0) {
            Transaction::firstOrCreate(
                [
                    'reference_type' => 'Order',
                    'reference_id' => $order->id,
                    'type' => 'income',
                    'payment_method' => 'cash',
                ],
                [
                    'code' => 'TC-'.now()->format('Ymd').'-'.strtoupper(Str::random(4)),
                    'amount' => $cashAmount,
                    'user_id' => $userId,
                    'description' => $baseDescription.' (tiền mặt)',
                    'transacted_at' => $paidAt,
                ]
            );
        }

        if ($transferAmount > 0) {
            Transaction::firstOrCreate(
                [
                    'reference_type' => 'Order',
                    'reference_id' => $order->id,
                    'type' => 'income',
                    'payment_method' => 'transfer',
                ],
                [
                    'code' => 'TC-'.now()->format('Ymd').'-'.strtoupper(Str::random(4)),
                    'amount' => $transferAmount,
                    'user_id' => $userId,
                    'description' => $baseDescription.' (chuyển khoản)',
                    'transacted_at' => $paidAt,
                ]
            );
        }
    }
}
