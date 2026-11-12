<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            [
                'role' => 'admin',
                'name' => 'Admin Lieng',
                'email' => 'admin@liengmobile.com',
                'phone' => '0900000000',
            ],
            [
                'role' => 'sales_staff',
                'name' => 'Nguyễn Thu Hà',
                'email' => 'banhang@liengmobile.com',
                'phone' => '0901111111',
            ],
            [
                'role' => 'warehouse_staff',
                'name' => 'Trần Minh Kho',
                'email' => 'kho@liengmobile.com',
                'phone' => '0902222222',
            ],
            [
                'role' => 'quan_manager',
                'name' => 'Trần Quốc Bảo',
                'email' => 'quanly@liengmobile.com',
                'phone' => '0988777666',
            ],
            [
                'role' => 'quan_manager',
                'name' => 'Trần Quốc Bảo',
                'email' => 'quan@liengmobile.com',
                'phone' => '0988777666',
            ],
            [
                'role' => 'quan_staff',
                'name' => 'Nhân viên Quán',
                'email' => 'nvquan@liengmobile.com',
                'phone' => '0904444444',
            ],
        ];

        foreach ($accounts as $account) {
            $role = Role::where('name', $account['role'])->first();

            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make('password'),
                    'phone' => $account['phone'],
                    'role_id' => $role?->id,
                    'is_active' => true,
                ]
            );
        }
    }
}
