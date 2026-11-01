<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\ImeiCode;
use App\Models\Product;
use App\Services\ProductImageResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function catalog(Request $request): JsonResponse
    {
        $categoryMap = [
            'dien-thoai' => 'phone',
            'tablet' => 'tablet',
            'laptop' => 'laptop',
            'phu-kien' => 'accessory',
        ];

        $products = Product::with([
            'category',
            'variants.prices',
            'variants' => fn ($q) => $q->withCount([
                'imeiCodes as in_stock_count' => fn ($q) => $q->where('status', 'in_stock'),
            ]),
        ])
            ->where('is_active', true)
            ->orderByDesc('updated_at')
            ->get();

        $catalog = $products->map(function ($product) use ($categoryMap) {
            $variant = $product->variants->first();
            $retail = $variant?->currentPrice('retail') ?? 0;
            $import = $variant?->currentPrice('import') ?? 0;
            $stock = $product->variants->sum('in_stock_count');
            $slug = $product->category?->slug ?? 'dien-thoai';
            $resolver = app(ProductImageResolver::class);

            return [
                'id' => 'p-'.$product->id,
                'productId' => $product->id,
                'variantId' => $variant?->id,
                'name' => $product->name,
                'brand' => $product->brand ?? '',
                'category' => $categoryMap[$slug] ?? 'phone',
                'image' => $resolver->resolveProduct($product),
                'price' => (float) $retail,
                'oldPrice' => $import > 0 && $retail > $import ? (float) round($retail * 1.08) : null,
                'badge' => $stock <= 2 && $stock > 0 ? 'Sắp hết' : ($stock === 0 ? 'Hết hàng' : null),
                'specs' => array_values(array_filter([
                    $variant?->storage,
                    $variant?->color,
                    'Chính hãng VN/A',
                ])),
                'rating' => 4.8,
                'sold' => max(0, 50 - $stock),
                'inStock' => $stock > 0,
                'warrantyMonths' => 12,
                'description' => $product->description ?? ($product->name.' chính hãng, bảo hành 12 tháng tại '.$product->brand.'.'),
                'colors' => $product->variants->pluck('color')->filter()->unique()->values()->all(),
            ];
        });

        $brands = $products->pluck('brand')->filter()->unique()->sort()->values();
        $categories = Category::orderBy('name')->get()->map(fn ($c) => [
            'id' => $categoryMap[$c->slug] ?? $c->slug,
            'label' => $c->name,
            'icon' => $c->icon ?: '🛍️',
        ]);

        return response()->json([
            'data' => [
                'products' => $catalog,
                'brands' => $brands->prepend('Tất cả')->values(),
                'categories' => collect([
                    ['id' => 'all', 'label' => 'Tất cả', 'icon' => '🛍️'],
                ])->merge($categories)->values(),
            ],
        ]);
    }

    public function inquiry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'items' => 'required|array|min:1',
            'items.*.productId' => 'required|integer',
            'items.*.qty' => 'required|integer|min:1',
            'note' => 'nullable|string|max:500',
        ]);

        return response()->json([
            'message' => 'Đã ghi nhận yêu cầu tư vấn. Nhân viên sẽ liên hệ trong ít phút.',
            'data' => [
                'reference' => 'INQ-'.now()->format('YmdHis'),
                'customer' => $validated['name'],
                'phone' => $validated['phone'],
                'itemCount' => collect($validated['items'])->sum('qty'),
            ],
        ], 201);
    }
}
