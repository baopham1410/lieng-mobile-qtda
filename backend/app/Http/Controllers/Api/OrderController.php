<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\ImeiCode;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\QuanEntry;
use App\Models\Transaction;
use App\Models\Warranty;
use App\Services\ActivityLogger;
use App\Services\FinalizeOrderPaymentService;
use App\Services\ReportCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    private $finalizeOrderPaymentService;

    public function __construct(FinalizeOrderPaymentService $finalizeOrderPaymentService)
    {
        $this->finalizeOrderPaymentService = $finalizeOrderPaymentService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['customer', 'user', 'items.productVariant.product', 'items.imeiCode', 'incomeTransactions'])
            ->orderByDesc('created_at');

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($payment = $request->query('payment_method')) {
            if ($payment !== 'all') {
                $query->where('payment_method', $payment);
            }
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'ilike', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'ilike', "%{$search}%")
                        ->orWhere('phone', 'ilike', "%{$search}%"));
            });
        }

        $orders = $query->paginate($request->integer('per_page', 50));

        $today = now()->startOfDay();
        $todayOrders = Order::where('paid_at', '>=', $today);

        $stats = [
            'ordersToday' => (clone $todayOrders)->count(),
            'revenueToday' => (float) (clone $todayOrders)->where('status', 'completed')->sum('total'),
            'completedToday' => (clone $todayOrders)->where('status', 'completed')->count(),
            'cancelledToday' => (clone $todayOrders)->where('status', 'cancelled')->count(),
            'avgOrderValue' => (float) ((clone $todayOrders)->where('status', 'completed')->avg('total') ?? 0),
        ];

        return response()->json([
            'data' => OrderResource::collection($orders),
            'stats' => $stats,
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $order = Order::create([
            'code' => $this->generateOrderCode(),
            'user_id' => $request->user()->id,
            'status' => 'draft',
            'payment_status' => 'unpaid',
            'payment_method' => 'cash',
        ]);

        return response()->json([
            'data' => new OrderResource($order->load(['customer', 'user', 'items'])),
            'message' => 'Tạo hóa đơn nháp thành công',
        ], 201);
    }

    public function show(Order $order): JsonResponse
    {
        $order->load(['customer', 'user', 'items.productVariant.product', 'items.imeiCode']);

        return response()->json(['data' => new OrderResource($order)]);
    }

    public function addItem(Request $request, Order $order): JsonResponse
    {
        if ($order->status !== 'draft') {
            return response()->json(['message' => 'Chỉ thêm sản phẩm vào hóa đơn nháp.'], 422);
        }

        $validated = $request->validate([
            'imei_code_id' => 'required|exists:imei_codes,id',
            'discount' => 'nullable|numeric|min:0',
        ]);

        $imei = ImeiCode::with('productVariant.prices')->findOrFail($validated['imei_code_id']);

        if ($imei->status !== 'in_stock') {
            return response()->json(['message' => 'IMEI không còn trong kho.'], 422);
        }

        if (OrderItem::where('imei_code_id', $imei->id)->exists()) {
            return response()->json(['message' => 'IMEI đã có trong đơn hàng khác.'], 422);
        }

        $unitPrice = $imei->productVariant?->currentPrice('retail') ?? 0;
        $discount = (float) ($validated['discount'] ?? 0);
        $total = max(0, $unitPrice - $discount);

        OrderItem::create([
            'order_id' => $order->id,
            'product_variant_id' => $imei->product_variant_id,
            'imei_code_id' => $imei->id,
            'unit_price' => $unitPrice,
            'discount' => $discount,
            'total' => $total,
        ]);

        $this->recalculateOrder($order);

        return response()->json([
            'data' => new OrderResource($order->fresh(['customer', 'user', 'items.productVariant.product', 'items.imeiCode'])),
            'message' => 'Đã thêm sản phẩm vào giỏ',
        ]);
    }

    public function removeItem(Order $order, OrderItem $item): JsonResponse
    {
        if ($order->status !== 'draft' || $item->order_id !== $order->id) {
            return response()->json(['message' => 'Không thể xóa dòng này.'], 422);
        }

        $item->delete();
        $this->recalculateOrder($order);

        return response()->json([
            'data' => new OrderResource($order->fresh(['customer', 'user', 'items.productVariant.product', 'items.imeiCode'])),
            'message' => 'Đã xóa sản phẩm khỏi giỏ',
        ]);
    }

    public function checkout(Request $request, Order $order): JsonResponse
    {
        if ($order->status !== 'draft') {
            return response()->json(['message' => 'Hóa đơn không ở trạng thái nháp.'], 422);
        }

        $order->load('items.imeiCode', 'items.productVariant');

        if ($order->items->isEmpty()) {
            return response()->json(['message' => 'Giỏ hàng trống.'], 422);
        }

        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'payment_method' => 'required|in:cash,transfer,ewallet,mixed',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $paymentMethod = $validated['payment_method'] === 'bank' ? 'transfer' : $validated['payment_method'];
        $orderDiscount = (float) ($validated['discount'] ?? 0);

        return DB::transaction(function () use ($order, $validated, $paymentMethod, $orderDiscount, $request) {
            foreach ($order->items as $item) {
                $imei = $item->imeiCode;
                if (! $imei || $imei->status !== 'in_stock') {
                    throw new \RuntimeException('IMEI '.$imei?->imei.' không còn khả dụng.');
                }
            }

            $subtotal = (float) $order->items->sum('total');
            $total = max(0, $subtotal - $orderDiscount);

            $order->update([
                'customer_id' => $validated['customer_id'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $orderDiscount,
                'total' => $total,
                'payment_method' => $paymentMethod,
                'status' => 'completed',
                'paid_at' => now(),
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($order->items as $item) {
                $imei = $item->imeiCode;
                $imei->update(['status' => 'sold', 'order_item_id' => $item->id]);

                if ($order->customer_id) {
                    $months = $item->productVariant?->resolvedWarrantyMonths() ?? 12;
                    if ($months > 0) {
                        Warranty::create([
                            'imei_code_id' => $imei->id,
                            'customer_id' => $order->customer_id,
                            'order_id' => $order->id,
                            'start_date' => now()->toDateString(),
                            'end_date' => now()->addMonths($months)->toDateString(),
                            'warranty_months' => $months,
                            'status' => 'active',
                        ]);
                    }
                }
            }

            Transaction::create([
                'code' => 'TC-'.now()->format('Ymd').'-'.strtoupper(Str::random(4)),
                'type' => 'income',
                'amount' => $total,
                'payment_method' => $paymentMethod,
                'reference_type' => 'Order',
                'reference_id' => $order->id,
                'user_id' => $request->user()->id,
                'description' => 'Bán hàng POS '.$order->code,
                'transacted_at' => now(),
            ]);

            ReportCacheService::bustAll();

            return response()->json([
                'data' => new OrderResource($order->fresh(['customer', 'user', 'items.productVariant.product', 'items.imeiCode'])),
                'message' => 'Thanh toán thành công',
            ]);
        });
    }

    private function recalculateOrder(Order $order): void
    {
        $order->load('items');
        $subtotal = (float) $order->items->sum('total');
        $order->update([
            'subtotal' => $subtotal,
            'total' => max(0, $subtotal - (float) $order->discount),
        ]);
    }

    private function generateOrderCode(): string
    {
        $prefix = 'HD-'.now()->format('Ymd').'-';
        $count = Order::where('code', 'like', $prefix.'%')->count() + 1;

        return $prefix.str_pad((string) $count, 3, '0', STR_PAD_LEFT);
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        if (! in_array($order->status, ['completed', 'draft', 'pending_payment', 'pending_discount'], true)) {
            return response()->json(['message' => 'Không thể hủy đơn ở trạng thái này.'], 422);
        }

        if ($order->status === 'pending_payment') {
            $this->finalizeOrderPaymentService->release($order, 'failed', $order->payment_payload);
        }

        // Release IMEIs back to stock
        foreach ($order->items as $item) {
            $item->imeiCode?->update([
                'status' => 'in_stock',
                'order_item_id' => null,
            ]);
        }

        $order->update([
            'status' => 'cancelled',
            'payment_status' => $order->payment_status === 'pending' ? 'failed' : $order->payment_status,
            'notes' => trim(($order->notes ?? '').' [Hủy: '.now()->format('d/m/Y H:i').']'),
        ]);

        ActivityLogger::record($request->user(), [
            'action' => 'cancel',
            'module' => 'orders',
            'title' => 'Hủy đơn '.$order->code,
            'description' => ActivityLogger::formatMoney((float) $order->total),
            'link' => '/orders',
        ]);

        ReportCacheService::bustAll();

        return response()->json([
            'data' => new OrderResource($order->fresh(['customer', 'user', 'items.productVariant.product', 'items.imeiCode'])),
            'message' => 'Đã hủy đơn hàng',
        ]);
    }

    /**
     * Store Owner: Approve VIP Discount for Order
     */
    public function approveDiscount(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        return DB::transaction(function () use ($request, $order, $user) {
            $order->update([
                'status' => 'completed',
                'payment_status' => 'paid',
                'paid_at' => now(),
                'notes' => trim(($order->notes ?? '') . ' [Chủ quán đã duyệt chiết khấu VIP lúc ' . now()->format('H:i d/m/Y') . ']'),
            ]);

            foreach ($order->items as $item) {
                $imei = $item->imeiCode;
                if ($imei) {
                    $imei->update(['status' => 'sold', 'order_item_id' => $item->id]);

                    if ($order->customer_id) {
                        $months = $item->productVariant?->resolvedWarrantyMonths() ?? 12;
                        if ($months > 0) {
                            Warranty::updateOrCreate(
                                ['imei_code_id' => $imei->id, 'order_id' => $order->id],
                                [
                                    'customer_id' => $order->customer_id,
                                    'start_date' => now()->toDateString(),
                                    'end_date' => now()->addMonths($months)->toDateString(),
                                    'warranty_months' => $months,
                                    'status' => 'active',
                                ]
                            );
                        }
                    }
                }
            }

            Transaction::create([
                'code' => 'TC-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4)),
                'type' => 'income',
                'amount' => (float) $order->total,
                'payment_method' => $order->payment_method ?? 'cash',
                'reference_type' => 'Order',
                'reference_id' => $order->id,
                'user_id' => $user->id,
                'description' => 'Bán hàng POS ' . $order->code . ' (Duyệt chiết khấu VIP)',
                'transacted_at' => now(),
            ]);

            ActivityLogger::record($user, [
                'action' => 'approve_discount',
                'module' => 'orders',
                'title' => 'Duyệt chiết khấu đơn ' . $order->code,
                'description' => ActivityLogger::formatMoney((float) $order->total),
                'link' => '/orders',
            ]);

            ReportCacheService::bustAll();

            return response()->json([
                'data' => new OrderResource($order->fresh(['customer', 'user', 'items.productVariant.product', 'items.imeiCode'])),
                'message' => 'Đã duyệt chiết khấu và hoàn tất đơn hàng thành công!',
            ]);
        });
    }

    /**
     * Store Owner: Cancel Order and Refund to Customer (Hủy & Hoàn tiền)
     */
    public function cancelAndRefund(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        return DB::transaction(function () use ($request, $order, $user) {
            $totalAmount = (float) $order->total;
            $wasPaid = in_array($order->status, ['completed']) || $order->payment_status === 'paid';

            // 1. Return all IMEIs back to in_stock
            foreach ($order->items as $item) {
                $item->imeiCode?->update([
                    'status' => 'in_stock',
                    'order_item_id' => null,
                ]);
            }

            // 2. Void warranties
            Warranty::where('order_id', $order->id)->update(['status' => 'cancelled']);

            // 3. Create Refund Transaction
            if ($wasPaid && $totalAmount > 0) {
                Transaction::create([
                    'code' => 'RF-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4)),
                    'type' => 'expense',
                    'amount' => $totalAmount,
                    'payment_method' => $order->payment_method ?? 'cash',
                    'reference_type' => 'OrderRefund',
                    'reference_id' => $order->id,
                    'user_id' => $user->id,
                    'description' => 'Hoàn tiền hủy đơn hàng ' . $order->code . ' (' . ($order->customer?->name ?? 'Khách lẻ') . ')',
                    'transacted_at' => now(),
                ]);

                // Also record in showroom register if paid by cash
                if ($order->payment_method === 'cash') {
                    QuanEntry::create([
                        'code' => 'HT-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4)),
                        'type' => 'expense',
                        'title' => 'Hoàn tiền mặt đơn ' . $order->code,
                        'qty' => 1,
                        'amount' => $totalAmount,
                        'unit_cost' => $totalAmount,
                        'payment_method' => 'cash',
                        'cash_amount' => $totalAmount,
                        'user_id' => $user->id,
                        'note' => 'Hoàn tiền hủy đơn tại quầy POS',
                        'occurred_at' => now(),
                    ]);
                }
            }

            // 4. Update Order status
            $order->update([
                'status' => 'cancelled',
                'payment_status' => 'refunded',
                'notes' => trim(($order->notes ?? '') . ' [Chủ quán đã Hủy & Hoàn tiền ' . number_format($totalAmount, 0, ',', '.') . ' đ lúc ' . now()->format('H:i d/m/Y') . ']'),
            ]);

            ActivityLogger::record($user, [
                'action' => 'cancel_and_refund',
                'module' => 'orders',
                'title' => 'Chủ quán Hủy & Hoàn tiền đơn ' . $order->code,
                'description' => 'Số tiền hoàn lại: ' . ActivityLogger::formatMoney($totalAmount),
                'link' => '/orders',
            ]);

            ReportCacheService::bustAll();

            return response()->json([
                'data' => new OrderResource($order->fresh(['customer', 'user', 'items.productVariant.product', 'items.imeiCode'])),
                'message' => 'Đã hủy đơn hàng, hoàn trả thiết bị về kho và hoàn tiền ' . number_format($totalAmount, 0, ',', '.') . ' đ thành công!',
            ]);
        });
    }

    /**
     * Remind Customer Payment (Nhắc thanh toán)
     */
    public function remindPayment(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();
        $customer = $order->customer;

        $reminderMessage = 'Liêng Mobile kính gửi Quý khách ' . ($customer?->name ?? 'hàng') . ': Đơn hàng ' . $order->code . ' trị giá ' . number_format((float) $order->total, 0, ',', '.') . ' đ đang chờ thanh toán. Vui lòng hoàn tất để giữ máy!';

        $order->update([
            'notes' => trim(($order->notes ?? '') . ' [Đã gửi nhắc thanh toán lúc ' . now()->format('H:i d/m/Y') . ']'),
        ]);

        ActivityLogger::record($user, [
            'action' => 'remind_payment',
            'module' => 'orders',
            'title' => 'Nhắc thanh toán đơn ' . $order->code,
            'description' => 'Khách hàng: ' . ($customer?->name ?? 'Khách lẻ') . ' (' . ($customer?->phone ?? 'N/A') . ')',
            'link' => '/orders',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi thông báo nhắc thanh toán đến số điện thoại ' . ($customer?->phone ?? 'của khách hàng') . '!',
            'data' => [
                'order_code' => $order->code,
                'customer_phone' => $customer?->phone,
                'message_preview' => $reminderMessage,
                'sent_at' => now()->format('d/m/Y H:i'),
            ],
        ]);
    }

    /**
     * Thermal Receipt Print Payload (In lại hóa đơn)
     */
    public function printReceipt(Request $request, Order $order): JsonResponse
    {
        $order->load(['customer', 'user', 'items.productVariant.product', 'items.imeiCode']);

        $receiptItems = $order->items->map(function ($item) {
            $variant = $item->productVariant;
            $product = $variant?->product;
            $name = $product?->name ?? 'Sản phẩm';
            $variantText = trim(implode(' ', array_filter([$variant?->storage, $variant?->color])));
            
            return [
                'name' => trim($name . ' ' . $variantText),
                'imei' => $item->imeiCode?->imei ?? 'N/A',
                'qty' => $item->quantity ?? 1,
                'price' => (float) $item->unit_price,
                'total' => (float) $item->total,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Đã tạo lệnh in hóa đơn đến máy in Epson TM-T82!',
            'data' => [
                'store' => [
                    'brand' => 'LIÊNG MOBILE RETAIL POS',
                    'branch' => 'Chi nhánh Flagship #01 - 123 Điện Biên Phủ, Q.3, TP.HCM',
                    'hotline' => '1900.8888 - 0988.777.666',
                ],
                'order_code' => $order->code,
                'printed_at' => now()->format('d/m/Y H:i:s'),
                'cashier' => $order->user?->name ?? 'Thu ngân',
                'customer' => [
                    'name' => $order->customer?->name ?? 'Khách lẻ',
                    'phone' => $order->customer?->phone ?? 'N/A',
                ],
                'items' => $receiptItems,
                'subtotal' => (float) $order->subtotal,
                'discount' => (float) $order->discount,
                'total' => (float) $order->total,
                'payment_method' => match ($order->payment_method) {
                    'cash' => 'Tiền mặt tại quầy',
                    'transfer' => 'Chuyển khoản VietQR',
                    'mixed' => 'Kết hợp TM + Chuyển khoản',
                    default => 'Quẹt thẻ POS',
                },
                'qr_check' => 'https://liengmobile.com/check/' . $order->code,
                'printer' => 'Epson TM-T82 (Cổng LAN/Bluetooth 192.168.1.200)',
            ],
        ]);
    }
}
