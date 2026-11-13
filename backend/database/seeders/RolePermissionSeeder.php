<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $all = Permission::pluck('id', 'name');

        $admin = Role::where('name', 'admin')->first();
        $sales = Role::where('name', 'sales_staff')->first();
        $warehouse = Role::where('name', 'warehouse_staff')->first();
        $quan = Role::where('name', 'quan_manager')->first();
        $quanStaff = Role::where('name', 'quan_staff')->first();

        $admin?->permissions()->sync($all->values());

        $sales?->permissions()->sync(
            collect([
                'products.view',
                'imei.view',
                'orders.view', 'orders.create', 'orders.checkout', 'orders.cancel',
                'customers.view', 'customers.create', 'customers.update',
                'warranty.view', 'warranty.repair',
                'appraisal.view', 'appraisal.create', 'appraisal.update', 'appraisal.delete', 'appraisal.appraise',
            ])->map(fn ($name) => $all[$name])->filter()->values()
        );

        $warehouse?->permissions()->sync(
            collect([
                'products.view', 'products.create',
                'imei.view', 'imei.manage', 'imei.status',
                'stock_imports.view', 'stock_imports.create', 'stock_imports.confirm',
                'customers.view',
                'warranty.view',
                'finance.reports',
            ])->map(fn ($name) => $all[$name])->filter()->values()
        );

        $quan?->permissions()->sync(
            collect([
                'quan.view',
                'quan.create',
                'quan.delete',
                'quan.statements',
            ])->map(fn ($name) => $all[$name])->filter()->values()
        );

        $quanStaff?->permissions()->sync(
            collect([
                'quan.view',
                'quan.create',
            ])->map(fn ($name) => $all[$name])->filter()->values()
        );

        foreach (Role::pluck('id') as $roleId) {
            \App\Services\AuthPayloadService::forgetRolePermissions($roleId);
        }
    }
}
