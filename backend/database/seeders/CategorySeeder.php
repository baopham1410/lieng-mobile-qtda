<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Điện thoại', 'slug' => 'dien-thoai', 'icon' => '📱'],
            ['name' => 'Tablet', 'slug' => 'tablet', 'icon' => '📟'],
            ['name' => 'Laptop', 'slug' => 'laptop', 'icon' => '💻'],
            ['name' => 'Phụ kiện', 'slug' => 'phu-kien', 'icon' => '🔌'],
            ['name' => 'Tivi', 'slug' => 'tivi', 'icon' => '📺'],
            ['name' => 'Tủ lạnh', 'slug' => 'tu-lanh', 'icon' => '🧊'],
            ['name' => 'Quạt', 'slug' => 'quat', 'icon' => '🌀'],
        ];

        foreach ($categories as $category) {
            DB::table('categories')->updateOrInsert(
                ['slug' => $category['slug']],
                array_merge($category, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
