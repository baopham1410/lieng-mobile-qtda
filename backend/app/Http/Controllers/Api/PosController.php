<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\ImeiCode;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\FinalizeOrderPaymentService;
use App\Services\PayOSService;
use App\Services\ProductImageResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PosController extends Controller
{
    private $finalizeOrderPaymentService;

    private $payOSService;

    public function __construct(FinalizeOrderPaymentService $finalizeOrderPaymentService, PayOSService $payOSService)
    {
        $this->finalizeOrderPaymentService = $finalizeOrderPaymentService;
        $this->payOSService = $payOSService;
    }

    public function available(Request $request): JsonResponse
    {
        $query = ImeiCode::with(['productVariant.product.category', 'productVariant.prices'])
            ->where('status', 'in_stock');

        if ($categoryId = $request->query('category_id')) {
            $query->whereHas('productVariant.product', fn ($p) => $p->where('category_id', $categoryId));
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('imei', 'ilike', "%{$search}%")
                    ->orWhereHas('productVariant.product', fn ($p) => $p
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('brand', 'ilike', "%{$search}%"));
            });
        }

        $items = $query->orderByDesc('updated_at')->limit(100)->get();

        $stockByVariant = ImeiCode::query()
            ->selectRaw('product_variant_id, COUNT(*) as in_stock_count')
            ->where('status', 'in_stock')
            ->whereIn('product_variant_id', $items->pluck('product_variant_id')->filter()->unique()->values())
            ->groupBy('product_variant_id')
            ->pluck('in_stock_count', 'product_variant_id');

        $products = $items->map(function ($imei) use ($stockByVariant) {
            $variant = $imei->productVariant;
            $product = $variant?->product;
            $price = $variant?->currentPrice('retail') ?? 0;
            $stockCount = (int) ($stockByVariant[$variant?->id] ?? 0);
            $resolver = app(ProductImageResolver::class);

            return [
                'id' => $imei->id,
                'imeiCodeId' => $imei->id,
                'productVariantId' => $variant?->id,
                'categoryId' => $product?->category_id,
                'categorySlug' => $product?->category?->slug,
                'category' => $product?->category?->name ?? 'Khác',
                'name' => $product?->name ?? 'Sản phẩm',
                'brand' => $product?->brand ?? '',
                'image' => $product ? $resolver->resolveProduct($product) : null,
                'color' => $variant?->color ?? '',
                'storage' => $variant?->storage ?? '',
                'imei' => $imei->imei,
                'price' => (float) $price,
                'stock' => $stockCount,
                'status' => $stockCount <= 2 ? 'Sắp hết' : 'Sẵn hàng',
            ];
        });

        return response()->json(['data' => $products]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'customer' => 'nullable|array',
            'customer.name' => 'required_with:customer|string|max:100',
            'customer.phone' => 'required_with:customer|string|max:20',
            'customer.email' => 'nullable|email',
            'customer.address' => 'nullable|string',
            'payment_method' => 'required|in:cash,transfer,ewallet,mixed,bank',
            'cash_amount' => 'nullable|numeric|min:0',
            'transfer_amount' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'is_owner_vip_discount' => 'nullable|boolean',
            'require_owner_approval' => 'nullable|boolean',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.imei_code_id' => 'required|exists:imei_codes,id',
        ]);

        $paymentMethod = $validated['payment_method'] === 'bank' ? 'transfer' : $validated['payment_method'];
        if ($paymentMethod === 'mixed') {
            if (! array_key_exists('cash_amount', $validated) || ! array_key_exists('transfer_amount', $validated)) {
                return response()->json(['message' => 'Thanh toán kết hợp cần nhập tiền mặt và chuyển khoản.'], 422);
            }
        } elseif (array_key_exists('cash_amount', $validated) || array_key_exists('transfer_amount', $validated)) {
            unset($validated['cash_amount'], $validated['transfer_amount']);
        }
        $orderDiscount = (float) ($validated['discount'] ?? 0);

        if (! empty($validated['is_owner_vip_discount'])) {
            $validated['notes'] = trim(($validated['notes'] ?? '') . ' [Đặc quyền Chủ quán: Chiết khấu VIP ' . number_format($orderDiscount, 0, ',', '.') . ' đ - Không cần duyệt]');
        }

        return DB::transaction(function () use ($validated, $paymentMethod, $orderDiscount, $request) {
            if (! empty($validated['customer']) && empty($validated['customer_id'])) {
                $phone = preg_replace('/\s+/', '', $validated['customer']['phone']);
                $existing = Customer::where('phone', $phone)->first();
                if ($existing) {
                    $validated['customer_id'] = $existing->id;
                } else {
                    $customer = Customer::create([
                        'name' => $validated['customer']['name'],
                        'phone' => $phone,
                        'email' => $validated['customer']['email'] ?? null,
                        'address' => $validated['customer']['address'] ?? null,
                    ]);
                    $validated['customer_id'] = $customer->id;
                }
            }

            // If staff requests owner approval for discount
            if (! empty($validated['require_owner_approval']) && $orderDiscount > 0) {
                $order = $this->createOrderWithItems($validated, $paymentMethod, $orderDiscount, $request, true);
                $order->update([
                    'status' => 'pending_discount',
                    'payment_status' => 'pending',
                    'notes' => trim(($order->notes ?? '') . ' [Chờ Chủ quán duyệt chiết khấu ' . number_format($orderDiscount, 0, ',', '.') . ' đ]'),
                ]);

                return response()->json([
                    'data' => $this->buildCheckoutResponseData($order, count($validated['items'])),
                    'message' => 'Đã gửi yêu cầu chiết khấu đến Chủ quán phê duyệt!',
                ], 202);
            }

            return $this->processCheckout($validated, $paymentMethod, $orderDiscount, $request);
        });
    }

    private function processCheckout(array $validated, string $paymentMethod, float $orderDiscount, Request $request): JsonResponse
    {
        $transferAmount = $paymentMethod === 'mixed'
            ? round((float) ($validated['transfer_amount'] ?? 0), 2)
            : ($paymentMethod === 'transfer' ? null : 0.0);
        $reserveInventory = $paymentMethod === 'transfer' || ($paymentMethod === 'mixed' && $transferAmount > 0);

        $order = $this->createOrderWithItems($validated, $paymentMethod, $orderDiscount, $request, $reserveInventory);

        if ($paymentMethod === 'mixed') {
            return $this->processMixedCheckout($order, $validated, $request);
        }

        if ($paymentMethod === 'transfer') {
            return $this->processTransferCheckout($order, (float) $order->total);
        }

        $order = $this->finalizeOrderPaymentService->finalize($order, [
            'user_id' => $request->user()->id,
            'paid_at' => now(),
        ]);

        return response()->json([
            'data' => $this->buildCheckoutResponseData($order, count($validated['items'])),
            'message' => 'Thanh toán thành công',
        ]);
    }

    private function processMixedCheckout(Order $order, array $validated, Request $request): JsonResponse
    {
        $cashAmount = round((float) ($validated['cash_amount'] ?? 0), 2);
        $transferAmount = round((float) ($validated['transfer_amount'] ?? 0), 2);
        $orderTotal = round((float) $order->total, 2);

        if ($cashAmount < 0 || $transferAmount < 0) {
            abort(422, 'Số tiền thanh toán không hợp lệ.');
        }

        if (abs(($cashAmount + $transferAmount) - $orderTotal) > 0.01) {
            abort(422, 'Tiền mặt + chuyển khoản phải bằng tổng đơn ('.number_format($orderTotal, 0, ',', '.').' ₫).');
        }

        if ($cashAmount <= 0 && $transferAmount <= 0) {
            abort(422, 'Nhập số tiền tiền mặt hoặc chuyển khoản.');
        }

        $breakdown = [
            'type' => 'mixed',
            'cash_amount' => $cashAmount,
            'transfer_amount' => $transferAmount,
        ];
        $order->update(['payment_payload' => $breakdown]);

        if ($transferAmount <= 0) {
            $order = $this->finalizeOrderPaymentService->finalize($order->fresh(), [
                'user_id' => $request->user()->id,
                'paid_at' => now(),
            ]);

            return response()->json([
                'data' => $this->buildCheckoutResponseData($order, count($validated['items']), $breakdown),
                'message' => 'Thanh toán thành công',
            ]);
        }

        return $this->processTransferCheckout($order->fresh(), $transferAmount, $breakdown);
    }

    private function processTransferCheckout(Order $order, float $transferAmount, ?array $breakdown = null): JsonResponse
    {
        $payment = $this->payOSService->createPaymentLink($order, $transferAmount);

        $order->update([
            'payment_status' => 'pending',
            'payment_provider' => $payment['provider'],
            'payment_reference' => $payment['reference'],
            'checkout_url' => $payment['checkout_url'],
            'qr_code' => $payment['qr_code'],
            'payment_expires_at' => $payment['expires_at'],
            'payment_payload' => $breakdown ?? $order->payment_payload ?? $payment['payload'],
        ]);

        $responseData = $this->buildCheckoutResponseData($order->fresh(), $order->items()->count(), $breakdown);
        $responseData['transferAmount'] = $transferAmount;
        if ($breakdown) {
            $responseData['cashAmount'] = (float) ($breakdown['cash_amount'] ?? 0);
            $responseData['paymentBreakdown'] = $breakdown;
        }

        return response()->json([
            'data' => $responseData,
            'message' => $breakdown
                ? 'Đã thu tiền mặt, chờ khách chuyển khoản phần còn lại'
                : 'Đã tạo đơn chờ thanh toán chuyển khoản',
        ], 201);
    }

    private function buildCheckoutResponseData(Order $order, int $itemCount, ?array $breakdown = null): array
    {
        $data = [
            'orderId' => $order->id,
            'orderCode' => $order->code,
            'total' => (float) $order->total,
            'itemCount' => $itemCount,
            'status' => $order->status,
            'paymentStatus' => $order->payment_status,
            'paymentReference' => $order->payment_reference,
            'checkoutUrl' => $order->checkout_url,
            'qrCode' => $order->qr_code,
            'paymentExpiresAt' => optional($order->payment_expires_at)->toIso8601String(),
        ];

        if ($breakdown) {
            $data['cashAmount'] = (float) ($breakdown['cash_amount'] ?? 0);
            $data['transferAmount'] = (float) ($breakdown['transfer_amount'] ?? 0);
            $data['paymentBreakdown'] = $breakdown;
        }

        return $data;
    }

    public function paymentStatus(Order $order): JsonResponse
    {
        // Đồng bộ từ PayOS khi vẫn pending — "Kiểm tra ngay" không chỉ đọc DB local.
        if (
            $order->payment_provider === 'payos'
            && in_array($order->payment_status, ['pending', 'unpaid'], true)
            && $order->payment_reference
            && $this->payOSService->isConfigured()
        ) {
            try {
                $remote = $this->payOSService->getPaymentRequest((string) $order->payment_reference);

                if ($remote['status'] === 'paid') {
                    $order = $this->finalizeOrderPaymentService->finalize($order, [
                        'paid_at' => $remote['paid_at'] ?? now(),
                        'payment_payload' => $remote['raw'],
                    ]);
                } elseif (in_array($remote['status'], ['failed', 'expired', 'cancelled'], true)) {
                    $order = $this->finalizeOrderPaymentService->release(
                        $order,
                        $remote['status'] === 'cancelled' ? 'failed' : $remote['status'],
                        $remote['raw']
                    );
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        $order = $order->fresh() ?? $order;
        $breakdown = $order->paymentBreakdown();

        return response()->json([
            'data' => [
                'orderId' => $order->id,
                'orderCode' => $order->code,
                'status' => $order->status,
                'paymentStatus' => $order->payment_status,
                'paymentReference' => $order->payment_reference,
                'checkoutUrl' => $order->checkout_url,
                'qrCode' => $order->qr_code,
                'paymentExpiresAt' => optional($order->payment_expires_at)->toIso8601String(),
                'paymentConfirmedAt' => optional($order->payment_confirmed_at)->toIso8601String(),
                'paidAt' => optional($order->paid_at)->toIso8601String(),
                'total' => (float) $order->total,
                'cashAmount' => $breakdown ? (float) ($breakdown['cashAmount'] ?? 0) : null,
                'transferAmount' => $breakdown ? (float) ($breakdown['transferAmount'] ?? 0) : null,
                'paymentBreakdown' => $breakdown,
            ],
        ]);
    }

    private function createOrderWithItems(
        array $validated,
        string $paymentMethod,
        float $orderDiscount,
        Request $request,
        bool $reserveInventory = false,
    ): Order {
        $awaitingTransfer = $reserveInventory;

        $order = Order::create([
            'code' => 'HD-'.now()->format('Ymd').'-'.str_pad(
                (string) (Order::where('code', 'like', 'HD-'.now()->format('Ymd').'-%')->count() + 1),
                3,
                '0',
                STR_PAD_LEFT
            ),
            'user_id' => $request->user()->id,
            'customer_id' => $validated['customer_id'] ?? null,
            'status' => $awaitingTransfer ? 'pending_payment' : 'draft',
            'payment_status' => $awaitingTransfer ? 'pending' : 'unpaid',
            'payment_provider' => $awaitingTransfer ? 'payos' : null,
            'payment_method' => $paymentMethod,
            'notes' => $validated['notes'] ?? null,
        ]);

        $subtotal = 0;
        foreach ($validated['items'] as $row) {
            $imei = ImeiCode::with('productVariant.prices')
                ->whereKey($row['imei_code_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($imei->status === 'reserved') {
                abort(422, 'IMEI '.$imei->imei.' đang được giữ cho đơn chuyển khoản chưa thanh toán.');
            }
            if ($imei->status !== 'in_stock') {
                abort(422, 'IMEI '.$imei->imei.' không còn trong kho.');
            }
            if (OrderItem::where('imei_code_id', $imei->id)->whereHas('order', function ($query) {
                $query->whereNotIn('status', ['cancelled']);
            })->exists()) {
                abort(422, 'IMEI '.$imei->imei.' đã được giữ hoặc đã bán.');
            }

            $unitPrice = $imei->productVariant?->currentPrice('retail') ?? 0;
            $lineDiscount = (float) ($row['discount'] ?? 0);
            $lineTotal = max(0, $unitPrice - $lineDiscount);
            $subtotal += $lineTotal;

            $item = OrderItem::create([
                'order_id' => $order->id,
                'product_variant_id' => $imei->product_variant_id,
                'imei_code_id' => $imei->id,
                'unit_price' => $unitPrice,
                'discount' => $lineDiscount,
                'total' => $lineTotal,
            ]);

            if ($reserveInventory) {
                $imei->update([
                    'status' => 'reserved',
                    'order_item_id' => $item->id,
                ]);
            }
        }

        $total = max(0, $subtotal - $orderDiscount);

        $order->update([
            'subtotal' => $subtotal,
            'discount' => $orderDiscount,
            'total' => $total,
        ]);

        return $order->fresh(['items.imeiCode', 'customer', 'user']);
    }

    public function categories(): JsonResponse
    {
        $order = ['dien-thoai', 'tablet', 'laptop', 'phu-kien', 'tivi', 'tu-lanh', 'quat'];

        $countsByCategory = ImeiCode::query()
            ->selectRaw('products.category_id, COUNT(*) as in_stock_count')
            ->join('product_variants', 'product_variants.id', '=', 'imei_codes.product_variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->where('imei_codes.status', 'in_stock')
            ->groupBy('products.category_id')
            ->pluck('in_stock_count', 'products.category_id');

        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'icon'])
            ->sortBy(fn ($cat) => array_search($cat->slug, $order, true) !== false
                ? array_search($cat->slug, $order, true)
                : 99)
            ->values()
            ->map(fn ($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'icon' => $cat->icon,
                'count' => (int) ($countsByCategory[$cat->id] ?? 0),
            ]);

        return response()->json(['data' => $categories]);
    }

    public function suggestCustomers(Request $request): JsonResponse
    {
        $q = trim($request->query('q', ''));
        $digits = preg_replace('/\s+/', '', $q);

        if (strlen($digits) < 2 && mb_strlen($q) < 2) {
            return response()->json(['data' => []]);
        }

        $customers = Customer::query()
            ->when($digits !== '', function ($query) use ($q, $digits) {
                $query->where(function ($inner) use ($q, $digits) {
                    $inner->whereRaw("REPLACE(phone, ' ', '') ILIKE ?", ["%{$digits}%"])
                        ->orWhere('name', 'ilike', "%{$q}%");
                });
            })
            ->orderBy('name')
            ->limit(8)
            ->get();

        return response()->json([
            'data' => $customers->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'phone' => $c->phone,
                'email' => $c->email,
                'address' => $c->address,
                'tier' => $c->loyalty_points >= 10000
                    ? 'Thành viên vàng'
                    : ($c->loyalty_points >= 5000 ? 'Thành viên bạc' : 'Thành viên'),
            ]),
        ]);
    }

    public function lookupCustomer(Request $request): JsonResponse
    {
        $phone = preg_replace('/\s+/', '', trim($request->query('phone', '')));

        if (strlen($phone) < 9) {
            return response()->json(['found' => false, 'data' => null]);
        }

        $customer = Customer::whereRaw("REPLACE(phone, ' ', '') = ?", [$phone])->first();

        if (! $customer) {
            return response()->json(['found' => false, 'data' => null]);
        }

        return response()->json([
            'found' => true,
            'data' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'address' => $customer->address,
                'tier' => $customer->loyalty_points >= 10000
                    ? 'Thành viên vàng'
                    : ($customer->loyalty_points >= 5000 ? 'Thành viên bạc' : 'Thành viên'),
            ],
        ]);
    }

    public function customers(): JsonResponse
    {
        $customers = Customer::orderBy('name')
            ->limit(50)
            ->get(['id', 'name', 'phone', 'loyalty_points']);

        $rows = $customers->map(fn ($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'phone' => $c->phone,
            'tier' => $c->loyalty_points >= 10000 ? 'Thành viên vàng' : ($c->loyalty_points >= 5000 ? 'Thành viên bạc' : 'Thành viên'),
        ]);

        return response()->json([
            'data' => [
                ['id' => null, 'name' => 'Khách lẻ', 'phone' => 'Không lưu', 'tier' => 'Khách vãng lai'],
                ...$rows->toArray(),
            ],
        ]);
    }
}
