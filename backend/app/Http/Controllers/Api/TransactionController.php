<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\ExpenseCategory;
use App\Models\Order;
use App\Models\StockImport;
use App\Models\Transaction;
use App\Services\ActivityLogger;
use App\Services\ReportCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with(['category', 'user'])
            ->orderByDesc('transacted_at');

        if ($type = $request->query('type')) {
            if ($type !== 'all') {
                $query->where('type', $type);
            }
        }

        if ($category = $request->query('category')) {
            if ($category === 'sales') {
                $query->where('type', 'income');
            } elseif ($category !== 'all') {
                $query->where(function ($q) use ($category) {
                    $q->whereHas('category', fn ($cat) => $cat->where('type', $category));
                });
            }
        }

        if ($period = $request->query('period')) {
            match ($period) {
                'today' => $query->whereDate('transacted_at', today()),
                'week' => $query->where('transacted_at', '>=', now()->subDays(6)->startOfDay()),
                'month' => $query->where('transacted_at', '>=', now()->startOfMonth()),
                default => null,
            };
        }

        if ($search = trim((string) $request->query('search'))) {
            $orderIds = Order::query()
                ->where('code', 'ilike', "%{$search}%")
                ->pluck('id');
            $importIds = StockImport::query()
                ->where('code', 'ilike', "%{$search}%")
                ->pluck('id');

            $query->where(function ($q) use ($search, $orderIds, $importIds) {
                $q->where('code', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");

                if ($orderIds->isNotEmpty()) {
                    $q->orWhere(function ($sub) use ($orderIds) {
                        $sub->where('reference_type', 'Order')
                            ->whereIn('reference_id', $orderIds);
                    });
                }

                if ($importIds->isNotEmpty()) {
                    $q->orWhere(function ($sub) use ($importIds) {
                        $sub->where('reference_type', 'StockImport')
                            ->whereIn('reference_id', $importIds);
                    });
                }
            });
        }

        $perPage = min($request->integer('per_page', 50), 200);
        $transactions = $query->paginate($perPage);

        $this->attachReferenceCodes($transactions->getCollection());

        $today = now()->startOfDay();
        $month = now()->startOfMonth();

        $incomeToday = (float) Transaction::where('type', 'income')->where('transacted_at', '>=', $today)->sum('amount');
        $expenseToday = (float) Transaction::where('type', 'expense')->where('transacted_at', '>=', $today)->sum('amount');
        $incomeMonth = (float) Transaction::where('type', 'income')->where('transacted_at', '>=', $month)->sum('amount');
        $expenseMonth = (float) Transaction::where('type', 'expense')->where('transacted_at', '>=', $month)->sum('amount');

        $stats = [
            'incomeToday' => $incomeToday,
            'expenseToday' => $expenseToday,
            'netToday' => $incomeToday - $expenseToday,
            'balanceMonth' => $incomeMonth - $expenseMonth,
            'incomeMonth' => $incomeMonth,
            'expenseMonth' => $expenseMonth,
        ];

        return response()->json([
            'data' => TransactionResource::collection($transactions),
            'stats' => $stats,
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|in:cash,transfer,ewallet,mixed',
            'category_id' => [
                Rule::requiredIf(fn () => $request->input('type') === 'expense'),
                'nullable',
                'exists:expense_categories,id',
            ],
            'description' => 'nullable|string|max:500',
            'transacted_at' => 'nullable|date',
        ]);

        if ($validated['type'] === 'expense') {
            $category = ExpenseCategory::find($validated['category_id']);
            if ($category?->type === 'import') {
                return response()->json([
                    'message' => 'Chi nhập hàng chỉ được tạo tự động khi xác nhận phiếu nhập kho.',
                ], 422);
            }
        } else {
            $validated['category_id'] = null;
        }

        $tx = Transaction::create([
            ...$validated,
            'code' => 'TC-'.now()->format('Ymd').'-'.strtoupper(Str::random(4)),
            'user_id' => $request->user()->id,
            'reference_type' => 'Manual',
            'transacted_at' => $validated['transacted_at'] ?? now(),
        ]);

        ActivityLogger::record($request->user(), [
            'action' => 'create',
            'module' => 'finance',
            'title' => ($validated['type'] === 'income' ? 'Ghi thu ' : 'Ghi chi ').$tx->code,
            'description' => ActivityLogger::formatMoney((float) $tx->amount),
            'link' => '/finance',
        ]);

        ReportCacheService::bustAll();

        $tx->load(['category', 'user']);
        $this->attachReferenceCodes(collect([$tx]));

        return response()->json([
            'data' => new TransactionResource($tx),
            'message' => 'Ghi nhận giao dịch thành công',
        ], 201);
    }

    public function expenseCategories(): JsonResponse
    {
        return response()->json([
            'data' => ExpenseCategory::orderBy('name')->get(['id', 'name', 'type']),
        ]);
    }

    private function attachReferenceCodes(Collection $transactions): void
    {
        $orderIds = $transactions
            ->where('reference_type', 'Order')
            ->pluck('reference_id')
            ->filter()
            ->unique()
            ->values();

        $importIds = $transactions
            ->where('reference_type', 'StockImport')
            ->pluck('reference_id')
            ->filter()
            ->unique()
            ->values();

        $orderCodes = $orderIds->isEmpty()
            ? collect()
            : Order::whereIn('id', $orderIds)->pluck('code', 'id');

        $importCodes = $importIds->isEmpty()
            ? collect()
            : StockImport::whereIn('id', $importIds)->pluck('code', 'id');

        $transactions->each(function (Transaction $tx) use ($orderCodes, $importCodes) {
            $code = match ($tx->reference_type) {
                'Order' => $orderCodes[$tx->reference_id] ?? null,
                'StockImport' => $importCodes[$tx->reference_id] ?? null,
                default => null,
            };

            $tx->setAttribute('reference_code', $code);
        });
    }
}
