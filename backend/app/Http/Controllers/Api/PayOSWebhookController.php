<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\FinalizeOrderPaymentService;
use App\Services\PayOSService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayOSWebhookController extends Controller
{
    private $payOSService;

    private $finalizeOrderPaymentService;

    public function __construct(PayOSService $payOSService, FinalizeOrderPaymentService $finalizeOrderPaymentService)
    {
        $this->payOSService = $payOSService;
        $this->finalizeOrderPaymentService = $finalizeOrderPaymentService;
    }

    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->all();

        if (! $this->payOSService->verifyWebhook($payload)) {
            return response()->json(['message' => 'Invalid PayOS signature.'], 401);
        }

        $payment = $this->payOSService->normalizeWebhook($payload);
        $order = Order::query()
            ->where('payment_reference', $payment['reference'])
            ->orWhere('code', 'like', '%'.$payment['order_code'].'%')
            ->first();

        if (! $order) {
            // PayOS gửi webhook mẫu (orderCode 123) khi xác minh URL — cần trả 2XX.
            return response()->json(['message' => 'Webhook received. Order not found.']);
        }

        if ($order->payment_status === 'paid' && $order->status === 'completed') {
            return response()->json(['message' => 'Order already finalized.']);
        }

        if ($payment['status'] === 'paid') {
            $this->finalizeOrderPaymentService->finalize($order, [
                'paid_at' => $payment['paid_at'],
                'payment_payload' => $payment['raw'],
            ]);

            return response()->json(['message' => 'Payment confirmed.']);
        }

        $this->finalizeOrderPaymentService->release($order, $payment['status'], $payment['raw']);

        return response()->json(['message' => 'Payment status updated.']);
    }
}
