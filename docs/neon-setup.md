# Cấu hình Neon PostgreSQL

Dự án dùng **Neon** (PostgreSQL serverless) thay MySQL local.

## 1. Tạo database trên Neon

1. Đăng ký tại [console.neon.tech](https://console.neon.tech)
2. Tạo project mới (ví dụ: `lieng-mobile`)
3. Vào **Connection Details** → copy **Connection string**

Ví dụ:
```
postgresql://neondb_owner:xxxxx@ep-cool-name-12345678.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

## 2. Cấu hình Laravel

Mở `backend/.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=ep-xxx-pooler.region.aws.neon.tech
DB_PORT=5432
DB_DATABASE=neondb
DB_USERNAME=neondb_owner
DB_PASSWORD=your_password
DB_SSLMODE=require
DB_ENDPOINT_ID=ep-xxx
```

`DB_ENDPOINT_ID` = phần đầu hostname Neon (ví dụ hostname `ep-cool-name-12345678-...` → `ep-cool-name-12345678`).

### Lỗi Windows/XAMPP: "Endpoint ID is not specified"

PHP XAMPP trên Windows dùng **libpq cũ**, không hỗ trợ SNI của Neon.

**Cách sửa:** thêm `DB_ENDPOINT_ID` vào `.env` (phần `ep-xxxxx` trong hostname Neon):

```env
DB_ENDPOINT_ID=ep-wandering-water-aojurxcj
```

Dự án đã có `NeonPostgresConnector` tự xử lý — không cần sửa code thêm.

**Lưu ý:**
- Không dùng `channel_binding=require` — dễ lỗi trên XAMPP
- Nên tách field (`DB_HOST`, `DB_PASSWORD`...) thay vì chỉ `DATABASE_URL`

## 3. Bật PostgreSQL cho PHP (XAMPP)

Mở `C:\xampp\php\php.ini`, bỏ comment 2 dòng:

```ini
extension=pdo_pgsql
extension=pgsql
```

Khởi động lại terminal, kiểm tra:

```powershell
php -m | findstr pgsql
```

Phải thấy `pdo_pgsql` và `pgsql`.

## 4. Chạy migration & seed

```powershell
cd d:\DU_AN_WEB\Lieng_mobile\backend
php artisan migrate --seed
```

Tài khoản admin mặc định:

| Email | Mật khẩu |
|-------|----------|
| `admin@liengmobile.com` | `password` |

## 5. Kiểm tra kết nối

```powershell
php artisan db:show
```

(Nếu hỏi cài `doctrine/dbal`, có thể bỏ qua hoặc chạy `composer require doctrine/dbal`)

## Lưu ý

- Neon **bắt buộc SSL** — luôn dùng `sslmode=require`
- Free tier: database sleep sau idle → lần request đầu có thể chậm vài giây
- Schema chính thức: **`backend/database/migrations/`** — chạy `php artisan migrate`
