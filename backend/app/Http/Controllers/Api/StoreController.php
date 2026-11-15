<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AppraisalTicket;
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

        $isTradeIn = str_contains(mb_strtolower($topic), 'thu cũ') || str_contains(mb_strtolower($topic), 'trade');
        $appraisalTicket = null;

        if ($isTradeIn) {
            $todayPrefixTD = 'TD-'.now()->format('ymd').'-';
            $latestTicket = AppraisalTicket::where('code', 'like', $todayPrefixTD.'%')->orderByDesc('id')->first();
            $tSeq = 1;
            if ($latestTicket && preg_match('/-(\d+)$/', $latestTicket->code, $m)) {
                $tSeq = ((int) $m[1]) + 1;
            }
            $ticketCode = $todayPrefixTD.str_pad((string) $tSeq, 3, '0', STR_PAD_LEFT);
            while (AppraisalTicket::where('code', $ticketCode)->exists()) {
                $tSeq++;
                $ticketCode = $todayPrefixTD.str_pad((string) $tSeq, 3, '0', STR_PAD_LEFT);
            }

            $brand = $request->input('brand');
            $model = $request->input('model');
            $storage = $request->input('storage');
            $suggestedPrice = (float) $request->input('suggested_price', 0);
            $branchName = $request->input('branch_name', 'Chi nhánh chính');
            $timeSlot = $request->input('time_slot', 'Trong ngày');

            if (! $brand || ! $model) {
                $rawProduct = $productName ?: '';
                if (preg_match('/iPhone|Apple|iPad/i', $rawProduct)) {
                    $brand = 'Apple';
                } elseif (preg_match('/Samsung|Galaxy/i', $rawProduct)) {
                    $brand = 'Samsung';
                } elseif (preg_match('/Xiaomi|Redmi/i', $rawProduct)) {
                    $brand = 'Xiaomi';
                } elseif (preg_match('/Oppo/i', $rawProduct)) {
                    $brand = 'OPPO';
                } else {
                    $brand = 'Khác';
                }

                $clean = preg_replace('/\[.*?\]/', '', $rawProduct);
                if (preg_match('/(\d+\s*(?:GB|TB))/i', $clean, $sm)) {
                    $storage = strtoupper(str_replace(' ', '', $sm[1]));
                    $clean = str_ireplace($sm[0], '', $clean);
                } else {
                    $storage = '256GB';
                }
                $model = trim($clean) ?: 'Điện thoại cũ';
            }

            $noteStr = $validated['note'] ?? '';
            $accessoriesNote = "[Lịch hẹn Mobile App] {$branchName} · {$timeSlot}";
            if (! empty($noteStr)) {
                $accessoriesNote .= " · {$noteStr}";
            }

            $defaultHardware = [
                'touch' => 'pass', 'audio' => 'pass', 'vibrate' => 'pass', 'faceId' => 'pass',
                'icloudClean' => true, 'powerOn' => true, 'wifi' => 'pass', 'bluetooth' => 'pass',
                'backCamera' => 'pass', 'frontCamera' => 'pass', 'volumeDown' => 'pass',
                'volumeUp' => 'pass', 'earpiece' => 'pass', 'speaker' => 'pass', 'callMic' => 'pass',
                'videoMic' => 'pass', 'simSignal' => 'pass', 'screenDisplay' => 'good',
                'screenAuthenticity' => 'original', 'glassCondition' => 'good', 'powerButton' => 'good',
                'trueTone' => 'yes', 'charging' => 'good',
            ];

            $appraisalTicket = AppraisalTicket::create([
                'code' => $ticketCode,
                'ticket_qr' => 'AG-'.$ticketCode,
                'customer_name' => $validated['name'],
                'customer_phone' => $validated['phone'],
                'brand' => $brand,
                'model' => $model,
                'storage' => $storage ?: '256GB',
                'suggested_price' => $suggestedPrice,
                'final_price' => $suggestedPrice,
                'accessories_note' => $accessoriesNote,
                'hardware_checks' => $defaultHardware,
                'status' => 'draft',
                'ai_ran' => false,
                'ai_mode' => 'pending',
            ]);
        }

        try {
            $admin = User::first();
            if ($admin) {
                if ($isTradeIn) {
                    ActivityLog::create([
                        'user_id' => $admin->id,
                        'action' => 'trade_in_appointment',
                        'module' => 'appraisal',
                        'title' => 'Lịch hẹn thu cũ: '.$validated['name'],
                        'description' => ($productName ? "Mẫu: {$productName} · " : '')."SĐT: {$validated['phone']}".(! empty($validated['note']) ? " · {$validated['note']}" : ''),
                        'link' => '/appraisal',
                    ]);
                } else {
                    ActivityLog::create([
                        'user_id' => $admin->id,
                        'action' => 'customer_inquiry',
                        'module' => 'consult',
                        'title' => 'Khách hàng đặt giữ máy: '.$validated['name'],
                        'description' => ($productName ? "Mẫu: {$productName} · " : '')."SĐT: {$validated['phone']}".(! empty($validated['note']) ? " · Ghi chú: {$validated['note']}" : ''),
                        'link' => '/consult',
                    ]);
                }
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'message' => $isTradeIn
                ? 'Đã đặt lịch hẹn thu cũ thành công. Showroom đã sẵn sàng đón tiếp quý khách.'
                : 'Đã ghi nhận yêu cầu tư vấn & giữ máy. Nhân viên sẽ liên hệ trong ít phút.',
            'data' => [
                'id' => $inquiry->id,
                'reference' => $inquiry->code,
                'appraisalCode' => $appraisalTicket?->code,
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
