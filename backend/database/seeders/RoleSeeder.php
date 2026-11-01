<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'admin', 'display_name' => 'Quản trị viên'],
            ['name' => 'sales_staff', 'display_name' => 'Nhân viên bán hàng'],
            ['name' => 'warehouse_staff', 'display_name' => 'Nhân viên kho'],
            ['name' => 'quan_manager', 'display_name' => 'Admin Quán'],
            ['name' => 'quan_staff', 'display_name' => 'Nhân viên Quán'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['name' => $role['name']], $role);
        }
    }
}
