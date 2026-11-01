<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuanProductResource;
use App\Models\QuanProduct;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuanProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = QuanProduct::query()
            ->orderByRaw("CASE category
                WHEN 'dien-thoai' THEN 1
                WHEN 'dich-vu' THEN 2
                WHEN 'man-hinh' THEN 3
                WHEN 'pin' THEN 4
                WHEN 'phu-kien' THEN 5
                WHEN 'sim-card' THEN 6
                WHEN 'dong-ho' THEN 7
                ELSE 8 END")
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($request->boolean('active_only', true)) {
            $query->where('is_active', true);
        }

        if ($category = trim((string) $request->query('category'))) {
            if ($category !== 'all') {
                $query->where('category', $category);
            }
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where('name', 'ilike', "%{$search}%");
        }

        return response()->json([
            'data' => QuanProductResource::collection($query->get()),
            'categories' => collect(QuanProduct::CATEGORIES)
                ->map(fn ($label, $value) => ['value' => $value, 'label' => $label])
                ->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'category' => 'nullable|string|in:'.implode(',', array_keys(QuanProduct::CATEGORIES)),
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $product = QuanProduct::create([
            'name' => trim($validated['name']),
            'category' => $validated['category'] ?? 'khac',
            'price' => $validated['price'],
            'cost_price' => array_key_exists('cost_price', $validated) ? $validated['cost_price'] : null,
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => (int) QuanProduct::max('sort_order') + 1,
        ]);

        ActivityLogger::record($request->user(), [
            'action' => 'create',
            'module' => 'quan',
            'title' => 'Thêm sản phẩm quán '.$product->name,
            'description' => ActivityLogger::formatMoney((float) $product->price),
            'link' => '/quan',
        ]);

        return response()->json([
            'data' => new QuanProductResource($product),
            'message' => 'Đã thêm sản phẩm',
        ], 201);
    }

    public function update(Request $request, QuanProduct $quanProduct): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:200',
            'category' => 'sometimes|nullable|string|in:'.implode(',', array_keys(QuanProduct::CATEGORIES)),
            'price' => 'sometimes|required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['name'])) {
            $validated['name'] = trim($validated['name']);
        }

        if (array_key_exists('cost_price', $validated) && $validated['cost_price'] === '') {
            $validated['cost_price'] = null;
        }

        $quanProduct->update($validated);

        return response()->json([
            'data' => new QuanProductResource($quanProduct->fresh()),
            'message' => 'Đã cập nhật sản phẩm',
        ]);
    }

    public function destroy(Request $request, QuanProduct $quanProduct): JsonResponse
    {
        $name = $quanProduct->name;
        $quanProduct->update(['is_active' => false]);

        ActivityLogger::record($request->user(), [
            'action' => 'delete',
            'module' => 'quan',
            'title' => 'Ẩn sản phẩm quán '.$name,
            'link' => '/quan',
        ]);

        return response()->json([
            'message' => 'Đã ẩn sản phẩm khỏi quầy',
        ]);
    }
}
