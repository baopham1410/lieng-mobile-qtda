<?php

namespace Database\Seeders;

use App\Models\ImeiCode;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PosCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $today = now()->toDateString();

        $catalog = [
            [
                'slug' => 'phu-kien',
                'items' => [
                    ['name' => 'Cáp sạc USB-C 1m', 'brand' => 'Lieng', 'sku' => 'PK-USB-C-001', 'color' => 'Trắng', 'storage' => '—', 'retail' => 190000, 'import' => 95000, 'serials' => ['PK-USB-C-001-A', 'PK-USB-C-001-B']],
                    ['name' => 'Cáp Lightning 1m', 'brand' => 'Lieng', 'sku' => 'PK-LGT-001', 'color' => 'Trắng', 'storage' => '—', 'retail' => 150000, 'import' => 75000, 'serials' => ['PK-LGT-001-A']],
                    ['name' => 'Ốp lưng iPhone 15', 'brand' => 'Lieng', 'sku' => 'PK-CASE-001', 'color' => 'Trong', 'storage' => '—', 'retail' => 120000, 'import' => 55000, 'serials' => ['PK-CASE-001-A', 'PK-CASE-001-B']],
                    ['name' => 'Tai nghe JBL Tune', 'brand' => 'JBL', 'sku' => 'PK-JBL-001', 'color' => 'Đen', 'storage' => '—', 'retail' => 890000, 'import' => 620000, 'serials' => ['PK-JBL-001-A']],
                ],
            ],
            [
                'slug' => 'tivi',
                'items' => [
                    ['name' => 'Samsung Smart TV 55"', 'brand' => 'Samsung', 'sku' => 'TV-SAM-55', 'color' => 'Đen', 'storage' => '55 inch', 'retail' => 12990000, 'import' => 10800000, 'serials' => ['TV-SAM-55-001']],
                    ['name' => 'LG OLED 48"', 'brand' => 'LG', 'sku' => 'TV-LG-48', 'color' => 'Đen', 'storage' => '48 inch', 'retail' => 18990000, 'import' => 16200000, 'serials' => ['TV-LG-48-001']],
                ],
            ],
            [
                'slug' => 'tu-lanh',
                'items' => [
                    ['name' => 'Samsung Inverter 256L', 'brand' => 'Samsung', 'sku' => 'FR-SAM-256', 'color' => 'Bạc', 'storage' => '256L', 'retail' => 8990000, 'import' => 7200000, 'serials' => ['FR-SAM-256-001']],
                    ['name' => 'Panasonic 190L', 'brand' => 'Panasonic', 'sku' => 'FR-PANA-190', 'color' => 'Trắng', 'storage' => '190L', 'retail' => 6490000, 'import' => 5200000, 'serials' => ['FR-PANA-190-001', 'FR-PANA-190-002']],
                ],
            ],
            [
                'slug' => 'quat',
                'items' => [
                    ['name' => 'Senko quạt đứng', 'brand' => 'Senko', 'sku' => 'FAN-SENKO-16', 'color' => 'Trắng', 'storage' => '16 inch', 'retail' => 890000, 'import' => 620000, 'serials' => ['FAN-SENKO-001', 'FAN-SENKO-002']],
                    ['name' => 'Mitsubishi quạt trần', 'brand' => 'Mitsubishi', 'sku' => 'FAN-MIT-56', 'color' => 'Trắng', 'storage' => '56 inch', 'retail' => 2490000, 'import' => 1980000, 'serials' => ['FAN-MIT-001']],
                ],
            ],
        ];

        foreach ($catalog as $group) {
            $categoryId = DB::table('categories')->where('slug', $group['slug'])->value('id');
            if (! $categoryId) {
                continue;
            }

            foreach ($group['items'] as $item) {
                if (ProductVariant::where('sku', $item['sku'])->exists()) {
                    continue;
                }

                $product = Product::create([
                    'category_id' => $categoryId,
                    'name' => $item['name'],
                    'brand' => $item['brand'],
                    'model_code' => $item['sku'],
                    'is_active' => true,
                ]);

                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'sku' => $item['sku'],
                    'color' => $item['color'],
                    'storage' => $item['storage'],
                    'condition' => 'new',
                ]);

                ProductPrice::create([
                    'product_variant_id' => $variant->id,
                    'price_type' => 'retail',
                    'amount' => $item['retail'],
                    'effective_from' => $today,
                ]);
                ProductPrice::create([
                    'product_variant_id' => $variant->id,
                    'price_type' => 'import',
                    'amount' => $item['import'],
                    'effective_from' => $today,
                ]);

                foreach ($item['serials'] as $serial) {
                    ImeiCode::create([
                        'product_variant_id' => $variant->id,
                        'imei' => $serial,
                        'status' => 'in_stock',
                        'import_cost' => $item['import'],
                    ]);
                }
            }
        }
    }
}
