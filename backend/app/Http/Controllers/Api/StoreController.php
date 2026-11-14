<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\CustomerInquiry;
use App\Models\ImeiCode;
use App\Models\Product;
use App\Models\User;
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

        // Chỉ lấy các sản phẩm công nghệ / di động (Điện thoại, Tablet, Laptop, Phụ kiện)
        $products = Product::with([
            'category',
            'variants.prices',
            'variants' => fn ($q) => $q->withCount([
                'imeiCodes as in_stock_count' => fn ($q) => $q->where('status', 'in_stock'),
            ]),
        ])
            ->where('is_active', true)
            ->whereHas('category', function ($q) {
                $q->whereIn('slug', ['dien-thoai', 'tablet', 'laptop', 'phu-kien']);
            })
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
            'phone' => 'required|string|max:30',
            'items' => 'nullable|array',
            'items.*.productId' => 'nullable|integer',
            'items.*.qty' => 'nullable|integer|min:1',
            'product_name' => 'nullable|string|max:255',
            'topic' => 'nullable|string|max:100',
            'note' => 'nullable|string|max:1000',
        ]);

        $productId = $validated['items'][0]['productId'] ?? null;
        $productName = $request->input('product_name');
        if ($productId && ! $productName) {
            $productName = Product::find($productId)?->name;
        }

        $todayPrefix = 'TV-'.now()->format('ymd').'-';
        $lastInquiry = CustomerInquiry::where('code', 'like', $todayPrefix.'%')->orderByDesc('id')->first();
        $seq = 1;
        if ($lastInquiry && preg_match('/-(\d+)$/', $lastInquiry->code, $m)) {
            $seq = ((int) $m[1]) + 1;
        }
        $code = $todayPrefix.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);

        $topic = $request->input('topic', 'Giữ máy tại quầy');
        $inquiry = CustomerInquiry::create([
            'code' => $code,
            'customer_name' => $validated['name'],
            'customer_phone' => $validated['phone'],
            'product_id' => $productId,
            'product_name' => $productName ?: 'Sản phẩm tại quầy',
            'topic' => $topic,
            'notes' => $validated['note'] ?? null,
            'status' => 'ringing',
        ]);

        try {
            $admin = User::first();
            if ($admin) {
                ActivityLog::create([
                    'user_id' => $admin->id,
                    'action' => 'customer_inquiry',
                    'module' => 'consult',
                    'title' => 'Khách hàng đặt giữ máy: '.$validated['name'],
                    'description' => ($productName ? "Mẫu: {$productName} · " : '')."SĐT: {$validated['phone']}".(! empty($validated['note']) ? " · Ghi chú: {$validated['note']}" : ''),
                    'link' => '/consult',
                ]);
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'message' => 'Đã ghi nhận yêu cầu tư vấn & giữ máy. Nhân viên sẽ liên hệ trong ít phút.',
            'data' => [
                'id' => $inquiry->id,
                'reference' => $inquiry->code,
                'customer' => $inquiry->customer_name,
                'phone' => $inquiry->customer_phone,
                'productName' => $inquiry->product_name,
                'topic' => $inquiry->topic,
                'status' => $inquiry->status,
                'itemCount' => collect($validated['items'] ?? [])->sum('qty') ?: 1,
            ],
        ], 201);
    }
}
