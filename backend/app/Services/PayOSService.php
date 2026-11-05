<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PayOSService
{
    private const API_BASE = 'https://api-merchant.payos.vn';

    public function isConfigured(): bool
    {
        return (bool) (config('services.payos.client_id')
            && config('services.payos.api_key')
            && config('services.payos.checksum_key'));
    }

    public function createPaymentLink(Order $order, ?float $amount = null): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Chưa cấu hình PayOS. Vui lòng thiết lập PAYOS_CLIENT_ID, PAYOS_API_KEY và PAYOS_CHECKSUM_KEY.');
        }

        $payAmount = (int) round($amount ?? (float) $order->total);
        if ($payAmount <= 0) {
            throw new RuntimeException('Số tiền thanh toán PayOS phải lớn hơn 0.');
        }

        $orderCode = $this->numericOrderCode($order);
        $expiresAt = now()->addMinutes(15);
        $payload = [
            'orderCode' => $orderCode,
            'amount' => $payAmount,
            'description' => substr('Thanh toan '.$order->code, 0, 25),
            'items' => [[
                'name' => substr('Don hang '.$order->code, 0, 25),
                'quantity' => 1,
                'price' => $payAmount,
            ]],
            'cancelUrl' => config('services.payos.cancel_url'),
            'returnUrl' => config('services.payos.return_url'),
            'expiredAt' => $expiresAt->timestamp,
            'signature' => $this->sign($this->signaturePayload([
                'amount' => $payAmount,
                'cancelUrl' => config('services.payos.cancel_url'),
                'description' => substr('Thanh toan '.$order->code, 0, 25),
                'orderCode' => $orderCode,
                'returnUrl' => config('services.payos.return_url'),
            ])),
        ];

        $response = $this->httpClient()
            ->withHeaders([
                'x-client-id' => config('services.payos.client_id'),
                'x-api-key' => config('services.payos.api_key'),
                'Accept' => 'application/json',
            ])
            ->timeout(20)
            ->post(self::API_BASE.'/v2/payment-requests', $payload);

        if ($response->failed()) {
            throw new RuntimeException($response->json('desc') ?: $response->json('message') ?: 'Không tạo được link thanh toán PayOS.');
        }

        $data = $response->json('data', []);

        return [
            'provider' => 'payos',
            'reference' => (string) ($data['paymentLinkId'] ?? $orderCode),
            'checkout_url' => $data['checkoutUrl'] ?? null,
            'qr_code' => $data['qrCode'] ?? null,
            'expires_at' => Carbon::createFromTimestamp($data['expiredAt'] ?? $expiresAt->timestamp),
            'payload' => $data,
        ];
    }

    /**
     * Tra cứu trạng thái thanh toán trực tiếp từ PayOS (dùng khi bấm "Kiểm tra ngay"
     * hoặc poll — không phụ thuộc webhook về máy local).
     */
    public function getPaymentRequest(string $paymentLinkIdOrOrderCode): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Chưa cấu hình PayOS.');
        }

        $response = $this->httpClient()
            ->withHeaders([
                'x-client-id' => config('services.payos.client_id'),
                'x-api-key' => config('services.payos.api_key'),
                'Accept' => 'application/json',
            ])
            ->timeout(20)
            ->get(self::API_BASE.'/v2/payment-requests/'.$paymentLinkIdOrOrderCode);

        if ($response->failed()) {
            throw new RuntimeException($response->json('desc') ?: $response->json('message') ?: 'Không lấy được trạng thái PayOS.');
        }

        $data = $response->json('data', []);
        $status = strtolower((string) ($data['status'] ?? ''));

        return [
            'reference' => (string) ($data['id'] ?? $data['paymentLinkId'] ?? $paymentLinkIdOrOrderCode),
            'order_code' => (string) ($data['orderCode'] ?? ''),
            'status' => $this->mapPaymentLinkStatus($status),
            'paid_at' => isset($data['transactionDateTime'])
                ? Carbon::parse($data['transactionDateTime'])
                : (($status === 'paid') ? now() : null),
            'raw' => $data,
        ];
    }

    private function mapPaymentLinkStatus(string $status): string
    {
        return match ($status) {
            'paid' => 'paid',
            'cancelled', 'canceled' => 'cancelled',
            'expired' => 'expired',
            'failed' => 'failed',
            default => 'pending',
        };
    }

    public function verifyWebhook(array $payload): bool
    {
        $signature = $payload['signature'] ?? null;
        $data = $payload['data'] ?? [];

        if (! $signature || ! is_array($data)) {
            return false;
        }

        return hash_equals($signature, $this->sign($this->signaturePayload($data)));
    }

    public function normalizeWebhook(array $payload): array
    {
        $data = $payload['data'] ?? [];

        return [
            'order_code' => (string) ($data['orderCode'] ?? ''),
            'reference' => (string) ($data['paymentLinkId'] ?? ''),
            'status' => $this->mapWebhookStatus($payload, $data),
            'paid_at' => isset($data['transactionDateTime']) ? Carbon::parse($data['transactionDateTime']) : now(),
            'raw' => $payload,
        ];
    }

    private function mapWebhookStatus(array $payload, array $data): string
    {
        $code = (string) ($payload['code'] ?? '');
        $desc = strtolower((string) ($payload['desc'] ?? ''));
        $status = strtolower((string) ($data['status'] ?? ''));

        if (in_array($status, ['cancelled', 'failed', 'expired'], true)) {
            return $status;
        }

        if (($payload['success'] ?? false) === true || $code === '00' || str_contains($desc, 'success')) {
            return 'paid';
        }

        return 'failed';
    }

    private function numericOrderCode(Order $order): int
    {
        return ((int) preg_replace('/\D+/', '', $order->code)) ?: $order->id;
    }

    private function signaturePayload(array $payload): string
    {
        $filtered = Arr::except($payload, ['signature']);
        ksort($filtered);

        return collect($filtered)
            ->map(function ($value, $key) {
                if (is_bool($value)) {
                    $value = $value ? 'true' : 'false';
                } elseif (is_array($value)) {
                    $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                }

                return $key.'='.$value;
            })
            ->implode('&');
    }

    private function sign(string $payload): string
    {
        return hash_hmac('sha256', $payload, (string) config('services.payos.checksum_key'));
    }

    private function httpClient()
    {
        $caBundle = config('services.payos.ca_bundle');

        if (is_string($caBundle) && $caBundle !== '' && is_file($caBundle)) {
            return Http::withOptions(['verify' => $caBundle]);
        }

        return Http::withOptions([]);
    }
}
