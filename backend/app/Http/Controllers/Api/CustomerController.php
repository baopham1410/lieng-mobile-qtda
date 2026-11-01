<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::with(['orders' => fn ($q) => $q->where('status', 'completed')])
            ->withCount(['orders' => fn ($q) => $q->where('status', 'completed')])
            ->orderByDesc('updated_at');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        $customers = $query->paginate($request->integer('per_page', 50));

        $stats = [
            'totalCustomers' => Customer::count(),
            'newThisMonth' => Customer::where('created_at', '>=', now()->startOfMonth())->count(),
            'loyaltyMembers' => Customer::where('loyalty_points', '>=', 3000)->count(),
            'totalRevenue' => (float) Order::where('status', 'completed')
                ->where('paid_at', '>=', now()->startOfMonth())
                ->sum('total'),
        ];

        return response()->json([
            'data' => CustomerResource::collection($customers),
            'stats' => $stats,
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:20|unique:customers,phone',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
        ]);

        $customer = Customer::create($validated);

        return response()->json([
            'data' => new CustomerResource($customer),
            'message' => 'Tạo khách hàng thành công',
        ], 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        $customer->load(['orders' => fn ($q) => $q->where('status', 'completed')->orderByDesc('paid_at')]);

        return response()->json(['data' => new CustomerResource($customer)]);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'phone' => 'sometimes|string|max:20|unique:customers,phone,'.$customer->id,
            'email' => 'nullable|email',
            'address' => 'nullable|string',
        ]);

        $customer->update($validated);

        return response()->json([
            'data' => new CustomerResource($customer->fresh(['orders'])),
            'message' => 'Cập nhật khách hàng thành công',
        ]);
    }
}
