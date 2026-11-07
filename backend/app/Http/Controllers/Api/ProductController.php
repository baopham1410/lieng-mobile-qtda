<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductFormResource;
use App\Http\Resources\ProductListResource;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductVariant;
use App\Services\ActivityLogger;
use App\Services\ProductImageResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with([
            'category',
            'variants' => fn ($q) => $q
                ->with('prices')
                ->withCount([
                    'imeiCodes as in_stock_count' => fn ($q) => $q->where('status', 'in_stock'),
                ]),
        ])->orderByDesc('updated_at');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('model_code', 'ilike', "%{$search}%")
                    ->orWhere('brand', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('brand')) {
            $query->where('brand', $request->query('brand'));
        }

        $products = $query->paginate($request->integer('per_page', 50));

        $stats = [
            'totalProducts' => Product::count(),
            'totalVariants' => ProductVariant::count(),
            'lowStock' => ProductVariant::withCount([
                'imeiCodes as in_stock_count' => fn ($q) => $q->where('status', 'in_stock'),
            ])->get()->filter(fn ($v) => $v->in_stock_count > 0 && $v->in_stock_count <= 3)->count(),
            'draftProducts' => Product::where('is_active', false)->count(),
        ];

        $categories = Category::orderBy('name')->pluck('name');
        $brands = Product::whereNotNull('brand')->distinct()->orderBy('brand')->pluck('brand');

        return response()->json([
            'data' => ProductListResource::collection($products),
            'stats' => $stats,
            'filters' => [
                'categories' => $categories->prepend('Tất cả')->values(),
                'brands' => $brands->prepend('Tất cả')->values(),
            ],
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => Category::orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    public function importVariants(): JsonResponse
    {
        $variants = ProductVariant::query()
            ->with(['product.category', 'prices'])
            ->whereHas('product', fn ($q) => $q->where('is_active', true))
            ->orderByDesc('updated_at')
            ->get()
            ->map(function (ProductVariant $variant) {
                $product = $variant->product;
                $parts = array_filter([$variant->color, $variant->storage, $variant->ram]);

                return [
                    'productVariantId' => $variant->id,
                    'category' => $product?->category?->slug ?? 'phu-kien',
                    'name' => $product?->name ?? 'Sản phẩm',
                    'brand' => $product?->brand ?? '',
                    'variant' => $parts ? implode(' · ', $parts) : ($variant->sku ?? '—'),
                    'unitPrice' => (float) ($variant->currentPrice('import') ?? 0),
                ];
            })
            ->values();

        return response()->json(['data' => $variants]);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load(['category', 'variants.prices']);

        return response()->json(['data' => new ProductFormResource($product)]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateProductPayload($request);

        $product = DB::transaction(function () use ($validated) {
            $product = Product::create([
                'name' => $validated['name'],
                'category_id' => $validated['category_id'],
                'brand' => $validated['brand'] ?? null,
                'model_code' => $validated['model_code'] ?? null,
                'description' => $validated['description'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'sku' => $validated['variant']['sku'] ?? null,
                'color' => $validated['variant']['color'] ?? null,
                'storage' => $validated['variant']['storage'] ?? null,
                'ram' => $validated['variant']['ram'] ?? null,
                'condition' => $validated['variant']['condition'] ?? 'new',
            ]);

            $this->syncVariantPrices($variant, $validated['prices'] ?? []);

            return $product->fresh(['category', 'variants.prices']);
        });

        ActivityLogger::record($request->user(), [
            'action' => 'create',
            'module' => 'products',
            'title' => 'Thêm sản phẩm: '.$product->name,
            'description' => $this->describePrices($validated['prices'] ?? []) ?: 'Tạo dòng sản phẩm mới',
            'link' => '/products/'.$product->id.'/edit',
            'metadata' => ['product_id' => $product->id],
        ]);

        return response()->json([
            'data' => new ProductFormResource($product),
            'message' => 'Tạo sản phẩm thành công',
        ], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $this->validateProductPayload($request, updating: true);

        $product = DB::transaction(function () use ($product, $validated) {
            $product->update([
                'name' => $validated['name'],
                'category_id' => $validated['category_id'],
                'brand' => $validated['brand'] ?? null,
                'model_code' => $validated['model_code'] ?? null,
                'description' => $validated['description'] ?? null,
                'is_active' => $validated['is_active'] ?? $product->is_active,
            ]);

            $variant = $product->variants()->first();
            if (! $variant) {
                $variant = ProductVariant::create(['product_id' => $product->id]);
            }

            $variant->update([
                'sku' => $validated['variant']['sku'] ?? null,
                'color' => $validated['variant']['color'] ?? null,
                'storage' => $validated['variant']['storage'] ?? null,
                'ram' => $validated['variant']['ram'] ?? null,
                'condition' => $validated['variant']['condition'] ?? 'new',
            ]);

            $this->syncVariantPrices($variant, $validated['prices'] ?? []);

            return $product->fresh(['category', 'variants.prices']);
        });

        $priceDesc = $this->describePrices($validated['prices'] ?? []);
        ActivityLogger::record($request->user(), [
            'action' => 'update',
            'module' => 'products',
            'title' => 'Cập nhật sản phẩm: '.$product->name,
            'description' => $priceDesc ?: 'Sửa thông tin sản phẩm',
            'link' => '/products/'.$product->id.'/edit',
            'metadata' => ['product_id' => $product->id, 'prices' => $validated['prices'] ?? null],
        ]);

        return response()->json([
            'data' => new ProductFormResource($product),
            'message' => 'Cập nhật sản phẩm thành công',
        ]);
    }

    public function uploadImage(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:4096',
        ]);

        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }

        $path = $request->file('image')->store('products/'.$product->id, 'public');
        $product->update(['image_path' => $path]);

        $product->load(['category', 'variants.prices']);
        $resolver = app(ProductImageResolver::class);

        ActivityLogger::record($request->user(), [
            'action' => 'update',
            'module' => 'products',
            'title' => 'Cập nhật ảnh: '.$product->name,
            'description' => 'Tải ảnh sản phẩm mới',
            'link' => '/products?edit='.$product->id,
            'metadata' => ['product_id' => $product->id],
        ]);

        return response()->json([
            'data' => [
                'image' => $resolver->resolveProduct($product),
                'hasCustomImage' => true,
            ],
            'message' => 'Đã cập nhật ảnh sản phẩm',
        ]);
    }

    public function removeImage(Request $request, Product $product): JsonResponse
    {
        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
            $product->update(['image_path' => null]);
        }

        $product->load(['category', 'variants.prices']);
        $resolver = app(ProductImageResolver::class);

        return response()->json([
            'data' => [
                'image' => $resolver->resolveProduct($product),
                'hasCustomImage' => false,
            ],
            'message' => 'Đã xóa ảnh tùy chỉnh',
        ]);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $name = $product->name;
        $id = $product->id;
        $product->delete();

        ActivityLogger::record($request->user(), [
            'action' => 'delete',
            'module' => 'products',
            'title' => 'Xóa sản phẩm: '.$name,
            'description' => 'Đã xóa khỏi danh sách',
            'link' => '/products',
            'metadata' => ['product_id' => $id],
        ]);

        return response()->json(['message' => 'Đã xóa sản phẩm']);
    }

    private function describePrices(array $prices): string
    {
        $labels = ['retail' => 'Bán lẻ', 'import' => 'Giá nhập', 'wholesale' => 'Bán sỉ'];
        $parts = [];

        foreach ($labels as $key => $label) {
            if (! array_key_exists($key, $prices) || $prices[$key] === null || $prices[$key] === '') {
                continue;
            }
            $parts[] = $label.': '.ActivityLogger::formatMoney((float) $prices[$key]);
        }

        return implode(' · ', $parts);
    }

    private function validateProductPayload(Request $request, bool $updating = false): array
    {
        $rules = [
            'name' => ($updating ? 'sometimes|' : '').'required|string|max:255',
            'category_id' => ($updating ? 'sometimes|' : '').'required|exists:categories,id',
            'brand' => 'nullable|string|max:100',
            'model_code' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'variant.sku' => 'nullable|string|max:100',
            'variant.color' => 'nullable|string|max:100',
            'variant.storage' => 'nullable|string|max:50',
            'variant.ram' => 'nullable|string|max:50',
            'variant.condition' => 'nullable|in:new,likenew_99,used',
            'prices.import' => 'nullable|numeric|min:0',
            'prices.retail' => 'nullable|numeric|min:0',
            'prices.wholesale' => 'nullable|numeric|min:0',
        ];

        return $request->validate($rules);
    }

    private function syncVariantPrices(ProductVariant $variant, array $prices): void
    {
        $today = now()->toDateString();

        foreach (['import', 'retail', 'wholesale'] as $type) {
            if (! array_key_exists($type, $prices) || $prices[$type] === null || $prices[$type] === '') {
                continue;
            }

            $amount = (float) $prices[$type];
            $existing = $variant->prices()
                ->where('price_type', $type)
                ->where('effective_from', '<=', $today)
                ->where(function ($q) use ($today) {
                    $q->whereNull('effective_to')->orWhere('effective_to', '>=', $today);
                })
                ->orderByDesc('effective_from')
                ->orderByDesc('id')
                ->first();

            if ($existing && (float) $existing->amount === $amount) {
                continue;
            }

            // Same calendar day: update in place to avoid duplicate effective_from rows.
            if ($existing && $existing->effective_from?->toDateString() === $today) {
                $existing->update(['amount' => $amount, 'effective_to' => null]);
                continue;
            }

            if ($existing) {
                $existing->update(['effective_to' => now()->subDay()->toDateString()]);
            }

            ProductPrice::create([
                'product_variant_id' => $variant->id,
                'price_type' => $type,
                'amount' => $amount,
                'effective_from' => $today,
            ]);
        }
    }
}
