<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $salesStaff;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Admin']);
        $salesRole = Role::firstOrCreate(['name' => 'sales_staff'], ['display_name' => 'Nhân viên bán hàng']);

        $permIds = [];
        foreach (['customers.view', 'customers.create', 'customers.update', 'customers.delete'] as $name) {
            $permIds[$name] = Permission::firstOrCreate(['name' => $name], ['module' => 'customers'])->id;
        }

        $adminRole->permissions()->syncWithoutDetaching(array_values($permIds));
        $salesRole->permissions()->syncWithoutDetaching([
            $permIds['customers.view'],
            $permIds['customers.create'],
            $permIds['customers.update'],
        ]);

        $this->admin = User::create([
            'name' => 'Admin Test',
            'email' => 'admin-customer@liengmobile.com',
            'password' => Hash::make('password'),
            'role_id' => $adminRole->id,
            'is_active' => true,
        ]);

        $this->salesStaff = User::create([
            'name' => 'Sales Test',
            'email' => 'sales-customer@liengmobile.com',
            'password' => Hash::make('password'),
            'role_id' => $salesRole->id,
            'is_active' => true,
        ]);
    }

    public function test_customer_crud_notes_search_tier_filter_and_show_history(): void
    {
        Sanctum::actingAs($this->salesStaff);

        $createRes = $this->postJson('/api/v1/customers', [
            'name' => 'Nguyễn Minh Anh',
            'phone' => '0909 111 222',
            'email' => 'minhanh@example.com',
            'address' => 'Quận 1, TP.HCM',
            'notes' => 'Thích dòng Pro Max màu Titan',
        ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('data.name', 'Nguyễn Minh Anh')
            ->assertJsonPath('data.notes', 'Thích dòng Pro Max màu Titan')
            ->assertJsonPath('data.tier', 'walkin');

        $customerId = $createRes->json('data.id');

        $vip = Customer::create([
            'name' => 'Trần Quốc Bảo',
            'phone' => '0912345678',
            'loyalty_points' => 5000,
        ]);

        Order::create([
            'code' => 'DH-TEST-001',
            'customer_id' => $vip->id,
            'user_id' => $this->admin->id,
            'subtotal' => 90000000,
            'discount' => 0,
            'total' => 90000000,
            'payment_method' => 'transfer',
            'status' => 'completed',
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);

        $hasAppraisalModule = class_exists(\App\Models\AppraisalTicket::class)
            && Schema::hasTable('appraisal_tickets');

        if ($hasAppraisalModule) {
            \App\Models\AppraisalTicket::create([
                'code' => 'TD-CUST-01',
                'ticket_qr' => 'QR-TD-CUST-01',
                'user_id' => $this->admin->id,
                'customer_name' => 'Nguyễn Minh Anh',
                'customer_phone' => '0909111222',
                'brand' => 'Apple',
                'model' => 'iPhone 15 Pro',
                'storage' => '256GB',
                'ai_grade' => 'B',
                'final_price' => 17500000,
                'status' => 'quoted',
            ]);
        }

        $goldList = $this->getJson('/api/v1/customers?tier=gold&per_page=10');
        $goldList->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Trần Quốc Bảo')
            ->assertJsonPath('data.0.tier', 'gold')
            ->assertJsonPath('meta.per_page', 10);

        $searchList = $this->getJson('/api/v1/customers?search=Titan');
        $searchList->assertOk()->assertJsonCount(0, 'data');

        $searchPhone = $this->getJson('/api/v1/customers?search=0909');
        $searchPhone->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $customerId);

        $showRes = $this->getJson("/api/v1/customers/{$customerId}");
        $showRes->assertOk()
            ->assertJsonPath('data.notes', 'Thích dòng Pro Max màu Titan')
            ->assertJsonStructure(['data' => ['recentOrders', 'warranties', 'appraisals']]);

        if ($hasAppraisalModule) {
            $showRes->assertJsonCount(1, 'data.appraisals')
                ->assertJsonPath('data.appraisals.0.code', 'TD-CUST-01');
        }

        $updateRes = $this->putJson("/api/v1/customers/{$customerId}", [
            'notes' => 'Đã nâng cấp lên 16 Pro Max',
        ]);
        $updateRes->assertOk()
            ->assertJsonPath('data.notes', 'Đã nâng cấp lên 16 Pro Max');
    }

    public function test_delete_requires_permission_and_allows_recreate_phone(): void
    {
        $customer = Customer::create([
            'name' => 'Khách Cần Xóa',
            'phone' => '0988777666',
        ]);

        Sanctum::actingAs($this->salesStaff);
        $this->deleteJson("/api/v1/customers/{$customer->id}")->assertStatus(403);

        Sanctum::actingAs($this->admin);
        $this->deleteJson("/api/v1/customers/{$customer->id}")->assertOk();
        $this->assertSoftDeleted('customers', ['id' => $customer->id]);

        $this->getJson('/api/v1/customers')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
