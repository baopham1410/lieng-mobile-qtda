<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\WarrantyResource;
use App\Models\ImeiCode;
use App\Models\Warranty;
use App\Models\WarrantyRepair;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarrantyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Warranty::with([
            'customer', 'order', 'imeiCode.productVariant.product',
            'repairs.user',
        ])->orderByDesc('created_at');

        if ($search = $request->query('search')) {
            $query->whereHas('imeiCode', fn ($q) => $q->where('imei', 'ilike', "%{$search}%"))
                ->orWhereHas('customer', fn ($q) => $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%"));
        }

        $warranties = $query->paginate($request->integer('per_page', 50));

        $stats = [
            'active' => Warranty::where('status', 'active')->where('end_date', '>=', now())->count(),
            'expiringSoon' => Warranty::where('status', 'active')
                ->whereBetween('end_date', [now(), now()->addDays(30)])
                ->count(),
            'inRepair' => WarrantyRepair::where('repaired_at', '>=', now()->subDays(30))->distinct('warranty_id')->count('warranty_id'),
            'expired' => Warranty::where('end_date', '<', now())->count(),
        ];

        return response()->json([
            'data' => WarrantyResource::collection($warranties),
            'stats' => $stats,
            'meta' => [
                'current_page' => $warranties->currentPage(),
                'last_page' => $warranties->lastPage(),
                'per_page' => $warranties->perPage(),
                'total' => $warranties->total(),
            ],
        ]);
    }

    public function lookup(string $imei): JsonResponse
    {
        $record = ImeiCode::with([
            'productVariant.product',
            'warranty.customer',
            'warranty.order',
            'warranty.repairs.user',
        ])->where('imei', $imei)->first();

        if (! $record) {
            return response()->json(['message' => 'Không tìm thấy IMEI trong hệ thống.'], 404);
        }

        if ($record->warranty) {
            return response()->json([
                'data' => new WarrantyResource($record->warranty->load([
                    'customer', 'order', 'imeiCode.productVariant.product', 'repairs.user',
                ])),
            ]);
        }

        $variant = $record->productVariant;
        $product = $variant?->product;

        return response()->json([
            'data' => [
                'imei' => $record->imei,
                'status' => $record->status,
                'productName' => $product?->name,
                'variant' => trim(implode(' · ', array_filter([$variant?->color, $variant?->storage]))),
                'warranty' => null,
                'message' => $record->status === 'in_stock'
                    ? 'Máy đang tồn kho, chưa bán.'
                    : 'Chưa có phiếu bảo hành cho IMEI này.',
            ],
        ]);
    }

    public function storeRepair(Request $request, Warranty $warranty): JsonResponse
    {
        $validated = $request->validate([
            'description' => 'required|string',
            'cost' => 'nullable|numeric|min:0',
        ]);

        $repair = WarrantyRepair::create([
            'warranty_id' => $warranty->id,
            'description' => $validated['description'],
            'cost' => $validated['cost'] ?? 0,
            'repaired_at' => now(),
            'user_id' => $request->user()->id,
        ]);

        $warranty->imeiCode?->update(['status' => 'warranty']);

        return response()->json([
            'data' => new WarrantyResource($warranty->fresh([
                'customer', 'order', 'imeiCode.productVariant.product', 'repairs.user',
            ])),
            'message' => 'Ghi nhận sửa chữa thành công',
        ]);
    }

    public function storeRepairByImei(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'imei' => 'required|string',
            'description' => 'required|string',
            'cost' => 'nullable|numeric|min:0',
        ]);

        $imei = preg_replace('/\D/', '', $validated['imei']);
        $warranty = Warranty::whereHas('imeiCode', fn ($q) => $q->where('imei', $imei))->first();

        if (! $warranty) {
            return response()->json(['message' => 'Không tìm thấy phiếu bảo hành cho IMEI này.'], 404);
        }

        $request->merge(['description' => $validated['description'], 'cost' => $validated['cost'] ?? 0]);

        return $this->storeRepair($request, $warranty);
    }
}
