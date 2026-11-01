<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ImeiCode;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\StockImport;
use App\Services\ReportCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payload = ReportCacheService::rememberDashboard(function () {
            return $this->buildDashboardPayload();
        });

        $user = $request->user();
        $user?->loadMissing('role');

        if ($user?->isAdmin()) {
            $payload['staff_activity'] = ActivityLog::query()
                ->with(['user.role'])
                ->whereHas('user.role', fn ($q) => $q->where('name', '!=', 'admin'))
                ->latest()
                ->limit(30)
                ->get()
                ->map(fn (ActivityLog $log) => [
                    'id' => $log->id,
                    'staff' => $log->user?->name ?? 'Nhân viên',
                    'role' => $log->user?->role?->display_name ?? '',
                    'action' => $log->action,
                    'module' => $log->module,
                    'title' => $log->title,
                    'description' => $log->description,
                    'link' => $log->link,
                    'at' => $log->created_at?->toIso8601String(),
                ]);
        } else {
            $payload['staff_activity'] = [];
        }

        return response()->json(['data' => $payload]);
    }

    private function buildDashboardPayload(): array
    {
        $today = now()->startOfDay();
        $monthStart = now()->startOfMonth();

        $orderSummary = Order::query()
            ->selectRaw(
                "COALESCE(SUM(CASE WHEN status = 'completed' AND paid_at >= ? THEN total ELSE 0 END), 0) as today_revenue,
                 SUM(CASE WHEN status = 'completed' AND paid_at >= ? THEN 1 ELSE 0 END) as today_orders,
                 COALESCE(SUM(CASE WHEN status = 'completed' AND paid_at >= ? THEN total ELSE 0 END), 0) as month_revenue",
                [$today, $today, $monthStart]
            )
            ->first();

        $recentOrders = Order::with(['customer'])
            ->where('status', 'completed')
            ->orderByDesc('paid_at')
            ->limit(5)
            ->get(['id', 'code', 'customer_id', 'total', 'status', 'paid_at']);

        $stockCounts = DB::table('imei_codes')
            ->selectRaw('product_variant_id, COUNT(*) as in_stock_count')
            ->where('status', 'in_stock')
            ->groupBy('product_variant_id');

        $lowStockVariants = ProductVariant::query()
            ->joinSub($stockCounts, 'stock_counts', fn ($join) => $join->on('stock_counts.product_variant_id', '=', 'product_variants.id'))
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->whereBetween('stock_counts.in_stock_count', [1, 3])
            ->orderBy('stock_counts.in_stock_count')
            ->limit(5)
            ->get()
            ->map(fn ($v) => [
                'name' => $v->name,
                'variant' => trim(implode(' · ', array_filter([$v->color, $v->storage]))),
                'stock' => (int) $v->in_stock_count,
            ])
            ->values();

        $monthRevenue = (float) ($orderSummary->month_revenue ?? 0);

        return [
            'today_revenue' => (float) ($orderSummary->today_revenue ?? 0),
            'today_orders' => (int) ($orderSummary->today_orders ?? 0),
            'month_revenue' => $monthRevenue,
            'month_profit' => (float) ($monthRevenue * 0.28),
            'imei_in_stock' => ImeiCode::where('status', 'in_stock')->count(),
            'pending_imports' => StockImport::where('status', 'draft')->count(),
            'low_stock_variants' => $lowStockVariants->count(),
            'recent_orders' => $recentOrders->map(fn ($o) => [
                'id' => $o->code,
                'customer' => $o->customer?->name ?? 'Khách lẻ',
                'total' => (float) $o->total,
                'status' => $o->status,
                'time' => $o->paid_at?->format('H:i'),
            ]),
            'low_stock_list' => $lowStockVariants,
        ];
    }
}
