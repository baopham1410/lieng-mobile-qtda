<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuanEntryResource;
use App\Models\QuanEntry;
use App\Models\QuanProduct;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class QuanEntryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = QuanEntry::with(['user:id,name', 'product:id,name,price'])
            ->orderByDesc('occurred_at')
            ->orderByDesc('id');

        if (($type = $request->query('type')) && $type !== 'all') {
            $query->where('type', $type);
        }

        if ($period = $request->query('period')) {
            match ($period) {
                'today' => $query->whereDate('occurred_at', today()),
                'week' => $query->where('occurred_at', '>=', now()->subDays(6)->startOfDay()),
                'month' => $query->where('occurred_at', '>=', now()->startOfMonth()),
                default => null,
            };
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'ilike', "%{$search}%")
                    ->orWhere('title', 'ilike', "%{$search}%")
                    ->orWhere('note', 'ilike', "%{$search}%");
            });
        }

        $perPage = min($request->integer('per_page', 100), 200);
        $entries = $query->paginate($perPage);

        $today = now()->startOfDay();
        $month = now()->startOfMonth();

        $incomeTodayQuery = QuanEntry::where('type', 'income')->where('occurred_at', '>=', $today);
        $expenseTodayQuery = QuanEntry::where('type', 'expense')->where('occurred_at', '>=', $today);

        $incomeToday = (float) (clone $incomeTodayQuery)->sum('amount');
        $expenseToday = (float) (clone $expenseTodayQuery)->sum('amount');
        $cashToday = (float) (clone $incomeTodayQuery)->sum('cash_amount');
        $transferToday = (float) (clone $incomeTodayQuery)->sum('transfer_amount');
        $salesCountToday = (int) (clone $incomeTodayQuery)->sum('qty');
        $expenseCountToday = (int) (clone $expenseTodayQuery)->count();

        $incomeMonth = (float) QuanEntry::where('type', 'income')->where('occurred_at', '>=', $month)->sum('amount');
        $expenseMonth = (float) QuanEntry::where('type', 'expense')->where('occurred_at', '>=', $month)->sum('amount');

        return response()->json([
            'data' => QuanEntryResource::collection($entries),
            'stats' => [
                'incomeToday' => $incomeToday,
                'expenseToday' => $expenseToday,
                'cashToday' => $cashToday,
                'transferToday' => $transferToday,
                'netToday' => $incomeToday - $expenseToday,
                'salesCountToday' => $salesCountToday,
                'expenseCountToday' => $expenseCountToday,
                'balanceMonth' => $incomeMonth - $expenseMonth,
                'incomeMonth' => $incomeMonth,
                'expenseMonth' => $expenseMonth,
            ],
            'meta' => [
                'current_page' => $entries->currentPage(),
                'last_page' => $entries->lastPage(),
                'per_page' => $entries->perPage(),
                'total' => $entries->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:income,expense',
            'title' => 'nullable|string|max:200',
            'amount' => 'nullable|numeric|min:0',
            'qty' => 'nullable|integer|min:1|max:999',
            'quan_product_id' => 'nullable|exists:quan_products,id',
            'payment_method' => 'required|in:cash,transfer,ewallet,mixed',
            'cash_amount' => 'nullable|numeric|min:0',
            'transfer_amount' => 'nullable|numeric|min:0',
            'note' => 'nullable|string|max:500',
            'occurred_at' => 'nullable|date',
        ]);

        $qty = (int) ($validated['qty'] ?? 1);
        $product = null;
        $unitCost = null;

        if (! empty($validated['quan_product_id'])) {
            $product = QuanProduct::where('is_active', true)->findOrFail($validated['quan_product_id']);
            $validated['title'] = $product->name;
            $unitPrice = isset($validated['amount']) && $validated['amount'] > 0
                ? (float) $validated['amount']
                : (float) $product->price;
            $validated['amount'] = $unitPrice * $qty;
            $validated['type'] = 'income';
            $unitCost = $product->cost_price !== null ? (float) $product->cost_price : null;
        }

        $title = trim((string) ($validated['title'] ?? ''));
        $amount = (float) ($validated['amount'] ?? 0);
        $method = $validated['payment_method'];

        if ($title === '') {
            return response()->json([
                'message' => $validated['type'] === 'income'
                    ? 'Chọn sản phẩm hoặc nhập tên hàng bán ra.'
                    : 'Nhập tên khoản chi.',
            ], 422);
        }

        if ($amount <= 0) {
            return response()->json([
                'message' => 'Vui lòng nhập số tiền hợp lệ.',
            ], 422);
        }

        [$cashAmount, $transferAmount] = $this->resolvePaymentSplit(
            $method,
            $amount,
            isset($validated['cash_amount']) ? (float) $validated['cash_amount'] : null,
            isset($validated['transfer_amount']) ? (float) $validated['transfer_amount'] : null,
        );

        if ($cashAmount === null) {
            return response()->json([
                'message' => 'Với thanh toán cả hai, nhập số tiền mặt (phần còn lại là chuyển khoản). Tổng phải khớp.',
            ], 422);
        }

        $entry = QuanEntry::create([
            'type' => $validated['type'],
            'title' => $title,
            'quan_product_id' => $product?->id,
            'qty' => $validated['type'] === 'income' ? $qty : 1,
            'amount' => $amount,
            'unit_cost' => $validated['type'] === 'income' ? $unitCost : null,
            'payment_method' => $method,
            'cash_amount' => $cashAmount,
            'transfer_amount' => $transferAmount,
            'note' => $validated['note'] ?? null,
            'code' => 'QN-'.now()->format('Ymd').'-'.strtoupper(Str::random(4)),
            'user_id' => $request->user()->id,
            'occurred_at' => $validated['occurred_at'] ?? now(),
        ]);

        ActivityLogger::record($request->user(), [
            'action' => 'create',
            'module' => 'quan',
            'title' => ($entry->type === 'income' ? 'Bán ' : 'Chi ').$entry->title,
            'description' => ActivityLogger::formatMoney((float) $entry->amount),
            'link' => '/quan',
        ]);

        $entry->load(['user:id,name', 'product:id,name,price']);

        return response()->json([
            'data' => new QuanEntryResource($entry),
            'message' => $entry->type === 'income' ? 'Đã ghi bán hàng' : 'Đã ghi khoản chi',
        ], 201);
    }

    public function update(Request $request, QuanEntry $quanEntry): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:200',
            'amount' => 'sometimes|required|numeric|min:0',
            'qty' => 'sometimes|integer|min:1|max:999',
            'payment_method' => 'sometimes|in:cash,transfer,ewallet,mixed',
            'cash_amount' => 'nullable|numeric|min:0',
            'transfer_amount' => 'nullable|numeric|min:0',
            'note' => 'nullable|string|max:500',
            'occurred_at' => 'nullable|date',
        ]);

        $amount = (float) ($validated['amount'] ?? $quanEntry->amount);
        $method = $validated['payment_method'] ?? $quanEntry->payment_method;

        if (
            isset($validated['payment_method'])
            || isset($validated['amount'])
            || array_key_exists('cash_amount', $validated)
            || array_key_exists('transfer_amount', $validated)
        ) {
            $cashInput = array_key_exists('cash_amount', $validated)
                ? (float) $validated['cash_amount']
                : ($method === 'mixed' ? (float) $quanEntry->cash_amount : null);
            $transferInput = array_key_exists('transfer_amount', $validated)
                ? (float) $validated['transfer_amount']
                : null;

            [$cashAmount, $transferAmount] = $this->resolvePaymentSplit(
                $method,
                $amount,
                $cashInput,
                $transferInput,
            );

            if ($cashAmount === null) {
                return response()->json([
                    'message' => 'Với thanh toán cả hai, nhập số tiền mặt hợp lệ (tổng phải khớp).',
                ], 422);
            }

            $validated['payment_method'] = $method;
            $validated['amount'] = $amount;
            $validated['cash_amount'] = $cashAmount;
            $validated['transfer_amount'] = $transferAmount;
        }

        if (isset($validated['title'])) {
            $validated['title'] = trim($validated['title']);
        }

        $quanEntry->update($validated);

        ActivityLogger::record($request->user(), [
            'action' => 'update',
            'module' => 'quan',
            'title' => 'Sửa '.($quanEntry->type === 'income' ? 'bán ' : 'chi ').$quanEntry->title,
            'description' => ActivityLogger::formatMoney((float) $quanEntry->amount),
            'link' => '/quan',
        ]);

        $quanEntry->load(['user:id,name', 'product:id,name,price']);

        return response()->json([
            'data' => new QuanEntryResource($quanEntry->fresh()),
            'message' => 'Đã cập nhật giao dịch',
        ]);
    }

    /**
     * @return array{0: float|null, 1: float}
     */
    private function resolvePaymentSplit(string $method, float $amount, ?float $cashInput, ?float $transferInput): array
    {
        return match ($method) {
            'cash' => [$amount, 0.0],
            'transfer', 'ewallet' => [0.0, $amount],
            'mixed' => $this->resolveMixedSplit($amount, $cashInput, $transferInput),
            default => [$amount, 0.0],
        };
    }

    /**
     * @return array{0: float|null, 1: float}
     */
    private function resolveMixedSplit(float $amount, ?float $cashInput, ?float $transferInput): array
    {
        $cash = $cashInput ?? 0.0;
        $transfer = $transferInput ?? max(0.0, $amount - $cash);

        if ($cashInput === null && $transferInput === null) {
            return [null, 0.0];
        }

        if ($cash <= 0 && $transfer <= 0) {
            return [null, 0.0];
        }

        if ($cashInput !== null && $transferInput === null) {
            $transfer = max(0.0, $amount - $cash);
        } elseif ($transferInput !== null && $cashInput === null) {
            $cash = max(0.0, $amount - $transfer);
        }

        if (abs(($cash + $transfer) - $amount) > 0.01) {
            return [null, 0.0];
        }

        return [round($cash, 2), round($transfer, 2)];
    }

    public function destroy(Request $request, QuanEntry $quanEntry): JsonResponse
    {
        $title = $quanEntry->title;
        $code = $quanEntry->code;
        $quanEntry->delete();

        ActivityLogger::record($request->user(), [
            'action' => 'delete',
            'module' => 'quan',
            'title' => 'Xóa thẻ quán '.$code,
            'description' => $title,
            'link' => '/quan',
        ]);

        return response()->json([
            'message' => 'Đã xóa thẻ',
        ]);
    }
}
