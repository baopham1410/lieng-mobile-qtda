<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Nhập hàng', 'type' => 'import'],
            ['name' => 'Mặt bằng', 'type' => 'operating'],
            ['name' => 'Lương nhân viên', 'type' => 'operating'],
            ['name' => 'Điện nước', 'type' => 'operating'],
            ['name' => 'Khác', 'type' => 'other'],
        ];

        foreach ($categories as $category) {
            DB::table('expense_categories')->updateOrInsert(
                ['name' => $category['name']],
                array_merge($category, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
