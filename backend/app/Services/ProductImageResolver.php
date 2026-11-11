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
        $catLower = Str::lower(trim((string) $categorySlug));

        // 1. Tivi / Smart TV
        if (str_contains($needle, 'tivi') || str_contains($needle, 'tv') || $catLower === 'tivi') {
            if (str_contains($needle, 'lg') || $brandLower === 'lg') {
                return '/products/lg-oled-48.jpg';
            }
            return '/products/samsung-tv-55.jpg';
        }

        // 2. Tủ lạnh / Refrigerators
        if (str_contains($needle, 'tủ lạnh') || str_contains($needle, 'tu lanh') || $catLower === 'tu-lanh') {
            if (str_contains($needle, 'panasonic') || $brandLower === 'panasonic') {
                return '/products/panasonic-fridge-190l.jpg';
            }
            return '/products/samsung-fridge-256l.jpg';
        }

        // 3. Quạt / Fans
        if (str_contains($needle, 'quạt') || str_contains($needle, 'quat') || $catLower === 'quat') {
            if (str_contains($needle, 'mitsubishi') || $brandLower === 'mitsubishi') {
                return '/products/mitsubishi-fan.jpg';
            }
            return '/products/senko-fan.jpg';
        }

        // 4. Cáp sạc / Cables (must check before generic chargers)
        if (str_contains($needle, 'lightning')) {
            return '/products/cable-lightning.jpg';
        }
        if (str_contains($needle, 'cáp') || str_contains($needle, 'cap') || str_contains($needle, 'cable')) {
            if (str_contains($needle, 'usb-c') || str_contains($needle, 'type-c')) {
                return '/products/cable-usbc.jpg';
            }
            return '/products/cable-usbc.jpg';
        }

        // 5. Ốp lưng / Phone Case (must check before generic phones)
        if (str_contains($needle, 'ốp') || str_contains($needle, 'op lung') || str_contains($needle, 'case')) {
            return '/products/phone-case.jpg';
        }

        // 6. Củ sạc / GaN Charger
        if (str_contains($needle, 'củ sạc') || str_contains($needle, 'gan') || str_contains($needle, 'sạc nhanh') || str_contains($needle, 'charger')) {
            return '/products/gan-charger.jpg';
        }

        // 7. Tai nghe & Âm thanh
        if (str_contains($needle, 'jbl')) {
            return '/products/jbl-tune.jpg';
        }
        if (str_contains($needle, 'airpod') || str_contains($needle, 'tai nghe') || str_contains($needle, 'headphone') || str_contains($needle, 'earbuds')) {
            return '/products/airpods-pro.jpg';
        }

        // 8. Laptop & MacBook
        if (str_contains($needle, 'macbook') || str_contains($needle, 'laptop') || $catLower === 'laptop') {
            return '/products/macbook-air-m2.jpg';
        }

        // 9. Máy tính bảng / Tablet
        if (str_contains($needle, 'ipad') || str_contains($needle, 'tablet') || $catLower === 'tablet') {
            return '/products/ipad-air.jpg';
        }

        // 10. Smartwatch / Đồng hồ
        if (str_contains($needle, 'watch') || str_contains($needle, 'đồng hồ') || str_contains($needle, 'dong ho')) {
            return '/products/galaxy-watch6.jpg';
        }

        // 11. Điện thoại thông minh / Smartphones
        if (str_contains($needle, 'iphone')) {
            return '/products/iphone-15.jpg';
        }
        if (str_contains($needle, 'xiaomi') || str_contains($needle, '14t') || str_contains($needle, 'redmi') || $brandLower === 'xiaomi') {
            return '/products/xiaomi-14.jpg';
        }
        if (str_contains($needle, 'oppo') || str_contains($needle, 'reno') || $brandLower === 'oppo') {
            return '/products/oppo-reno11.jpg';
        }
        if (str_contains($needle, 'samsung') || str_contains($needle, 'galaxy') || str_contains($needle, 's24') || $brandLower === 'samsung') {
            return '/products/samsung-s24.jpg';
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

        if (Str::startsWith($path, ['/products/', '/hero/', '/brand/', '/flags/', '/avatars/'])) {
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
