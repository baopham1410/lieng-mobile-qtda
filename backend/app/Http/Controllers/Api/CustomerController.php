<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\AppraisalTicket;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::with(['orders' => fn ($q) => $q->where('status', 'completed')])
            ->withCount([
                'orders' => fn ($q) => $q->where('status', 'completed'),
                'warranties',
            ])
            ->orderByDesc('updated_at');

        if ($search = trim((string) $request->query('search', ''))) {
            $this->applySearchFilter($query, $search);
        }

        if ($tier = trim((string) $request->query('tier', ''))) {
            $this->applyTierFilter($query, $tier);
        }

        $perPage = max(1, min($request->integer('per_page', 15), 500));
        $customers = $query->paginate($perPage);

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
        $validated = $this->validateCustomer($request);
        $customer = Customer::create($validated);

        return response()->json([
            'data' => new CustomerResource($customer),
            'message' => 'Tạo khách hàng thành công',
        ], 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        $customer->load([
            'orders' => fn ($q) => $q->where('status', 'completed')->orderByDesc('paid_at'),
            'warranties.imeiCode.productVariant.product',
            'warranties.repairs',
        ]);
        $customer->setAttribute('appraisals_list', $this->loadAppraisalsForCustomer($customer));

        return response()->json(['data' => new CustomerResource($customer)]);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $this->validateCustomer($request, $customer);
        $customer->update($validated);

        return response()->json([
            'data' => new CustomerResource($customer->fresh([
                'orders' => fn ($q) => $q->where('status', 'completed')->orderByDesc('paid_at'),
                'warranties.imeiCode.productVariant.product',
            ])),
            'message' => 'Cập nhật khách hàng thành công',
        ]);
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();

        return response()->json([
            'message' => 'Đã xóa khách hàng thành công',
        ]);
    }

    private function validateCustomer(Request $request, ?Customer $existing = null): array
    {
        $phoneUnique = Rule::unique('customers', 'phone');
        if ($existing) {
            $phoneUnique->ignore($existing->id);
        }

        return $request->validate([
            'name' => [$existing ? 'sometimes' : 'required', 'string', 'max:100'],
            'phone' => [$existing ? 'sometimes' : 'required', 'string', 'max:20', $phoneUnique],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }

    private function applySearchFilter(Builder $query, string $search): void
    {
        $like = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
        $pattern = "%{$search}%";

        $query->where(function (Builder $q) use ($like, $pattern) {
            $q->where('name', $like, $pattern)
                ->orWhere('phone', $like, $pattern)
                ->orWhere('email', $like, $pattern)
                ->orWhere('address', $like, $pattern);
        });
    }

    private function applyTierFilter(Builder $query, string $tier): void
    {
        if ($tier === '' || $tier === 'all') {
            return;
        }

        $spentSql = "(SELECT COALESCE(SUM(total), 0) FROM orders WHERE orders.customer_id = customers.id AND orders.status = 'completed')";
        $countSql = "(SELECT COUNT(*) FROM orders WHERE orders.customer_id = customers.id AND orders.status = 'completed')";

        match ($tier) {
            'diamond' => $query->whereRaw("{$spentSql} >= ?", [150000000]),
            'gold' => $query->whereRaw("{$spentSql} >= ? AND {$spentSql} < ?", [80000000, 150000000]),
            'silver' => $query->whereRaw("{$spentSql} >= ? AND {$spentSql} < ?", [30000000, 80000000]),
            'regular' => $query->whereRaw("{$spentSql} < ? AND {$countSql} > 0", [30000000]),
            'walkin' => $query->whereRaw("{$spentSql} < ? AND {$countSql} = 0", [30000000]),
            default => null,
        };
    }

    private function loadAppraisalsForCustomer(Customer $customer): array
    {
        if (! class_exists(AppraisalTicket::class) || ! Schema::hasTable('appraisal_tickets')) {
            return [];
        }

        $normalizedPhone = preg_replace('/\D+/', '', (string) $customer->phone);
        if ($normalizedPhone === '') {
            return [];
        }

        $like = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
        $tail = strlen($normalizedPhone) >= 6 ? substr($normalizedPhone, -6) : $normalizedPhone;

        return AppraisalTicket::query()
            ->whereNotNull('customer_phone')
            ->where(function (Builder $q) use ($customer, $like, $tail) {
                $q->where('customer_phone', $customer->phone)
                    ->orWhere('customer_phone', $like, "%{$tail}%");
            })
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->filter(fn (AppraisalTicket $t) => preg_replace('/\D+/', '', (string) $t->customer_phone) === $normalizedPhone)
            ->take(10)
            ->values()
            ->map(fn (AppraisalTicket $t) => [
                'id' => $t->id,
                'code' => $t->code,
                'model' => $t->model,
                'storage' => $t->storage,
                'aiGrade' => $t->ai_grade,
                'finalPrice' => (float) $t->final_price,
                'status' => $t->status,
                'createdAt' => $t->created_at?->toIso8601String(),
            ])
            ->all();
    }
}
