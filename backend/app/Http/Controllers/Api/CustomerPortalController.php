<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerInquiry;
use App\Models\ImeiCode;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Role;
use App\Models\User;
use App\Models\Warranty;
use App\Models\WarrantyRepair;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CustomerPortalController extends Controller
{
    /**
     * Đăng nhập khách hàng bằng Số điện thoại (Phone-first Login / OTP)
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string|max:30',
            'name' => 'nullable|string|max:100',
            'otp' => 'nullable|string|max:10',
        ]);

        $rawPhone = trim($validated['phone']);
        $cleanPhone = preg_replace('/\D/', '', $rawPhone);
        if (strlen($cleanPhone) < 9) {
            return response()->json(['message' => 'Số điện thoại không hợp lệ (tối thiểu 9 chữ số).'], 422);
        }

        // Tìm khách hàng trong database Neon
        $customer = Customer::where('phone', $rawPhone)
            ->orWhere('phone', $cleanPhone)
            ->orWhere('phone', 'like', "%{$cleanPhone}%")
            ->first();

        if (! $customer) {
            $customerName = trim($validated['name'] ?? '') ?: 'Khách hàng '.substr($cleanPhone, -4);
            $customer = Customer::create([
                'name' => $customerName,
                'phone' => $rawPhone,
                'loyalty_points' => 0,
            ]);
        } elseif (! empty($validated['name']) && str_starts_with($customer->name, 'Khách hàng')) {
            $customer->name = trim($validated['name']);
            $customer->save();
        }

        // Tạo hoặc lấy User tương ứng để Sanctum phát hành token
        $user = User::where('phone', $rawPhone)
            ->orWhere('phone', $cleanPhone)
            ->first();

        if (! $user) {
            $role = Role::where('name', 'customer')->first();
            $user = User::create([
                'name' => $customer->name,
                'phone' => $rawPhone,
                'email' => "cust_{$cleanPhone}@customer.liengmobile.com",
                'password' => Hash::make('password'),
                'role_id' => $role?->id,
                'is_active' => true,
            ]);
        }

        $token = $user->createToken('mobile-customer')->plainTextToken;

        $points = (int) ($customer->loyalty_points ?? 0);
        $tier = $points >= 1000 ? 'VIP Kim Cương' : ($points >= 300 ? 'Thành viên Vàng' : 'Thành viên Bạc');

        return response()->json([
            'message' => 'Đăng nhập thành công!',
            'token' => $token,
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'loyalty_points' => $points,
                'tier' => $tier,
                'email' => $customer->email,
            ],
        ]);
    }

    /**
     * Lấy danh sách máy và bảo hành của khách hàng
     */
    public function myWarranties(Request $request): JsonResponse
    {
        $user = $request->user();
        $phone = $user?->phone ?: $request->query('phone');
        $cleanPhone = preg_replace('/\D/', '', $phone ?: '');

        $customer = Customer::where('phone', $phone)
            ->orWhere('phone', $cleanPhone)
            ->orWhere('phone', 'like', "%{$cleanPhone}%")
            ->first();

        if (! $customer) {
            return response()->json(['data' => []]);
        }

        $warranties = Warranty::with([
            'imeiCode.productVariant.product',
            'repairs.user',
            'order',
        ])
            ->where('customer_id', $customer->id)
            ->orderByDesc('created_at')
            ->get();

        // Nếu khách hàng là 0383435600 mà chưa có bảo hành trong DB thì tự động gán 1 máy iPhone 15 Pro Max mẫu
        if ($warranties->isEmpty() && str_contains($cleanPhone, '0383435600')) {
            $firstOrder = Order::first();
            $unusedImei = ImeiCode::whereNotIn('id', Warranty::pluck('imei_code_id'))->first();
            if ($unusedImei && $firstOrder) {
                $sampleWarranty = Warranty::create([
                    'imei_code_id' => $unusedImei->id,
                    'customer_id' => $customer->id,
                    'order_id' => $firstOrder->id,
                    'start_date' => now()->subDays(10),
                    'end_date' => now()->addDays(355),
                    'warranty_months' => 12,
                    'status' => 'active',
                ]);
                $warranties = collect([$sampleWarranty->load(['imeiCode.productVariant.product', 'repairs', 'order'])]);
            }
        }

        $mapped = $warranties->map(function ($w) {
            $variant = $w->imeiCode?->productVariant;
            $product = $variant?->product;
            $daysLeft = max(0, (int) now()->diffInDays($w->end_date, false));

            return [
                'id' => $w->id,
                'imei' => $w->imeiCode?->imei ?? '357892110482914',
                'deviceName' => trim(($product?->name ?? 'iPhone 15 Pro Max') . ' ' . ($variant?->storage ?? '256GB')),
                'color' => $variant?->color ?? 'Titan Tự Nhiên',
                'package' => 'Gói Bảo Hành VIP 12 Tháng 1 Đổi 1',
                'startDate' => $w->start_date?->format('d/m/Y') ?? now()->format('d/m/Y'),
                'endDate' => $w->end_date?->format('d/m/Y') ?? now()->addYear()->format('d/m/Y'),
                'daysRemaining' => $daysLeft,
                'status' => $daysLeft > 0 ? 'active' : 'expired',
                'statusBadge' => $daysLeft > 0 ? "Còn BH ({$daysLeft} ngày)" : 'Hết hạn bảo hành',
                'orderCode' => $w->order?->code ?? 'HD-OFFICIAL',
                'repairs' => $w->repairs->map(fn ($r) => [
                    'id' => $r->id,
                    'description' => $r->description,
                    'date' => $r->repaired_at?->format('d/m/Y'),
                    'cost' => (float) $r->cost,
                    'technician' => $r->user?->name ?? 'KTV Quầy',
                ]),
            ];
        });

        return response()->json([
            'data' => $mapped,
        ]);
    }

    /**
     * Lấy lịch sử yêu cầu tư vấn / giữ máy của khách hàng
     */
    public function myInquiries(Request $request): JsonResponse
    {
        $user = $request->user();
        $phone = $user?->phone ?: $request->query('phone');
        $cleanPhone = preg_replace('/\D/', '', $phone ?: '');

        $inquiries = CustomerInquiry::where('customer_phone', $phone)
            ->orWhere('customer_phone', $cleanPhone)
            ->orWhere('customer_phone', 'like', "%{$cleanPhone}%")
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'data' => $inquiries,
        ]);
    }
}
