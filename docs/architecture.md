# Kiến Trúc Hệ Thống Lieng Mobile

## 1. Mô hình kiến trúc

Hệ thống dùng **Decoupled Architecture** — Backend API tách biệt hoàn toàn khỏi Web và Mobile.

```
                    ┌──────────────────────────────────────┐
                    │           Client Layer               │
                    │  ┌────────────┐  ┌───────────────┐  │
                    │  │ Web (Vue3) │  │ Mobile (Flutter)│ │
                    │  │ Admin/POS  │  │ Manager/Kho   │  │
                    │  └─────┬──────┘  └───────┬───────┘  │
                    └────────┼─────────────────┼──────────┘
                             │  HTTPS + Bearer Token
                             ▼
                    ┌──────────────────────────────────────┐
                    │         API Gateway Layer            │
                    │  Nginx → PHP-FPM (Laravel 11)       │
                    │  Rate Limiting | CORS | SSL          │
                    └────────────────┬─────────────────────┘
                                     │
                    ┌────────────────┴─────────────────────┐
                    │         Application Layer            │
                    │  Controllers → Services → Repos     │
                    │  Sanctum Auth | Policies | Events    │
                    └────────────────┬─────────────────────┘
                                     │
                    ┌────────────────┴─────────────────────┐
                    │           Data Layer                 │
                    │  Neon PostgreSQL (cloud)             │
                    └──────────────────────────────────────┘
```

## 2. Stack công nghệ

| Layer | Công nghệ | Ghi chú |
|-------|-----------|---------|
| API | Laravel 9 | PHP 8.0+ (XAMPP) hoặc Docker PHP 8.2 |
| Auth | Laravel Sanctum | Token-based cho Web SPA & Mobile |
| DB | Neon PostgreSQL | Serverless, SSL required |
| Web | Vue 3 + Vite + Pinia + TailwindCSS | SPA Admin & POS |
| Mobile | Flutter 3.x | iOS & Android |
| DevOps | Docker Compose | Nginx + PHP-FPM (optional) |

## 3. Cấu trúc Backend (Laravel)

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/     # API controllers theo module
│   │   ├── Middleware/          # Role, IMEI validation...
│   │   ├── Requests/            # Form Request validation
│   │   └── Resources/           # API Resource transformers
│   ├── Models/                  # Eloquent models
│   ├── Services/                # Business logic
│   │   ├── Product/
│   │   ├── Inventory/
│   │   ├── Order/
│   │   ├── Finance/
│   │   └── Warranty/
│   ├── Repositories/            # Data access (optional)
│   ├── Policies/                # Authorization
│   ├── Events/                  # Domain events
│   └── Listeners/               # Event handlers
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── routes/
│   └── api.php                  # Tất cả API routes
└── tests/
    ├── Feature/                 # Integration tests
    └── Unit/
```

### Nguyên tắc phân lớp

- **Controller**: Nhận request, gọi Service, trả Resource — không chứa logic nghiệp vụ.
- **Service**: Xử lý luồng nghiệp vụ (bán hàng, nhập kho, tính lãi/lỗ).
- **Model**: Quan hệ Eloquent, scope, accessor/mutator.
- **Event/Listener**: Tách side-effect (ghi thu chi khi bán hàng, cập nhật IMEI).

## 4. Cấu trúc Frontend (Vue 3)

```
frontend/
├── src/
│   ├── api/                     # Axios wrappers theo module
│   ├── assets/
│   ├── components/
│   │   ├── common/              # Button, Modal, Table...
│   │   ├── layout/              # Sidebar, Header
│   │   └── modules/             # ProductForm, IMEIScanner...
│   ├── composables/             # useAuth, usePagination...
│   ├── layouts/                 # AdminLayout, POSLayout
│   ├── router/                  # Vue Router + guards
│   ├── stores/                  # Pinia stores
│   │   ├── auth.js
│   │   ├── cart.js              # POS cart
│   │   └── ...
│   ├── views/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── orders/              # POS
│   │   ├── finance/
│   │   ├── customers/
│   │   └── reports/
│   └── utils/
└── public/
```

## 5. Cấu trúc Mobile (Flutter)

```
mobile/
├── lib/
│   ├── core/
│   │   ├── api/                 # Dio client, interceptors
│   │   ├── config/
│   │   ├── theme/
│   │   └── utils/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/           # Doanh thu realtime
│   │   ├── inventory/           # Quét IMEI nhập kho
│   │   ├── orders/              # POS mobile
│   │   └── warranty/            # Tra cứu bảo hành
│   ├── shared/
│   │   ├── widgets/
│   │   └── models/
│   └── main.dart
├── android/
└── ios/
```

## 6. Luồng xác thực (Sanctum)

```
Client                    API
  │  POST /api/auth/login
  │  { email, password, device_name }
  ├────────────────────────►
  │                         Validate → Create token
  │  { token, user, roles }
  ◄────────────────────────┤
  │  GET /api/... 
  │  Authorization: Bearer {token}
  ├────────────────────────►
  │                         Middleware: auth:sanctum + role
  │  { data }
  ◄────────────────────────┤
```

## 7. Quy ước API

- Base URL: `/api/v1/`
- Format: JSON
- Pagination: `?page=1&per_page=20`
- Filter: query params (`?status=in_stock&search=iphone`)
- Error: `{ "message": "...", "errors": { "field": ["..."] } }`
- HTTP codes: 200 OK, 201 Created, 422 Validation, 401 Unauthorized, 403 Forbidden

## 8. Triển khai Production

| Thành phần | Khuyến nghị |
|------------|-------------|
| VPS | Ubuntu 22.04, DigitalOcean / AWS |
| Web server | Nginx + PHP-FPM 8.2 |
| SSL | Let's Encrypt |
| DB backup | Cron daily mysqldump |
| Mobile | Google Play / App Store hoặc Firebase App Distribution |
