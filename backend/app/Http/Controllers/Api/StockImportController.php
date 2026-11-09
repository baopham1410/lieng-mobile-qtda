<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StockImportResource;
use App\Models\Category;
use App\Models\ExpenseCategory;
use App\Models\ImeiCode;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductVariant;
use App\Models\StockImport;
use App\Models\StockImportItem;
use App\Models\Transaction;
use App\Services\ActivityLogger;
use App\Services\ReportCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StockImportController extends Controller
{
    private const IMEI_CATEGORY_SLUGS = ['dien-thoai', 'tablet', 'laptop', 'phone', 'watch'];

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

    public function nextCode(): JsonResponse
    {
        return response()->json([
            'data' => [
                'code' => $this->allocateImportCode(),
            ],
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
        $validated = $this->validateImportPayload($request, creating: true);

        return DB::transaction(function () use ($validated, $request) {
            $code = $validated['code'] ?? null;
            if (! $code || StockImport::where('code', $code)->exists()) {
                $code = $this->allocateImportCode();
            }

            $import = StockImport::create([
                'code' => $code,
                'supplier_id' => $validated['supplierId'],
                'user_id' => $request->user()->id,
                'total_amount' => 0,
                'status' => 'draft',
                'notes' => $validated['notes'] ?? '',
            ]);

            $total = $this->syncImportItems($import, $validated['items']);
            $import->update(['total_amount' => $total]);
            $this->syncImeis($import->fresh('items'), $validated['imeis'] ?? []);

            ActivityLogger::record($request->user(), [
                'action' => 'create',
                'module' => 'stock_imports',
                'title' => 'Tạo phiếu nhập '.$import->code,
                'description' => 'Tổng '.ActivityLogger::formatMoney((float) $import->fresh()->total_amount),
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

        $validated = $this->validateImportPayload($request, creating: false);

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
                $import->total_amount = $this->syncImportItems($import, $validated['items']);
            }

            $import->save();

            if (array_key_exists('imeis', $validated)) {
                $import->items()->each(fn ($item) => $item->imeiCodes()->delete());
                $this->syncImeis($import->fresh('items.productVariant.product.category'), $validated['imeis'] ?? []);
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
        $import = StockImport::with(['items.productVariant.product.category', 'items.imeiCodes'])
            ->where('code', $code)->firstOrFail();

        if ($import->status === 'confirmed') {
            return response()->json(['message' => 'Phiếu đã được xác nhận trước đó.'], 422);
        }

        return DB::transaction(function () use ($import, $request) {
            foreach ($import->items as $item) {
                if ($this->itemRequiresImei($item) && $item->imeiCodes->count() < (int) $item->quantity) {
                    throw ValidationException::withMessages([
                        'imeis' => 'Phiếu '.$import->code.' chưa đủ IMEI cho dòng '.$item->productVariant?->product?->name.'.',
                    ]);
                }

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

    private function validateImportPayload(Request $request, bool $creating): array
    {
        $rules = [
            'supplierId' => ($creating ? 'required' : 'sometimes').'|exists:suppliers,id',
            'notes' => 'nullable|string',
            'items' => ($creating ? 'required' : 'sometimes').'|array|min:1',
            'items.*.productVariantId' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.unitPrice' => 'required_with:items|numeric|min:0',
            'items.*.warrantyMonths' => 'nullable|integer|min:0|max:120',
            'items.*.name' => 'nullable|string|max:255',
            'items.*.brand' => 'nullable|string|max:100',
            'items.*.category' => 'nullable|string|max:100',
            'items.*.categoryId' => 'nullable|integer|exists:categories,id',
            'items.*.color' => 'nullable|string|max:100',
            'items.*.storage' => 'nullable|string|max:120',
            'items.*.variant' => 'nullable|string|max:255',
            'items.*.isNew' => 'nullable|boolean',
            'imeis' => 'nullable|array',
            'imeis.*' => 'string|size:15',
        ];

        if ($creating) {
            // Mã có thể trùng từ màn hình create — server sẽ tự cấp mã mới nếu đã tồn tại.
            $rules['code'] = 'nullable|string|max:50';
        }

        $validated = $request->validate($rules);

        if (isset($validated['items'])) {
            foreach ($validated['items'] as $index => $item) {
                $hasVariant = ! empty($item['productVariantId']);
                $hasNew = ! empty($item['name']) && (! empty($item['category']) || ! empty($item['categoryId']));
                if (! $hasVariant && ! $hasNew) {
                    throw ValidationException::withMessages([
                        "items.$index" => 'Mỗi dòng hàng cần sản phẩm có sẵn hoặc thông tin sản phẩm mới (tên + danh mục).',
                    ]);
                }
            }
        }

        return $validated;
    }

    private function syncImportItems(StockImport $import, array $items): float
    {
        $total = 0.0;

        foreach ($items as $item) {
            $variantId = $this->resolveProductVariantId($item);
            $qty = (int) $item['quantity'];
            $unit = (float) $item['unitPrice'];
            $subtotal = $qty * $unit;
            $total += $subtotal;

            StockImportItem::create([
                'stock_import_id' => $import->id,
                'product_variant_id' => $variantId,
                'quantity' => $qty,
                'unit_cost' => $unit,
                'subtotal' => $subtotal,
            ]);
        }

        return round($total, 2);
    }

    private function resolveProductVariantId(array $item): int
    {
        if (! empty($item['productVariantId'])) {
            $variantId = (int) $item['productVariantId'];
            if (array_key_exists('warrantyMonths', $item) && $item['warrantyMonths'] !== null && $item['warrantyMonths'] !== '') {
                ProductVariant::whereKey($variantId)->update([
                    'warranty_months' => $this->normalizeWarrantyMonths($item['warrantyMonths']),
                ]);
            }

            return $variantId;
        }

        $category = $this->resolveCategory($item);
        if (! $category) {
            throw ValidationException::withMessages([
                'items' => 'Không tìm thấy danh mục cho sản phẩm mới.',
            ]);
        }

        $color = $item['color'] ?? null;
        $storage = $item['storage'] ?? null;
        if ((! $color || ! $storage) && ! empty($item['variant'])) {
            $parts = array_values(array_filter(array_map('trim', explode('·', $item['variant']))));
            $color = $color ?: ($parts[0] ?? null);
            $storage = $storage ?: ($parts[1] ?? ($parts[0] ?? null));
        }

        $product = Product::create([
            'name' => trim((string) $item['name']),
            'category_id' => $category->id,
            'brand' => isset($item['brand']) ? trim((string) $item['brand']) : null,
            'is_active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => $this->makeVariantSku($product, $color, $storage),
            'color' => $color ? trim((string) $color) : null,
            'storage' => $storage ? trim((string) $storage) : null,
            'condition' => 'new',
            'warranty_months' => $this->normalizeWarrantyMonths($item['warrantyMonths'] ?? 12),
        ]);

        $unit = (float) ($item['unitPrice'] ?? 0);
        if ($unit > 0) {
            ProductPrice::create([
                'product_variant_id' => $variant->id,
                'price_type' => 'import',
                'amount' => $unit,
                'effective_from' => now()->toDateString(),
            ]);
            ProductPrice::create([
                'product_variant_id' => $variant->id,
                'price_type' => 'retail',
                'amount' => $unit,
                'effective_from' => now()->toDateString(),
            ]);
        }

        return $variant->id;
    }

    private function resolveCategory(array $item): ?Category
    {
        if (! empty($item['categoryId'])) {
            return Category::find($item['categoryId']);
        }

        $raw = (string) ($item['category'] ?? '');
        if ($raw === '') {
            return null;
        }

        if (ctype_digit($raw)) {
            return Category::find((int) $raw);
        }

        return Category::where('slug', $raw)->orWhere('name', $raw)->first();
    }

    private function makeVariantSku(Product $product, ?string $color, ?string $storage): string
    {
        $slugify = static function (?string $value): string {
            $value = Str::ascii((string) $value);
            $value = strtoupper(preg_replace('/[^A-Za-z0-9]+/', '-', $value) ?? '');

            return trim($value, '-') ?: 'X';
        };

        $base = implode('-', array_filter([
            $slugify($product->brand ?: 'SP'),
            $slugify($product->name),
            $slugify($color),
            $slugify($storage),
        ]));

        $sku = Str::limit($base, 80, '');
        if (! ProductVariant::where('sku', $sku)->exists()) {
            return $sku;
        }

        return Str::limit($sku, 72, '').'-'.strtoupper(Str::random(4));
    }

    private function syncImeis(StockImport $import, array $imeis): void
    {
        $import->loadMissing(['items.productVariant.product.category']);
        $cursor = 0;

        foreach ($import->items as $item) {
            $qty = $this->itemRequiresImei($item) ? (int) $item->quantity : 0;
            if ($qty <= 0) {
                continue;
            }

            $slice = array_slice($imeis, $cursor, $qty);
            $cursor += $qty;

            foreach ($slice as $imei) {
                if (ImeiCode::where('imei', $imei)->exists()) {
                    continue;
                }

                ImeiCode::create([
                    'product_variant_id' => $item->product_variant_id,
                    'imei' => $imei,
                    'status' => 'defective',
                    'stock_import_item_id' => $item->id,
                    'import_cost' => $item->unit_cost,
                ]);
            }
        }
    }

    private function itemRequiresImei(StockImportItem $item): bool
    {
        $slug = $item->productVariant?->product?->category?->slug;
        if (! $slug) {
            return true;
        }

        return in_array($slug, self::IMEI_CATEGORY_SLUGS, true);
    }

    private function allocateImportCode(): string
    {
        $prefix = 'PN-'.now()->format('Ymd').'-';
        $latest = StockImport::query()
            ->where('code', 'like', $prefix.'%')
            ->orderByDesc('code')
            ->value('code');

        $next = 1;
        if ($latest && preg_match('/-(\d+)$/', $latest, $matches)) {
            $next = ((int) $matches[1]) + 1;
        }

        do {
            $code = $prefix.str_pad((string) $next, 3, '0', STR_PAD_LEFT);
            $next++;
        } while (StockImport::where('code', $code)->exists());

        return $code;
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

    private function normalizeWarrantyMonths(mixed $value): int
    {
        if ($value === null || $value === '') {
            return 12;
        }

        return max(0, min(120, (int) $value));
    }
}
