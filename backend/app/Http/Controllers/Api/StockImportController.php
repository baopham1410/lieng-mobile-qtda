<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StockImportResource;
use App\Models\ExpenseCategory;
use App\Models\ImeiCode;
use App\Models\StockImport;
use App\Models\StockImportItem;
use App\Models\Transaction;
use App\Services\ActivityLogger;
use App\Services\ReportCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StockImportController extends Controller
{
    public function index(): JsonResponse
    {
        $imports = StockImport::with([
            'supplier',
            'items.productVariant.product',
            'items.imeiCodes',
        ])->orderByDesc('created_at')->get();

        $resolved = StockImportResource::collection($imports)->resolve();

        return response()->json([
            'data' => $resolved,
            'stats' => $this->statsFromRows(collect($resolved)),
        ]);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'data' => $this->statsFromRows($this->loadImportRows()),
        ]);
    }

    public function show(string $code): JsonResponse
    {
        $import = StockImport::with([
            'supplier',
            'items.productVariant.product',
            'items.imeiCodes',
        ])->where('code', $code)->firstOrFail();

        return response()->json(['data' => new StockImportResource($import)]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:stock_imports,code',
            'supplierId' => 'required|exists:suppliers,id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.productVariantId' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unitPrice' => 'required|numeric|min:0',
            'imeis' => 'nullable|array',
            'imeis.*' => 'string|size:15',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $total = collect($validated['items'])->sum(fn ($i) => $i['quantity'] * $i['unitPrice']);

            $import = StockImport::create([
                'code' => $validated['code'],
                'supplier_id' => $validated['supplierId'],
                'user_id' => $request->user()->id,
                'total_amount' => $total,
                'status' => 'draft',
                'notes' => $validated['notes'] ?? '',
            ]);

            foreach ($validated['items'] as $item) {
                StockImportItem::create([
                    'stock_import_id' => $import->id,
                    'product_variant_id' => $item['productVariantId'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unitPrice'],
                    'subtotal' => $item['quantity'] * $item['unitPrice'],
                ]);
            }

            $this->syncImeis($import, $validated['imeis'] ?? []);

            ActivityLogger::record($request->user(), [
                'action' => 'create',
                'module' => 'stock_imports',
                'title' => 'Tạo phiếu nhập '.$import->code,
                'description' => 'Tổng '.ActivityLogger::formatMoney((float) $import->total_amount),
                'link' => '/inventory/imports/'.$import->code,
                'metadata' => ['import_code' => $import->code],
            ]);

            return response()->json([
                'data' => new StockImportResource($import->fresh([
                    'supplier', 'items.productVariant.product', 'items.imeiCodes',
                ])),
                'message' => 'Tạo phiếu nhập thành công',
            ], 201);
        });
    }

    public function update(Request $request, string $code): JsonResponse
    {
        $import = StockImport::where('code', $code)->firstOrFail();

        if ($import->status === 'confirmed') {
            return response()->json(['message' => 'Phiếu đã xác nhận, không thể sửa.'], 422);
        }

        $validated = $request->validate([
            'supplierId' => 'sometimes|exists:suppliers,id',
            'notes' => 'nullable|string',
            'items' => 'sometimes|array|min:1',
            'items.*.productVariantId' => 'required_with:items|exists:product_variants,id',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.unitPrice' => 'required_with:items|numeric|min:0',
            'imeis' => 'nullable|array',
            'imeis.*' => 'string|size:15',
        ]);

        return DB::transaction(function () use ($import, $validated, $request) {
            if (isset($validated['supplierId'])) {
                $import->supplier_id = $validated['supplierId'];
            }
            if (array_key_exists('notes', $validated)) {
                $import->notes = $validated['notes'];
            }

            if (isset($validated['items'])) {
                $import->items()->each(fn ($item) => $item->imeiCodes()->delete());
                $import->items()->delete();

                $total = 0;
                foreach ($validated['items'] as $item) {
                    $subtotal = $item['quantity'] * $item['unitPrice'];
                    $total += $subtotal;
                    StockImportItem::create([
                        'stock_import_id' => $import->id,
                        'product_variant_id' => $item['productVariantId'],
                        'quantity' => $item['quantity'],
                        'unit_cost' => $item['unitPrice'],
                        'subtotal' => $subtotal,
                    ]);
                }
                $import->total_amount = $total;
            }

            $import->save();

            if (array_key_exists('imeis', $validated)) {
                $import->items()->each(fn ($item) => $item->imeiCodes()->delete());
                $this->syncImeis($import, $validated['imeis'] ?? []);
            }

            ActivityLogger::record($request->user(), [
                'action' => 'update',
                'module' => 'stock_imports',
                'title' => 'Sửa phiếu nhập '.$import->code,
                'description' => 'Cập nhật nội dung / IMEI',
                'link' => '/inventory/imports/'.$import->code,
            ]);

            return response()->json([
                'data' => new StockImportResource($import->fresh([
                    'supplier', 'items.productVariant.product', 'items.imeiCodes',
                ])),
                'message' => 'Cập nhật phiếu nhập thành công',
            ]);
        });
    }

    public function confirm(Request $request, string $code): JsonResponse
    {
        $import = StockImport::with(['items.productVariant', 'items.imeiCodes'])
            ->where('code', $code)->firstOrFail();

        if ($import->status === 'confirmed') {
            return response()->json(['message' => 'Phiếu đã được xác nhận trước đó.'], 422);
        }

        return DB::transaction(function () use ($import, $request) {
            foreach ($import->items as $item) {
                foreach ($item->imeiCodes as $imei) {
                    $imei->update(['status' => 'in_stock', 'import_cost' => $item->unit_cost]);
                }
            }

            $import->update([
                'status' => 'confirmed',
                'imported_at' => now(),
            ]);

            $importCategory = ExpenseCategory::where('type', 'import')->first();

            Transaction::create([
                'code' => 'TC-'.now()->format('Ymd').'-'.strtoupper(Str::random(4)),
                'type' => 'expense',
                'amount' => $import->total_amount,
                'payment_method' => 'transfer',
                'category_id' => $importCategory?->id,
                'reference_type' => 'StockImport',
                'reference_id' => $import->id,
                'user_id' => $request->user()->id,
                'description' => 'Nhập kho '.$import->code,
                'transacted_at' => now(),
            ]);

            ActivityLogger::record($request->user(), [
                'action' => 'confirm',
                'module' => 'stock_imports',
                'title' => 'Xác nhận nhập kho '.$import->code,
                'description' => 'Nhập '.ActivityLogger::formatMoney((float) $import->total_amount).' vào kho',
                'link' => '/inventory/imports/'.$import->code,
            ]);

            ReportCacheService::bustAll();

            return response()->json([
                'data' => new StockImportResource($import->fresh([
                    'supplier', 'items.productVariant.product', 'items.imeiCodes',
                ])),
                'message' => 'Xác nhận nhập kho thành công',
            ]);
        });
    }

    private function syncImeis(StockImport $import, array $imeis): void
    {
        $import->load('items');
        $firstItem = $import->items->first();
        if (! $firstItem) {
            return;
        }

        foreach ($imeis as $imei) {
            if (ImeiCode::where('imei', $imei)->exists()) {
                continue;
            }
            ImeiCode::create([
                'product_variant_id' => $firstItem->product_variant_id,
                'imei' => $imei,
                'status' => 'defective',
                'stock_import_item_id' => $firstItem->id,
                'import_cost' => $firstItem->unit_cost,
            ]);
        }
    }

    private function loadImportRows()
    {
        return StockImport::with(['items.imeiCodes', 'supplier'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($i) => (new StockImportResource($i))->resolve());
    }

    private function statsFromRows($imports)
    {
        return [
            'draftImports' => $imports->where('status', 'draft')->count(),
            'waitingConfirm' => $imports->where('status', 'draft')
                ->filter(fn ($e) => $e['importedQuantity'] >= $e['totalQuantity'] && $e['totalQuantity'] > 0)->count(),
            'imeiPending' => $imports->where('status', 'draft')
                ->sum(fn ($e) => max(0, $e['totalQuantity'] - $e['importedQuantity'])),
            'totalAmountToday' => $imports
                ->where('status', 'confirmed')
                ->filter(fn ($e) => $this->isImportConfirmedToday($e))
                ->sum('totalAmount'),
        ];
    }

    private function isImportConfirmedToday(array $entry): bool
    {
        $iso = $entry['confirmedAt'] ?? null;
        if (! $iso) {
            return false;
        }

        return str_starts_with($iso, now()->format('Y-m-d'));
    }
}
