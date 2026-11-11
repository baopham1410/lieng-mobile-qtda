<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageResolver
{
    private static ?array $catalog = null;

    public function resolve(?string $name, ?string $brand = null, ?string $categorySlug = null, ?string $imagePath = null): ?string
    {
        if ($stored = $this->storedUrl($imagePath)) {
            return $stored;
        }

        $name = trim((string) $name);
        if ($name === '') {
            return null;
        }

        $needle = Str::lower($name);
        $brandLower = Str::lower(trim((string) $brand));

        if (str_contains($needle, 'iphone')) {
            return '/products/iphone-15.jpg';
        }
        if (str_contains($needle, 'samsung') || str_contains($needle, 's24')) {
            return '/products/samsung-s24.jpg';
        }
        if (str_contains($needle, 'xiaomi') || str_contains($needle, '14t')) {
            return '/products/xiaomi-14.jpg';
        }
        if (str_contains($needle, 'oppo') || str_contains($needle, 'reno')) {
            return '/products/oppo-reno11.jpg';
        }
        if (str_contains($needle, 'ipad')) {
            return '/products/ipad-air.jpg';
        }
        if (str_contains($needle, 'airpod') || str_contains($needle, 'tai nghe')) {
            return '/products/airpods-pro.jpg';
        }
        if (str_contains($needle, 'watch') || str_contains($needle, 'đồng hồ')) {
            return '/products/galaxy-watch6.jpg';
        }
        if (str_contains($needle, 'sạc') || str_contains($needle, 'cáp')) {
            return '/products/gan-charger.jpg';
        }
        if (str_contains($needle, 'ốp') || str_contains($needle, 'case')) {
            return '/products/phone-case.jpg';
        }

        foreach ($this->catalog() as $item) {
            if ($this->matches($needle, $brandLower, $item)) {
                return $this->urlFor($item);
            }
        }

        return null;
    }

    public function resolveProduct(Product $product): ?string
    {
        $product->loadMissing('category');

        return $this->resolve(
            $product->name,
            $product->brand,
            $product->category?->slug,
            $product->image_path,
        );
    }

    public function storedUrl(?string $path): ?string
    {
        if (! is_string($path) || trim($path) === '') {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        return url(Storage::disk('public')->url($path));
    }

    private function matches(string $needle, string $brandLower, array $item): bool
    {
        $catalogName = Str::lower((string) ($item['name'] ?? ''));
        $catalogBrand = Str::lower((string) ($item['brand'] ?? ''));
        $catalogShort = Str::lower(trim(str_replace($catalogBrand.' ', '', $catalogName)));

        if ($needle === $catalogName || $needle === $catalogShort) {
            return true;
        }

        if ($catalogShort !== '' && (str_contains($catalogName, $needle) || str_contains($needle, $catalogShort))) {
            return true;
        }

        if ($brandLower !== '' && $catalogBrand === $brandLower) {
            $needleTokens = collect(explode(' ', $needle))->filter()->take(4)->implode(' ');
            if ($needleTokens !== '' && str_contains($catalogName, $needleTokens)) {
                return true;
            }
        }

        $slug = Str::slug($needle);
        $id = (string) ($item['id'] ?? '');

        return $id !== '' && ($slug === $id || str_contains($slug, $id) || str_contains($id, $slug));
    }

    private function urlFor(array $item): ?string
    {
        $file = $item['image_file'] ?? null;
        if (is_string($file) && $file !== '') {
            $localPath = base_path('../data/product-catalog/'.$file);
            if (is_file($localPath)) {
                $relative = '/api/v1/media/catalog/'.ltrim(str_replace('images/', '', $file), '/');

                return url($relative);
            }
        }

        $remote = $item['image_url'] ?? null;

        return is_string($remote) && $remote !== '' ? $remote : null;
    }

    private function catalog(): array
    {
        if (self::$catalog !== null) {
            return self::$catalog;
        }

        $path = base_path('../data/product-catalog/catalog.json');
        if (! is_file($path)) {
            self::$catalog = [];

            return self::$catalog;
        }

        self::$catalog = json_decode((string) file_get_contents($path), true) ?? [];

        return self::$catalog;
    }
}
