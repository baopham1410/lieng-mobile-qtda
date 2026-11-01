<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\ExpenseCategory;
use App\Models\ImeiCode;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductVariant;
use App\Models\StockImport;
use App\Models\StockImportItem;
use App\Models\Supplier;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Warranty;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        if (Product::count() > 0) {
            return;
        }

        $admin = User::where('email', 'admin@liengmobile.com')->first();
        $sales = User::where('email', 'banhang@liengmobile.com')->first();
        $warehouse = User::where('email', 'kho@liengmobile.com')->first();

        $phoneCat = DB::table('categories')->where('slug', 'dien-thoai')->value('id');
        $tabletCat = DB::table('categories')->where('slug', 'tablet')->value('id');

        $suppliers = [
            Supplier::create(['name' => 'Công ty Apple Distributor VN', 'phone' => '0281234567', 'email' => 'sales@applevn.com']),
            Supplier::create(['name' => 'Samsung SDS Việt Nam', 'phone' => '0282345678', 'email' => 'contact@samsung.vn']),
            Supplier::create(['name' => 'Mi Việt Nam Trading', 'phone' => '0283456789', 'email' => 'info@mi.vn']),
        ];

        $productsData = [
            ['cat' => $phoneCat, 'name' => 'iPhone 15 Pro Max', 'brand' => 'Apple', 'model' => 'A3101', 'sku' => 'IP15PM-TX-256', 'color' => 'Titan Xanh', 'storage' => '256GB', 'retail' => 28990000, 'import' => 25200000, 'imeis' => ['356789123456781', '356789123456782', '356789123456783']],
            ['cat' => $phoneCat, 'name' => 'Samsung Galaxy S24', 'brand' => 'Samsung', 'model' => 'SM-S921B', 'sku' => 'S24-BK-256', 'color' => 'Đen', 'storage' => '256GB', 'retail' => 16990000, 'import' => 14500000, 'imeis' => ['356789123456791', '356789123456792']],
            ['cat' => $phoneCat, 'name' => 'Xiaomi 14T Pro', 'brand' => 'Xiaomi', 'model' => '2407FPN8EG', 'sku' => 'X14TP-BK-256', 'color' => 'Đen', 'storage' => '256GB', 'retail' => 14990000, 'import' => 12800000, 'imeis' => ['351234567890123']],
            ['cat' => $tabletCat, 'name' => 'iPad Air M2', 'brand' => 'Apple', 'model' => 'M2-11', 'sku' => 'IPAD-M2-128', 'color' => 'Xám', 'storage' => '128GB', 'retail' => 17990000, 'import' => 15800000, 'imeis' => ['359876543210987', '359876543210988']],
            ['cat' => $phoneCat, 'name' => 'OPPO Reno12 5G', 'brand' => 'OPPO', 'model' => 'CPH2625', 'sku' => 'R12-GR-256', 'color' => 'Xanh', 'storage' => '256GB', 'retail' => 10990000, 'import' => 9200000, 'imeis' => []],
        ];

        $variants = [];
        foreach ($productsData as $p) {
            $product = Product::create([
                'category_id' => $p['cat'],
                'name' => $p['name'],
                'brand' => $p['brand'],
                'model_code' => $p['model'],
                'is_active' => true,
            ]);

            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'sku' => $p['sku'],
                'color' => $p['color'],
                'storage' => $p['storage'],
                'condition' => 'new',
            ]);

            $today = now()->toDateString();
            ProductPrice::create(['product_variant_id' => $variant->id, 'price_type' => 'retail', 'amount' => $p['retail'], 'effective_from' => $today]);
            ProductPrice::create(['product_variant_id' => $variant->id, 'price_type' => 'import', 'amount' => $p['import'], 'effective_from' => $today]);

            foreach ($p['imeis'] as $imei) {
                ImeiCode::create([
                    'product_variant_id' => $variant->id,
                    'imei' => $imei,
                    'status' => 'in_stock',
                    'import_cost' => $p['import'],
                ]);
            }

            $variants[] = ['product' => $product, 'variant' => $variant, 'retail' => $p['retail'], 'import' => $p['import']];
        }

        $customers = [
            Customer::create(['name' => 'Nguyễn Văn A', 'phone' => '0901123456', 'email' => 'nguyenvana@gmail.com', 'address' => 'Quận 1, TP.HCM', 'loyalty_points' => 12500]),
            Customer::create(['name' => 'Trần Thị B', 'phone' => '0902234567', 'email' => 'tranthib@yahoo.com', 'address' => 'Quận 3, TP.HCM', 'loyalty_points' => 6800]),
            Customer::create(['name' => 'Lê Minh C', 'phone' => '0903345678', 'email' => 'leminhc@gmail.com', 'address' => 'Thủ Đức, TP.HCM', 'loyalty_points' => 4200]),
            Customer::create(['name' => 'Phạm Thu D', 'phone' => '0904456789', 'email' => 'phamthud@gmail.com', 'address' => 'Bình Thạnh, TP.HCM', 'loyalty_points' => 2100]),
        ];

        $importCat = ExpenseCategory::where('type', 'import')->first();

        $confirmedImport = StockImport::create([
            'code' => 'PN-'.now()->format('Ymd').'-001',
            'supplier_id' => $suppliers[0]->id,
            'user_id' => $warehouse?->id ?? $admin->id,
            'total_amount' => 50400000,
            'status' => 'confirmed',
            'imported_at' => now()->subDay(),
            'notes' => 'Nhập đợt đầu tháng',
        ]);

        StockImportItem::create([
            'stock_import_id' => $confirmedImport->id,
            'product_variant_id' => $variants[0]['variant']->id,
            'quantity' => 2,
            'unit_cost' => 25200000,
            'subtotal' => 50400000,
        ]);

        StockImport::create([
            'code' => 'PN-'.now()->format('Ymd').'-002',
            'supplier_id' => $suppliers[1]->id,
            'user_id' => $warehouse?->id ?? $admin->id,
            'total_amount' => 29000000,
            'status' => 'draft',
            'notes' => 'Chờ nạp IMEI',
        ]);

        Transaction::create([
            'code' => 'TC-'.now()->format('Ymd').'-IMP1',
            'type' => 'expense',
            'amount' => 50400000,
            'payment_method' => 'transfer',
            'category_id' => $importCat?->id,
            'reference_type' => 'StockImport',
            'reference_id' => $confirmedImport->id,
            'user_id' => $admin->id,
            'description' => 'Nhập kho '.$confirmedImport->code,
            'transacted_at' => now()->subDay(),
        ]);

        $ordersData = [
            ['code' => 'HD-'.now()->format('Ymd').'-023', 'customer' => 0, 'total' => 19990000, 'method' => 'cash', 'variant' => 0, 'imei' => '356789123456781'],
            ['code' => 'HD-'.now()->format('Ymd').'-022', 'customer' => 1, 'total' => 16990000, 'method' => 'transfer', 'variant' => 1, 'imei' => '356789123456791'],
            ['code' => 'HD-'.now()->format('Ymd').'-021', 'customer' => 2, 'total' => 14990000, 'method' => 'ewallet', 'variant' => 2, 'imei' => '351234567890123'],
        ];

        foreach ($ordersData as $i => $od) {
            $variantInfo = $variants[$od['variant']];
            $imei = ImeiCode::where('imei', $od['imei'])->first();

            $order = Order::create([
                'code' => $od['code'],
                'customer_id' => $customers[$od['customer']]->id,
                'user_id' => $sales?->id ?? $admin->id,
                'subtotal' => $od['total'],
                'discount' => 0,
                'total' => $od['total'],
                'payment_method' => $od['method'],
                'status' => 'completed',
                'paid_at' => now()->subHours(3 - $i),
            ]);

            if ($imei) {
                $item = OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $variantInfo['variant']->id,
                    'imei_code_id' => $imei->id,
                    'unit_price' => $od['total'],
                    'discount' => 0,
                    'total' => $od['total'],
                ]);
                $imei->update(['order_item_id' => $item->id, 'status' => 'sold']);

                Warranty::create([
                    'imei_code_id' => $imei->id,
                    'customer_id' => $customers[$od['customer']]->id,
                    'order_id' => $order->id,
                    'start_date' => now()->toDateString(),
                    'end_date' => now()->addMonths(12)->toDateString(),
                    'warranty_months' => 12,
                    'status' => 'active',
                ]);
            }

            Transaction::create([
                'code' => 'TC-'.now()->format('Ymd').'-'.strtoupper(Str::random(3)).($i + 1),
                'type' => 'income',
                'amount' => $od['total'],
                'payment_method' => $od['method'],
                'reference_type' => 'Order',
                'reference_id' => $order->id,
                'user_id' => $sales?->id ?? $admin->id,
                'description' => 'Bán hàng '.$order->code,
                'transacted_at' => $order->paid_at,
            ]);
        }

        Transaction::create([
            'code' => 'TC-'.now()->format('Ymd').'-EXP1',
            'type' => 'expense',
            'amount' => 45000000,
            'payment_method' => 'transfer',
            'category_id' => ExpenseCategory::where('name', 'Lương nhân viên')->value('id'),
            'reference_type' => 'Manual',
            'user_id' => $admin->id,
            'description' => 'Lương tháng '.now()->format('m/Y'),
            'transacted_at' => now()->subDays(2),
        ]);
    }
}
