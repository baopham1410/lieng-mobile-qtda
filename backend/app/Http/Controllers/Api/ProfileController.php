<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\ImeiCode;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\StockImport;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Warranty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user()->load('role.permissions');
        $role = $user->role?->name ?? 'admin';
        $today = now()->startOfDay();

        $base = [
            'role' => $role,
            'permissions' => $user->role?->permissions->pluck('name')->values() ?? collect(),
        ];

        if ($role === 'sales_staff') {
            $orders = Order::where('user_id', $user->id)->where('paid_at', '>=', $today);
            $completed = (clone $orders)->where('status', 'completed');

            return response()->json([
                'data' => array_merge($base, [
                    'stats' => [
                        'ordersToday' => $completed->count(),
                        'revenueToday' => (float) $completed->sum('total'),
                        'customersServed' => $completed->distinct('customer_id')->count('customer_id'),
                        'avgOrderValue' => (float) ($completed->avg('total') ?? 0),
                    ],
                ]),
            ]);
        }

        if ($role === 'warehouse_staff') {
            $imports = StockImport::where('user_id', $user->id)->where('created_at', '>=', $today);

            return response()->json([
                'data' => array_merge($base, [
                    'stats' => [
                        'importsToday' => $imports->count(),
                        'importsPending' => StockImport::where('status', 'draft')->count(),
                        'imeiScanned' => ImeiCode::where('updated_at', '>=', $today)->count(),
                        'lowStockAlerts' => ProductVariant::withCount([
                            'imeiCodes as in_stock_count' => fn ($q) => $q->where('status', 'in_stock'),
                        ])->get()->filter(fn ($v) => $v->in_stock_count > 0 && $v->in_stock_count <= 3)->count(),
                    ],
                ]),
            ]);
        }

        $todayOrders = Order::where('paid_at', '>=', $today)->where('status', 'completed');

        return response()->json([
            'data' => array_merge($base, [
                'stats' => [
                    'ordersToday' => $todayOrders->count(),
                    'revenueToday' => (float) $todayOrders->sum('total'),
                    'importsPending' => StockImport::where('status', 'draft')->count(),
                    'staffOnline' => User::where('is_active', true)->count(),
                ],
            ]),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = $request->user();
        $user->update($validated);

        return response()->json([
            'data' => new UserResource($user->fresh()->load(['role.permissions'])),
            'message' => 'Cập nhật hồ sơ thành công',
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Mật khẩu hiện tại không đúng.'],
            ]);
        }

        $user->update(['password' => Hash::make($validated['password'])]);

        return response()->json(['message' => 'Đổi mật khẩu thành công']);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|max:2048',
        ]);

        $user = $request->user();

        if ($user->avatar_url) {
            $old = ltrim(str_replace('/storage/', '', parse_url($user->avatar_url, PHP_URL_PATH) ?? ''), '/');
            if ($old) {
                Storage::disk('public')->delete($old);
            }
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar_url' => Storage::url($path)]);

        return response()->json([
            'data' => new UserResource($user->fresh()->load(['role.permissions'])),
            'message' => 'Cập nhật avatar thành công',
        ]);
    }

    public function activity(Request $request): JsonResponse
    {
        $user = $request->user();
        $activities = collect();

        Order::where('user_id', $user->id)
            ->latest('paid_at')
            ->take(5)
            ->get()
            ->each(function (Order $order) use ($activities) {
                $activities->push([
                    'id' => 'order-'.$order->id,
                    'action' => 'Thanh toán đơn '.$order->code,
                    'module' => 'Bán hàng',
                    'at' => ($order->paid_at ?? $order->created_at)?->toIso8601String(),
                ]);
            });

        StockImport::where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get()
            ->each(function (StockImport $import) use ($activities) {
                $activities->push([
                    'id' => 'import-'.$import->id,
                    'action' => 'Phiếu nhập '.$import->code,
                    'module' => 'Kho',
                    'at' => $import->created_at?->toIso8601String(),
                ]);
            });

        Transaction::where('user_id', $user->id)
            ->latest('transacted_at')
            ->take(5)
            ->get()
            ->each(function (Transaction $tx) use ($activities) {
                $activities->push([
                    'id' => 'tx-'.$tx->id,
                    'action' => ($tx->type === 'income' ? 'Thu ' : 'Chi ').$tx->code,
                    'module' => 'Tài chính',
                    'at' => $tx->transacted_at?->toIso8601String(),
                ]);
            });

        return response()->json([
            'data' => $activities->sortByDesc('at')->take(10)->values(),
        ]);
    }

    public function loginHistory(Request $request): JsonResponse
    {
        $sessions = $request->user()
            ->tokens()
            ->latest('last_used_at')
            ->take(5)
            ->get()
            ->map(fn ($token, $index) => [
                'id' => $token->id,
                'device' => $token->name ?: 'Thiết bị web',
                'location' => 'Việt Nam',
                'ip' => '—',
                'at' => ($token->last_used_at ?? $token->created_at)?->toIso8601String(),
                'current' => $index === 0,
            ]);

        return response()->json(['data' => $sessions]);
    }
}
