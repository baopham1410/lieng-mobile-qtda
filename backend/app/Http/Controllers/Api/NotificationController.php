<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\StockImport;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->loadMissing('role');
        $items = collect();

        if ($user->isAdmin()) {
            $staffLogs = ActivityLog::query()
                ->with(['user.role'])
                ->whereHas('user.role', fn ($q) => $q->where('name', '!=', 'admin'))
                ->latest()
                ->limit(20)
                ->get();

            foreach ($staffLogs as $log) {
                $items->push([
                    'id' => 'activity-'.$log->id,
                    'title' => $log->title,
                    'desc' => trim(($log->user?->name ?? 'Nhân viên').' · '.($log->description ?? $this->moduleLabel($log->module))),
                    'time' => $log->created_at?->toIso8601String(),
                    'to' => $log->link,
                    'type' => 'staff_activity',
                ]);
            }

            $pendingImports = StockImport::where('status', 'draft')->count();
            if ($pendingImports > 0) {
                $items->push([
                    'id' => 'imports-pending',
                    'title' => 'Phiếu nhập chờ xác nhận',
                    'desc' => "{$pendingImports} phiếu nhập đang ở trạng thái nháp",
                    'time' => now()->subMinutes(20)->toIso8601String(),
                    'to' => '/inventory/imports',
                    'type' => 'system',
                ]);
            }

            $lowStock = ProductVariant::withCount([
                'imeiCodes as in_stock_count' => fn ($q) => $q->where('status', 'in_stock'),
            ])->get()->filter(fn ($v) => $v->in_stock_count > 0 && $v->in_stock_count <= 3)->count();

            if ($lowStock > 0) {
                $items->push([
                    'id' => 'low-stock',
                    'title' => 'Cảnh báo tồn kho',
                    'desc' => "{$lowStock} biến thể sắp hết hàng",
                    'time' => now()->subHour()->toIso8601String(),
                    'to' => '/reports',
                    'type' => 'system',
                ]);
            }
        }

        $latestOrder = Order::where('status', 'completed')->latest('paid_at')->first();
        if ($latestOrder && ! $user->isAdmin()) {
            $items->push([
                'id' => 'order-'.$latestOrder->id,
                'title' => 'Đơn hàng mới '.$latestOrder->code,
                'desc' => 'Thanh toán '.number_format((float) $latestOrder->total, 0, ',', '.').' ₫',
                'time' => ($latestOrder->paid_at ?? $latestOrder->created_at)?->toIso8601String(),
                'to' => '/orders',
                'type' => 'system',
            ]);
        }

        return response()->json(['data' => $items->take(25)->values()]);
    }

    private function moduleLabel(string $module): string
    {
        return match ($module) {
            'products' => 'Sản phẩm / giá',
            'stock_imports' => 'Nhập kho',
            'categories' => 'Danh mục',
            'orders' => 'Đơn hàng',
            'finance' => 'Thu chi',
            'customers' => 'Khách hàng',
            default => 'Hệ thống',
        };
    }
}
