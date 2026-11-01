# Thứ tự Migration Laravel

Chạy migrations theo thứ tự sau để đảm bảo foreign key hợp lệ:

| # | File migration | Bảng |
|---|----------------|------|
| 1 | `0001_01_01_000000_create_users_table.php` | users (Laravel default) |
| 2 | `2025_01_01_000001_create_roles_table.php` | roles |
| 3 | `2025_01_01_000002_create_permissions_table.php` | permissions, role_permissions |
| 4 | `2025_01_01_000003_add_role_id_to_users_table.php` | users.role_id FK |
| 5 | `2025_01_01_000010_create_categories_table.php` | categories |
| 6 | `2025_01_01_000011_create_products_table.php` | products |
| 7 | `2025_01_01_000012_create_product_variants_table.php` | product_variants |
| 8 | `2025_01_01_000013_create_product_prices_table.php` | product_prices |
| 9 | `2025_01_01_000020_create_suppliers_table.php` | suppliers |
| 10 | `2025_01_01_000021_create_stock_imports_table.php` | stock_imports |
| 11 | `2025_01_01_000022_create_stock_import_items_table.php` | stock_import_items |
| 12 | `2025_01_01_000023_create_imei_codes_table.php` | imei_codes |
| 13 | `2025_01_01_000030_create_customers_table.php` | customers |
| 14 | `2025_01_01_000031_create_orders_table.php` | orders |
| 15 | `2025_01_01_000032_create_order_items_table.php` | order_items |
| 16 | `2025_01_01_000033_add_order_item_id_to_imei_codes.php` | imei_codes.order_item_id FK |
| 17 | `2025_01_01_000040_create_expense_categories_table.php` | expense_categories |
| 18 | `2025_01_01_000041_create_transactions_table.php` | transactions |
| 19 | `2025_01_01_000050_create_warranties_table.php` | warranties |
| 20 | `2025_01_01_000051_create_warranty_repairs_table.php` | warranty_repairs |

## Seeders

| Seeder | Nội dung |
|--------|----------|
| `RoleSeeder` | 3 roles: admin, sales_staff, warehouse_staff |
| `PermissionSeeder` | Permissions theo module |
| `RolePermissionSeeder` | Gán quyền cho từng role |
| `UserSeeder` | Admin mặc định: admin@liengmobile.com / password |
| `ExpenseCategorySeeder` | Nhập hàng, Mặt bằng, Lương, Điện nước... |
| `CategorySeeder` | Điện thoại, Laptop, Phụ kiện, Tablet |

```bash
php artisan db:seed
```

## Tham chiếu

- Migrations Laravel: `backend/database/migrations/`
- Hướng dẫn Neon: [`docs/neon-setup.md`](../docs/neon-setup.md)
