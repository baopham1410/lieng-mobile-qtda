<?php

namespace Database\Seeders;

use App\Models\QuanProduct;
use Illuminate\Database\Seeder;

/**
 * Chuẩn hóa danh mục + tên sản phẩm quầy (ẩn bản cũ trùng/viết tắt).
 */
class QuanProductCatalogSeeder extends Seeder
{
    public function run(): void
    {
        QuanProduct::query()->update(['is_active' => false]);

        $catalog = [
            // Điện thoại
            ['category' => 'dien-thoai', 'name' => 'Điện thoại (máy mới)', 'price' => 3000000, 'sort' => 10],
            ['category' => 'dien-thoai', 'name' => 'Điện thoại (máy cũ)', 'price' => 1500000, 'sort' => 20],
            ['category' => 'dien-thoai', 'name' => 'Điện thoại cục gạch', 'price' => 500000, 'sort' => 30],

            // Dịch vụ
            ['category' => 'dich-vu', 'name' => 'Sửa chữa điện thoại', 'price' => 80000, 'sort' => 10],
            ['category' => 'dich-vu', 'name' => 'Sửa nút / linh kiện', 'price' => 70000, 'sort' => 20],
            ['category' => 'dich-vu', 'name' => 'Sửa đồng hồ', 'price' => 120000, 'sort' => 30],
            ['category' => 'dich-vu', 'name' => 'Chỉnh phần mềm', 'price' => 20000, 'sort' => 40],

            // Màn hình
            ['category' => 'man-hinh', 'name' => 'Thay màn hình', 'price' => 350000, 'sort' => 10],

            // Pin
            ['category' => 'pin', 'name' => 'Thay pin điện thoại', 'price' => 70000, 'sort' => 10],
            ['category' => 'pin', 'name' => 'Thay pin đồng hồ', 'price' => 50000, 'sort' => 20],
            ['category' => 'pin', 'name' => 'Pin dự phòng', 'price' => 150000, 'sort' => 30],

            // Phụ kiện
            ['category' => 'phu-kien', 'name' => 'Sạc / cáp sạc', 'price' => 80000, 'sort' => 10],
            ['category' => 'phu-kien', 'name' => 'Ốp lưng', 'price' => 50000, 'sort' => 20],
            ['category' => 'phu-kien', 'name' => 'Ốp lưng + dây sạc', 'price' => 140000, 'sort' => 30],

            // Sim / Card
            ['category' => 'sim-card', 'name' => 'Sim', 'price' => 100000, 'sort' => 10],
            ['category' => 'sim-card', 'name' => 'Card điện thoại', 'price' => 20000, 'sort' => 20],

            // Đồng hồ
            ['category' => 'dong-ho', 'name' => 'Đồng hồ', 'price' => 1800000, 'sort' => 10],
            ['category' => 'dong-ho', 'name' => 'Đồng hồ + dây sạc', 'price' => 180000, 'sort' => 20],

            // Khác
            ['category' => 'khac', 'name' => 'Quạt', 'price' => 250000, 'sort' => 10],
            ['category' => 'khac', 'name' => 'Đầu thu Tivi', 'price' => 300000, 'sort' => 20],
            ['category' => 'khac', 'name' => 'Remote / bấm Tivi', 'price' => 60000, 'sort' => 30],
        ];

        foreach ($catalog as $row) {
            QuanProduct::updateOrCreate(
                ['name' => $row['name'], 'category' => $row['category']],
                [
                    'price' => $row['price'],
                    'is_active' => true,
                    'sort_order' => $row['sort'],
                ],
            );
        }
    }
}
