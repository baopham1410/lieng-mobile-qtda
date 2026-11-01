<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use App\Models\ImeiCode;
use App\Models\Order;
use App\Models\ProductPrice;
use App\Models\ProductVariant;
use App\Models\StockImport;
use App\Models\StockImportItem;
use App\Models\Transaction;
use App\Services\ReportCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private const EXPENSE_COLORS = [
        'bg-red-500',
        'bg-orange-400',
        'bg-amber-500',
        'bg-sky-500',
        'bg-violet-500',
        'bg-emerald-500',
    ];

    public function revenue(Request $request): JsonResponse
    {
        [$from, $to] = $this->resolvePeriodRange($request);
        $suffix = $from->toDateString().'_'.$to->toDateString();

        $payload = ReportCacheService::rememberRevenue($suffix, function () use ($from, $to) {
            $toEnd = $to->copy()->endOfDay();
            $chartFrom = $from->copy()->startOfDay();

            $orderSummary = Order::query()
                ->selectRaw('COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders, COALESCE(AVG(total), 0) as avg_order')
                ->where('status', 'completed')
                ->whereBetween('paid_at', [$from, $toEnd])
                ->first();

            $revenue = (float) ($orderSummary->revenue ?? 0);
            $orderCount = (int) ($orderSummary->orders ?? 0);
            $profit = $revenue * 0.28;

            $expenseRows = Transaction::query()
                ->leftJoin('expense_categories', 'expense_categories.id', '=', 'transactions.category_id')
                ->where('transactions.type', 'expense')
                ->whereBetween('transactions.transacted_at', [$from, $toEnd])
                ->groupBy(DB::raw("COALESCE(expense_categories.name, 'Khác')"))
                ->orderByDesc(DB::raw('SUM(transactions.amount)'))
                ->get([
                    DB::raw("COALESCE(expense_categories.name, 'Khác') as name"),
                    DB::raw('SUM(transactions.amount) as amount'),
                ]);

            $totalExpense = max(1, (float) $expenseRows->sum('amount'));
            $expenseBreakdown = $expenseRows->values()->map(function ($row, $index) use ($totalExpense) {
                return [
                    'name' => $row->name,
                    'amount' => (float) $row->amount,
                    'percent' => round(((float) $row->amount / $totalExpense) * 100),
                    'color' => self::EXPENSE_COLORS[$index % count(self::EXPENSE_COLORS)],
                ];
            })->values();

            $dailyRevenue = Order::query()
                ->where('status', 'completed')
                ->whereBetween('paid_at', [$chartFrom, $toEnd])
                ->selectRaw('DATE(paid_at) as day, SUM(total) as revenue, COUNT(*) as orders')
                ->groupBy('day')
                ->orderBy('day')
                ->get()
                ->map(fn ($row) => [
                    'label' => \Carbon\Carbon::parse($row->day)->format('d/m'),
                    'day' => \Carbon\Carbon::parse($row->day)->locale('vi')->isoFormat('dd'),
                    'revenue' => (float) $row->revenue,
                    'orders' => (int) $row->orders,
                    'profit' => (float) $row->revenue * 0.28,
                ]);

            $stockCounts = DB::table('imei_codes')
                ->selectRaw('product_variant_id, COUNT(*) as in_stock_count')
                ->where('status', 'in_stock')
                ->groupBy('product_variant_id');

            $lowStock = DB::query()
                ->fromSub($stockCounts, 'stock_counts')
                ->whereBetween('stock_counts.in_stock_count', [1, 3])
                ->count();

            return [
                'summary' => [
                    'revenue' => $revenue,
                    'profit' => $profit,
                    'orders' => $orderCount,
                    'avgOrder' => (float) ($orderSummary->avg_order ?? 0),
                    'growth' => 12.3,
                    'imeiInStock' => ImeiCode::where('status', 'in_stock')->count(),
                    'lowStock' => $lowStock,
                ],
                'dailyRevenue' => $dailyRevenue,
                'expenseBreakdown' => $expenseBreakdown,
                'incomeBreakdown' => [
                    ['name' => 'Bán hàng', 'amount' => $revenue, 'percent' => $revenue > 0 ? 100 : 0],
                ],
                'period' => [
                    'from' => $from->toDateString(),
                    'to' => $to->toDateString(),
                ],
            ];
        });

        return response()->json(['data' => $payload]);
    }

    private function resolvePeriodRange(Request $request): array
    {
        if ($request->filled('from') && $request->filled('to')) {
            return [
                $request->date('from')->startOfDay(),
                $request->date('to')->endOfDay(),
            ];
        }

        return match ($request->query('period', 'month')) {
            'week' => [now()->subDays(6)->startOfDay(), now()->endOfDay()],
            'quarter' => [now()->firstOfQuarter()->startOfDay(), now()->endOfDay()],
            default => [now()->startOfMonth()->startOfDay(), now()->endOfDay()],
        };
    }

    public function inventory(): JsonResponse
    {
        $payload = ReportCacheService::rememberInventory(function () {
            $today = now()->toDateString();

            $stockCounts = DB::table('imei_codes')
                ->selectRaw('product_variant_id, COUNT(*) as in_stock_count')
                ->where('status', 'in_stock')
                ->groupBy('product_variant_id');

            $latestImportDates = ProductPrice::query()
                ->selectRaw('product_variant_id, MAX(effective_from) as effective_from')
                ->where('price_type', 'import')
                ->where('effective_from', '<=', $today)
                ->where(function ($q) use ($today) {
                    $q->whereNull('effective_to')
                        ->orWhere('effective_to', '>=', $today);
                })
                ->groupBy('product_variant_id');

            $byCategory = ProductVariant::query()
                ->joinSub($stockCounts, 'stock_counts', fn ($join) => $join->on('stock_counts.product_variant_id', '=', 'product_variants.id'))
                ->join('products', 'products.id', '=', 'product_variants.product_id')
                ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
                ->leftJoinSub($latestImportDates, 'latest_import_dates', fn ($join) => $join->on('latest_import_dates.product_variant_id', '=', 'product_variants.id'))
                ->leftJoin('product_prices as import_prices', function ($join) {
                    $join->on('import_prices.product_variant_id', '=', 'product_variants.id')
                        ->on('import_prices.effective_from', '=', 'latest_import_dates.effective_from')
                        ->where('import_prices.price_type', '=', 'import');
                })
                ->groupBy(DB::raw("COALESCE(categories.name, 'Khác')"))
                ->orderByDesc(DB::raw('SUM(stock_counts.in_stock_count * COALESCE(import_prices.amount, 0))'))
                ->get([
                    DB::raw("COALESCE(categories.name, 'Khác') as category"),
                    DB::raw('SUM(stock_counts.in_stock_count) as imeiCount'),
                    DB::raw('SUM(stock_counts.in_stock_count * COALESCE(import_prices.amount, 0)) as value'),
                ])
                ->map(fn ($row) => [
                    'category' => $row->category,
                    'imeiCount' => (int) $row->imeicount,
                    'value' => (float) $row->value,
                ]);

            $lowStock = ProductVariant::query()
                ->joinSub($stockCounts, 'stock_counts', fn ($join) => $join->on('stock_counts.product_variant_id', '=', 'product_variants.id'))
                ->join('products', 'products.id', '=', 'product_variants.product_id')
                ->whereBetween('stock_counts.in_stock_count', [1, 3])
                ->orderBy('stock_counts.in_stock_count')
                ->limit(50)
                ->get([
                    'products.name as product',
                    'product_variants.color',
                    'product_variants.storage',
                    'stock_counts.in_stock_count',
                ])
                ->map(fn ($row) => [
                    'product' => $row->product,
                    'variant' => trim(implode(' · ', array_filter([$row->color, $row->storage]))),
                    'stock' => (int) $row->in_stock_count,
                ])
                ->values();

            return [
                'totalImei' => ImeiCode::where('status', 'in_stock')->count(),
                'byCategory' => $byCategory->values(),
                'lowStock' => $lowStock,
            ];
        });

        return response()->json(['data' => $payload]);
    }
}
