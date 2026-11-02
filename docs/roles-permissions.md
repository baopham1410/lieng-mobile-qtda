# Phân Quyền & Vai Trò

## Vai trò hệ thống

| Role | Mã | Mô tả |
|------|-----|-------|
| Admin | `admin` | Quản lý cửa hàng, user/role, cấu hình, báo cáo đầy đủ |
| Nhân viên bán hàng | `sales_staff` | POS, khách hàng, tra cứu bảo hành |
| Nhân viên kho | `warehouse_staff` | Nhập kho, quét IMEI, kiểm kho |
| Admin Quán | `quan_manager` | Toàn quyền sổ thu chi quán, gồm **Kho sao kê** |
| Nhân viên Quán | `quan_staff` | Bán / ghi chi tại quầy — **không** xem / lưu kho sao kê |

## Ma trận quyền

| Module | admin | sales_staff | warehouse_staff | quan_manager | quan_staff |
|--------|:-----:|:-----------:|:---------------:|:------------:|:----------:|
| Users/Roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Categories | ✅ | view | view | ❌ | ❌ |
| Products | ✅ | view | ✅ create | ❌ | ❌ |
| IMEI | ✅ | view | ✅ manage | ❌ | ❌ |
| Stock Import | ✅ | ❌ | ✅ | ❌ | ❌ |
| Orders/POS | ✅ | ✅ | ❌ | ❌ | ❌ |
| Customers | ✅ | ✅ | view | ❌ | ❌ |
| Finance (cửa hàng) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Quán (quầy / ghi chi) | ✅ | ❌ | ❌ | ✅ | ✅ |
| Quán — Kho sao kê | ✅ | ❌ | ❌ | ✅ | ❌ |
| Reports | ✅ | dashboard | inventory | ❌ | ❌ |
| Warranty | ✅ | ✅ | view | ❌ | ❌ |

## Permissions (chi tiết)

```
users.view, users.create, users.update, users.delete
products.view, products.create, products.update, products.delete
imei.view, imei.manage, imei.status
stock_imports.view, stock_imports.create, stock_imports.confirm
orders.view, orders.create, orders.checkout, orders.cancel
customers.view, customers.create, customers.update
finance.view, finance.create, finance.reports
quan.view, quan.create, quan.delete, quan.statements
warranty.view, warranty.repair
```

### Quán — chi tiết

| Permission | Admin Quán | Nhân viên Quán |
|------------|:----------:|:--------------:|
| `quan.view` | ✅ | ✅ |
| `quan.create` | ✅ | ✅ |
| `quan.delete` | ✅ | ❌ |
| `quan.statements` | ✅ | ❌ |

API `GET/POST/DELETE /quan/statements*` yêu cầu `quan.statements`.

## Tài khoản demo (seed)

| Email | Mật khẩu | Role |
|-------|----------|------|
| `quan@liengmobile.com` | `password` | Admin Quán |
| `nvquan@liengmobile.com` | `password` | Nhân viên Quán |

## Middleware Laravel

```php
// routes/api.php
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Admin-only routes: users, finance, reports...
});

Route::middleware(['auth:sanctum', 'role:sales_staff,admin'])->group(function () {
    // POS routes
});
```

## Ghi chú triển khai

- Một user chỉ có **1 role** (đơn giản hóa cho cửa hàng nhỏ/vừa).
- Nếu cần mở rộng: chuyển sang Spatie Laravel Permission (multi-role).
- App Quán (web + Expo): mục **Kho sao kê** vẫn hiện với nhân viên nhưng **khóa** (không vào / không lưu) khi thiếu `quan.statements`.
