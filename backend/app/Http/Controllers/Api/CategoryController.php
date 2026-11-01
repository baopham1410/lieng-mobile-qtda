<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->withCount('products')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'icon'])
            ->map(fn ($cat) => $this->formatCategory($cat));

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:categories,name',
            'icon' => 'nullable|string|max:16',
        ]);

        $category = Category::create([
            'name' => trim($validated['name']),
            'slug' => $this->uniqueSlug(trim($validated['name'])),
            'icon' => $this->normalizeIcon($validated['icon'] ?? null),
        ]);

        ActivityLogger::record($request->user(), [
            'action' => 'create',
            'module' => 'categories',
            'title' => 'Thêm danh mục: '.$category->name,
            'description' => 'Icon: '.($category->icon ?: 'mặc định'),
            'link' => '/products/categories',
        ]);

        return response()->json([
            'data' => $this->formatCategory($category->fresh()),
            'message' => 'Đã thêm danh mục',
        ], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:categories,name,'.$category->id,
            'icon' => 'nullable|string|max:16',
        ]);

        $name = trim($validated['name']);
        $category->update([
            'name' => $name,
            'slug' => $category->name === $name ? $category->slug : $this->uniqueSlug($name, $category->id),
            'icon' => array_key_exists('icon', $validated)
                ? $this->normalizeIcon($validated['icon'])
                : $category->icon,
        ]);

        ActivityLogger::record($request->user(), [
            'action' => 'update',
            'module' => 'categories',
            'title' => 'Sửa danh mục: '.$category->name,
            'description' => 'Cập nhật tên hoặc icon',
            'link' => '/products/categories',
        ]);

        return response()->json([
            'data' => $this->formatCategory($category->fresh()->loadCount('products')),
            'message' => 'Đã cập nhật danh mục',
        ]);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        if (Product::where('category_id', $category->id)->exists()) {
            return response()->json([
                'message' => 'Không thể xóa danh mục đang có sản phẩm.',
            ], 422);
        }

        $name = $category->name;
        $category->delete();

        ActivityLogger::record($request->user(), [
            'action' => 'delete',
            'module' => 'categories',
            'title' => 'Xóa danh mục: '.$name,
            'link' => '/products/categories',
        ]);

        return response()->json(['message' => 'Đã xóa danh mục']);
    }

    private function formatCategory(Category $cat): array
    {
        return [
            'id' => $cat->id,
            'name' => $cat->name,
            'slug' => $cat->slug,
            'icon' => $cat->icon,
            'productCount' => $cat->products_count ?? Product::where('category_id', $cat->id)->count(),
        ];
    }

    private function normalizeIcon(?string $icon): ?string
    {
        $trimmed = trim((string) $icon);

        return $trimmed === '' ? null : $trimmed;
    }

    private function uniqueSlug(string $name, ?int $exceptId = null): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'danh-muc';
        }

        $slug = $base;
        $suffix = 2;

        while (
            Category::query()
                ->where('slug', $slug)
                ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
                ->exists()
        ) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
