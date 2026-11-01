<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TradeConversationResource;
use App\Models\TradeConversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TradeConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TradeConversation::query()
            ->with('user:id,name')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('lao_text', 'ilike', "%{$search}%")
                    ->orWhere('vi_text', 'ilike', "%{$search}%")
                    ->orWhere('customer_name', 'ilike', "%{$search}%")
                    ->orWhere('note', 'ilike', "%{$search}%");
            });
        }

        $perPage = min($request->integer('per_page', 30), 100);
        $rows = $query->paginate($perPage);

        return response()->json([
            'data' => TradeConversationResource::collection($rows),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:200',
            'lao_text' => 'required|string|max:10000',
            'vi_text' => 'nullable|string|max:10000',
            'customer_name' => 'nullable|string|max:120',
            'note' => 'nullable|string|max:1000',
        ]);

        $lao = trim($validated['lao_text']);
        $title = trim((string) ($validated['title'] ?? ''));
        if ($title === '') {
            $title = Str::limit(preg_replace('/\s+/u', ' ', $lao) ?: 'Hội thoại bán hàng', 80);
        }

        $row = TradeConversation::create([
            'user_id' => $request->user()->id,
            'title' => $title,
            'lao_text' => $lao,
            'vi_text' => isset($validated['vi_text']) ? trim((string) $validated['vi_text']) : null,
            'customer_name' => isset($validated['customer_name']) ? trim((string) $validated['customer_name']) : null,
            'note' => isset($validated['note']) ? trim((string) $validated['note']) : null,
        ]);

        $row->load('user:id,name');

        return response()->json([
            'data' => new TradeConversationResource($row),
            'message' => 'Đã lưu hội thoại',
        ], 201);
    }

    public function update(Request $request, TradeConversation $tradeConversation): JsonResponse
    {
        if ($tradeConversation->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Không có quyền sửa hội thoại này.'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|nullable|string|max:200',
            'lao_text' => 'sometimes|required|string|max:10000',
            'vi_text' => 'sometimes|nullable|string|max:10000',
            'customer_name' => 'sometimes|nullable|string|max:120',
            'note' => 'sometimes|nullable|string|max:1000',
        ]);

        if (array_key_exists('lao_text', $validated)) {
            $validated['lao_text'] = trim($validated['lao_text']);
        }
        if (array_key_exists('vi_text', $validated)) {
            $validated['vi_text'] = $validated['vi_text'] !== null ? trim((string) $validated['vi_text']) : null;
        }
        if (array_key_exists('title', $validated)) {
            $validated['title'] = $validated['title'] !== null ? trim((string) $validated['title']) : null;
        }
        if (array_key_exists('customer_name', $validated)) {
            $validated['customer_name'] = $validated['customer_name'] !== null
                ? trim((string) $validated['customer_name'])
                : null;
        }
        if (array_key_exists('note', $validated)) {
            $validated['note'] = $validated['note'] !== null ? trim((string) $validated['note']) : null;
        }

        $tradeConversation->update($validated);
        $tradeConversation->load('user:id,name');

        return response()->json([
            'data' => new TradeConversationResource($tradeConversation),
            'message' => 'Đã cập nhật hội thoại',
        ]);
    }

    public function destroy(Request $request, TradeConversation $tradeConversation): JsonResponse
    {
        if ($tradeConversation->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Không có quyền xóa hội thoại này.'], 403);
        }

        $tradeConversation->delete();

        return response()->json([
            'message' => 'Đã xóa hội thoại',
        ]);
    }
}
