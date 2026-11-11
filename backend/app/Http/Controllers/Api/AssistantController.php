<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class AssistantController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $message = $validated['message'];

        // Fast-path: tồn kho — không chờ Ollama (số liệu từ DB)
        if ($this->isStockIntent($message)) {
            return response()->json([
                'data' => $this->buildStockReply($message),
            ]);
        }

        return $this->proxyQuery('kb_admin', $message);
    }

    public function publicChat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $message = $validated['message'];

        if ($this->isPublicContactIntent($message)) {
            return response()->json([
                'data' => $this->buildPublicContactReply($message),
            ]);
        }

        return $this->proxyQuery('kb_public', $message);
    }

    public function health(): JsonResponse
    {
        $base = config('assistant.base_url');
        $timeout = config('assistant.timeout');

        try {
            $response = Http::timeout(min(10, $timeout))->get("{$base}/health");
            if (! $response->successful()) {
                return response()->json([
                    'ok' => false,
                    'assistant_service' => false,
                    'message' => 'assistant-service trả lỗi HTTP '.$response->status(),
                ], 503);
            }

            return response()->json([
                'ok' => true,
                'assistant_service' => $response->json(),
            ]);
        } catch (ConnectionException $e) {
            return response()->json([
                'ok' => false,
                'assistant_service' => false,
                'message' => 'Không kết nối được assistant-service tại '.$base.'. Hãy chạy uvicorn :8090 và Ollama.',
            ], 503);
        }
    }

    private function proxyQuery(string $collection, string $message): JsonResponse
    {
        $base = config('assistant.base_url');
        $timeout = config('assistant.timeout');

        try {
            $response = Http::timeout($timeout)
                ->acceptJson()
                ->post("{$base}/query", [
                    'collection' => $collection,
                    'question' => $message,
                    'top_k' => 3,
                ]);
        } catch (ConnectionException $e) {
            return response()->json([
                'message' => 'Trợ lý AI chưa sẵn sàng. Bật Ollama + assistant-service (port 8090).',
            ], 503);
        }

        if (! $response->successful()) {
            $detail = $response->json('detail') ?? $response->body();

            return response()->json([
                'message' => is_string($detail) ? $detail : 'assistant-service lỗi khi trả lời.',
            ], $response->status() >= 400 && $response->status() < 600 ? $response->status() : 502);
        }

        $data = $response->json();

        return response()->json([
            'data' => [
                'answer' => (string) ($data['answer'] ?? ''),
                'intent' => $data['intent'] ?? null,
                'blocks' => $data['blocks'] ?? [],
                'sources' => $data['sources'] ?? [],
                'collection' => $data['collection'] ?? $collection,
                'model' => $data['model'] ?? null,
                'fast_path' => false,
            ],
        ]);
    }

    private function isStockIntent(string $message): bool
    {
        return (bool) preg_match(
            '/hết hàng|het hang|hết máy|het may|tồn\s*=\s*0|ton\s*=\s*0|out\s*of\s*stock|không còn|khong con|tồn kho|ton kho|sắp hết|sap het|tồn thấp|ton thap|low\s*stock/iu',
            $message
        );
    }

    private function isPublicContactIntent(string $message): bool
    {
        return (bool) preg_match(
            '/hotline|gọi|goi|sđt|sdt|zalo|liên hệ|lien he|địa chỉ|dia chi|ở đâu|o dau|giờ mở|gio mo|mở cửa|mo cua|giờ làm|gio lam/iu',
            $message
        );
    }

    private function buildStockReply(string $message): array
    {
        $wantLow = (bool) preg_match('/sắp hết|sap het|tồn thấp|ton thap|low\s*stock|dưới\s*[1-5]|duoi\s*[1-5]/iu', $message);
        $rows = $wantLow ? $this->fetchLowStockRows() : $this->fetchOutOfStockRows();

        if ($wantLow && $rows === []) {
            $rows = $this->fetchOutOfStockRows();
            $wantLow = false;
        }

        $label = $wantLow ? 'tồn thấp (1–3 máy)' : 'hết hàng (tồn = 0)';
        $count = count($rows);

        $answer = $count === 0
            ? 'Hiện không có biến thể nào trong nhóm '.$label.' (hoặc chưa có dữ liệu IMEI).'
            : "Có {$count} biến thể {$label}. Chi tiết trong bảng — mở Sản phẩm / Nhập kho để xử lý.";

        $blocks = [];
        if ($count > 0) {
            $blocks[] = [
                'type' => 'table',
                'columns' => ['Sản phẩm', 'Biến thể', 'Tồn'],
                'rows' => array_map(
                    fn ($r) => [$r['name'], $r['variant'], (string) $r['stock']],
                    $rows
                ),
            ];
        }

        $blocks[] = [
            'type' => 'actions',
            'items' => [
                ['label' => 'Mở Sản phẩm', 'to' => '/products'],
                ['label' => 'Tạo nhập kho', 'to' => '/inventory/imports'],
            ],
        ];
        $blocks[] = [
            'type' => 'chips',
            'items' => $wantLow
                ? ['SP nào hết hàng?', 'Cách nhập IMEI?', 'Mở POS?']
                : ['Tồn dưới 5 máy?', 'Cách nhập IMEI?', 'Mở POS?'],
        ];

        return [
            'answer' => $answer,
            'intent' => 'stock',
            'blocks' => $blocks,
            'sources' => [['source' => 'tool:inventory', 'id' => $wantLow ? 'low_stock' : 'out_of_stock']],
            'collection' => 'kb_admin',
            'model' => null,
            'fast_path' => true,
        ];
    }

    private function buildPublicContactReply(string $message): array
    {
        $isHours = (bool) preg_match('/giờ|mở cửa|làm việc/iu', $message);

        $answer = $isHours
            ? "Lieng Mobile mở cửa **8:00 – 21:00** (T2–CN).\nHotline: **0383 435 600** — gọi hoặc Zalo để được tư vấn nhanh."
            : "Liên hệ Lieng Mobile:\n• Hotline: **0383 435 600**\n• Zalo: **0901 234 567**\n• Giờ: 8:00 – 21:00 hàng ngày\nGọi ngay hoặc nhắn Zalo — NV sẽ hỗ trợ giữ máy / thu cũ.";

        return [
            'answer' => $answer,
            'intent' => $isHours ? 'hours' : 'contact',
            'blocks' => [
                [
                    'type' => 'contact',
                    'hotline' => '0383435600',
                    'hotline_display' => '0383 435 600',
                    'zalo' => '0901 234 567',
                ],
                [
                    'type' => 'actions',
                    'items' => [
                        ['label' => 'Gọi ngay', 'href' => 'tel:0383435600'],
                        ['label' => 'Zalo', 'href' => 'https://zalo.me/0901234567'],
                    ],
                ],
                [
                    'type' => 'chips',
                    'items' => ['Có thu cũ không?', 'Bảo hành thế nào?', 'Giờ mở cửa?'],
                ],
            ],
            'sources' => [['source' => 'tool:contact', 'id' => 'store']],
            'collection' => 'kb_public',
            'model' => null,
            'fast_path' => true,
        ];
    }

    /**
     * @return list<array{name: string, variant: string, stock: int}>
     */
    private function fetchOutOfStockRows(): array
    {
        try {
            $stockCounts = DB::table('imei_codes')
                ->selectRaw('product_variant_id, COUNT(*) as in_stock_count')
                ->where('status', 'in_stock')
                ->groupBy('product_variant_id');

            return ProductVariant::query()
                ->leftJoinSub($stockCounts, 'stock_counts', fn ($join) => $join->on('stock_counts.product_variant_id', '=', 'product_variants.id'))
                ->join('products', 'products.id', '=', 'product_variants.product_id')
                ->where('products.is_active', true)
                ->where(function ($q) {
                    $q->whereNull('stock_counts.in_stock_count')
                        ->orWhere('stock_counts.in_stock_count', 0);
                })
                ->orderBy('products.name')
                ->limit(15)
                ->get([
                    'products.name as product_name',
                    'product_variants.color',
                    'product_variants.storage',
                    DB::raw('COALESCE(stock_counts.in_stock_count, 0) as in_stock_count'),
                ])
                ->map(fn ($v) => [
                    'name' => (string) $v->product_name,
                    'variant' => trim(implode(' · ', array_filter([(string) $v->color, (string) $v->storage]))),
                    'stock' => (int) $v->in_stock_count,
                ])
                ->values()
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @return list<array{name: string, variant: string, stock: int}>
     */
    private function fetchLowStockRows(): array
    {
        try {
            $stockCounts = DB::table('imei_codes')
                ->selectRaw('product_variant_id, COUNT(*) as in_stock_count')
                ->where('status', 'in_stock')
                ->groupBy('product_variant_id');

            return ProductVariant::query()
                ->joinSub($stockCounts, 'stock_counts', fn ($join) => $join->on('stock_counts.product_variant_id', '=', 'product_variants.id'))
                ->join('products', 'products.id', '=', 'product_variants.product_id')
                ->where('products.is_active', true)
                ->whereBetween('stock_counts.in_stock_count', [1, 3])
                ->orderBy('stock_counts.in_stock_count')
                ->limit(15)
                ->get([
                    'products.name as product_name',
                    'product_variants.color',
                    'product_variants.storage',
                    'stock_counts.in_stock_count',
                ])
                ->map(fn ($v) => [
                    'name' => (string) $v->product_name,
                    'variant' => trim(implode(' · ', array_filter([(string) $v->color, (string) $v->storage]))),
                    'stock' => (int) $v->in_stock_count,
                ])
                ->values()
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }
}
