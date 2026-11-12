<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'users.view', 'module' => 'users'],
            ['name' => 'users.create', 'module' => 'users'],
            ['name' => 'users.update', 'module' => 'users'],
            ['name' => 'users.delete', 'module' => 'users'],
            ['name' => 'products.view', 'module' => 'products'],
            ['name' => 'products.create', 'module' => 'products'],
            ['name' => 'products.update', 'module' => 'products'],
            ['name' => 'products.delete', 'module' => 'products'],
            ['name' => 'imei.view', 'module' => 'imei'],
            ['name' => 'imei.manage', 'module' => 'imei'],
            ['name' => 'imei.status', 'module' => 'imei'],
            ['name' => 'stock_imports.view', 'module' => 'stock_imports'],
            ['name' => 'stock_imports.create', 'module' => 'stock_imports'],
            ['name' => 'stock_imports.confirm', 'module' => 'stock_imports'],
            ['name' => 'orders.view', 'module' => 'orders'],
            ['name' => 'orders.create', 'module' => 'orders'],
            ['name' => 'orders.checkout', 'module' => 'orders'],
            ['name' => 'orders.cancel', 'module' => 'orders'],
            ['name' => 'customers.view', 'module' => 'customers'],
            ['name' => 'customers.create', 'module' => 'customers'],
            ['name' => 'customers.update', 'module' => 'customers'],
            ['name' => 'customers.delete', 'module' => 'customers'],
            ['name' => 'finance.view', 'module' => 'finance'],
            ['name' => 'finance.create', 'module' => 'finance'],
            ['name' => 'finance.reports', 'module' => 'finance'],
            ['name' => 'quan.view', 'module' => 'quan'],
            ['name' => 'quan.create', 'module' => 'quan'],
            ['name' => 'quan.delete', 'module' => 'quan'],
            ['name' => 'quan.statements', 'module' => 'quan'],
            ['name' => 'warranty.view', 'module' => 'warranty'],
            ['name' => 'warranty.repair', 'module' => 'warranty'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(['name' => $permission['name']], $permission);
        }
    }
}
