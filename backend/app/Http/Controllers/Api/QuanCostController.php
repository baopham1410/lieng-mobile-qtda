<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuanProductResource;
use App\Models\QuanEntry;
use App\Models\QuanProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuanCostController extends Controller
{
    /**
     * Trang giá nhập: danh sách SP + tổng hợp lời theo kỳ.
     */
    public function index(Request $request): JsonResponse
    {
        $period = $request->query('period', 'today');

        $products = QuanProduct::query()
            ->where('is_active', true)
            ->orderByRaw("CASE category
                WHEN 'dien-thoai' THEN 1
                WHEN 'dich-vu' THEN 2
                WHEN 'man-hinh' THEN 3
                WHEN 'pin' THEN 4
                WHEN 'phu-kien' THEN 5
                WHEN 'sim-card' THEN 6
                WHEN 'dong-ho' THEN 7
                ELSE 8 END")
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $from = match ($period) {
            'week' => now()->subDays(6)->startOfDay(),
            'month' => now()->startOfMonth(),
            default => now()->startOfDay(),
        };

        $entries = QuanEntry::query()
            ->with(['product:id,name,cost_price,price'])
            ->where('occurred_at', '>=', $from)
            ->orderByDesc('occurred_at')
            ->get();

        $revenue = 0.0;
        $cogs = 0.0;
        $expense = 0.0;
        $salesQty = 0;
        $salesLines = 0;
        $missingCostQty = 0;
        $byProduct = [];

        foreach ($entries as $entry) {
            if ($entry->type === 'expense') {
                $expense += (float) $entry->amount;

                continue;
            }

            if ($entry->type !== 'income') {
                continue;
            }

            $qty = max(1, (int) ($entry->qty ?? 1));
            $amount = (float) $entry->amount;
            $revenue += $amount;
            $salesQty += $qty;
            $salesLines++;

            $unitCost = $entry->unit_cost !== null
                ? (float) $entry->unit_cost
                : ($entry->product?->cost_price !== null ? (float) $entry->product->cost_price : null);

            if ($unitCost === null) {
                $missingCostQty += $qty;
                $unitCost = 0.0;
            }

            $lineCogs = $unitCost * $qty;
            $cogs += $lineCogs;

            $key = $entry->quan_product_id
                ? 'p:'.$entry->quan_product_id
                : 't:'.mb_strtolower(trim((string) $entry->title));

            if (! isset($byProduct[$key])) {
                $byProduct[$key] = [
                    'title' => $entry->title,
                    'quanProductId' => $entry->quan_product_id,
                    'qty' => 0,
                    'revenue' => 0.0,
                    'cogs' => 0.0,
                    'costPrice' => $unitCost,
                    'sellPriceAvg' => 0.0,
                ];
            }

            $byProduct[$key]['qty'] += $qty;
            $byProduct[$key]['revenue'] += $amount;
            $byProduct[$key]['cogs'] += $lineCogs;
        }

        $rows = array_values(array_map(function (array $row) {
            $qty = max(1, (int) $row['qty']);
            $row['sellPriceAvg'] = round($row['revenue'] / $qty, 2);
            $row['profit'] = round($row['revenue'] - $row['cogs'], 2);
            $row['revenue'] = round($row['revenue'], 2);
            $row['cogs'] = round($row['cogs'], 2);

            return $row;
        }, $byProduct));

        usort($rows, fn ($a, $b) => $b['profit'] <=> $a['profit']);

        $grossProfit = $revenue - $cogs;
        $netProfit = $grossProfit - $expense;
        $missingCostCount = $products->filter(fn ($p) => $p->cost_price === null || (float) $p->cost_price <= 0)->count();

        return response()->json([
            'data' => [
                'products' => QuanProductResource::collection($products),
                'categories' => collect(QuanProduct::CATEGORIES)
                    ->map(fn ($label, $value) => ['value' => $value, 'label' => $label])
                    ->values(),
                'summary' => [
                    'period' => in_array($period, ['today', 'week', 'month'], true) ? $period : 'today',
                    'revenue' => round($revenue, 2),
                    'cogs' => round($cogs, 2),
                    'grossProfit' => round($grossProfit, 2),
                    'expense' => round($expense, 2),
                    'netProfit' => round($netProfit, 2),
                    'salesQty' => $salesQty,
                    'salesLines' => $salesLines,
                    'missingCostProducts' => $missingCostCount,
                    'missingCostSoldQty' => $missingCostQty,
                ],
                'byProduct' => $rows,
            ],
        ]);
    }
};
