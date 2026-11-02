# Hướng Dẫn Phát Triển — Lieng Mobile

Tài liệu tóm tắt cấu trúc dự án, vai trò từng phần, mô hình code BE/FE và thứ tự triển khai.

---

## 1. Bức tranh tổng thể

Hệ thống dùng mô hình **Decoupled (tách biệt)** — Backend và Frontend là 2 ứng dụng độc lập, giao tiếp qua **REST API + JSON**.

```
Vue 3 (Web)  ──┐
               ├──►  Laravel API  ──►  MySQL
Flutter (App) ─┘         ▲
                    Sanctum Token
```

| Thư mục | Vai trò | Ai dùng |
|---------|---------|---------|
| `backend/` | Xử lý logic, DB, bảo mật, API | Web + Mobile gọi vào |
| `frontend/` | Giao diện Admin/POS trên trình duyệt | Admin, NV bán hàng, NV kho |
| `mobile/` | App iOS/Android | Quản lý, NV kho (quét IMEI) |
| `docs/` | Thiết kế DB, API, luồng nghiệp vụ | Dev tham chiếu khi code |
| `database/schema.sql` | Schema MySQL đầy đủ | Làm migrations |

**Trạng thái hiện tại:** BE đã cài Laravel 9 + Sanctum, migration cơ bản. FE và Mobile chưa init.

---

## 2. Các module nghiệp vụ & chức năng

| Module | Chức năng | BE xử lý | FE hiển thị |
|--------|-----------|----------|-------------|
| **Auth** | Đăng nhập, phân quyền | Token Sanctum, middleware role | Màn login, guard route |
| **Sản phẩm** | CRUD sản phẩm, biến thể, giá | Model Product, Variant, Price | Form/list sản phẩm |
| **IMEI** | Quản lý từng máy (trong kho/đã bán) | Bảng `imei_codes`, validate unique | Quét/nhập IMEI |
| **Nhập kho** | Phiếu nhập → nạp IMEI → tạo phiếu chi | `StockImportService` | Form nhập kho |
| **POS** | Bán hàng, chọn IMEI, checkout | `CheckoutService` + transaction DB | Màn POS, giỏ hàng |
| **Thu chi** | Ghi thu/chi, báo cáo lãi/lỗ | Auto từ Order/Import + phiếu chi thủ công | Dashboard, biểu đồ |
| **Khách hàng** | Hồ sơ, lịch sử mua | CRUD Customer | List/detail KH |
| **Bảo hành** | Tra cứu theo IMEI | Warranty + repair log | Ô tra cứu IMEI |

**3 vai trò người dùng:**

| Vai trò | Quyền chính |
|---------|-------------|
| `admin` | Toàn quyền quản lý cửa hàng, user, báo cáo, cấu hình |
| `sales_staff` | Bán hàng POS, khách hàng, tra cứu bảo hành |
| `warehouse_staff` | Nhập kho, quét IMEI, kiểm kho |

Chi tiết phân quyền: [roles-permissions.md](roles-permissions.md)

---

## 3. Mô hình code Backend (Laravel)

### Pattern: Controller → Service → Model (+ Event khi cần)

```
Request → Controller → Service (logic) → Model (DB)
                ↓
           API Resource (format JSON trả về)
```

| File / thư mục | Vai trò | Code gì |
|----------------|---------|---------|
| `routes/api.php` | Định nghĩa URL API | `Route::post('/orders/{id}/checkout', ...)` |
| `Controllers/Api/V1/` | Nhận request, gọi Service, trả response | Không viết logic nghiệp vụ dài |
| `Requests/` | Validate input | `'imei' => 'required\|unique:imei_codes'` |
| `Services/` | Logic nghiệp vụ | Checkout, nhập kho, tính tiền |
| `Models/` | Quan hệ DB, query | `ImeiCode belongsTo ProductVariant` |
| `Resources/` | Format JSON trả FE | Ẩn field nhạy cảm, gom quan hệ |
| `Middleware/CheckRole.php` | Kiểm tra quyền | Chặn NV kho vào POS |
| `database/migrations/` | Cấu trúc bảng | Theo `backend/MIGRATION_ORDER.md` |
| `Events/Listeners/` | Side-effect tách riêng | Order xong → tự ghi thu |

### Cấu trúc thư mục BE

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/   # AuthController, ProductController...
│   │   ├── Middleware/           # CheckRole
│   │   ├── Requests/             # Validate theo module
│   │   └── Resources/            # Format JSON response
│   ├── Models/                   # Eloquent models
│   ├── Services/                 # Business logic
│   │   ├── Inventory/
│   │   ├── Order/
│   │   ├── Finance/
│   │   └── Warranty/
│   ├── Policies/                 # Authorization
│   ├── Events/                   # Domain events
│   └── Listeners/                # Event handlers
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/api.php
└── tests/Feature/
```

### Ví dụ luồng code BE — Bán hàng (Checkout)

```
1. routes/api.php         → POST /api/v1/orders/{id}/checkout
2. CheckoutRequest         → validate payment_method, customer_id
3. OrderController         → gọi CheckoutService
4. CheckoutService         → DB::transaction {
                               đổi IMEI status → sold,
                               cập nhật order → completed,
                               tạo transaction income
                             }
5. OrderResource           → trả JSON hóa đơn
```

### Nguyên tắc BE

- **Controller** mỏng — chỉ điều phối, không chứa logic phức tạp.
- **Service** chứa toàn bộ luồng nghiệp vụ.
- **Model** chỉ quan hệ DB, scope, accessor — không gọi API bên ngoài.
- Dùng **DB::transaction** cho luồng bán hàng/nhập kho (tránh IMEI bán trùng).
- Side-effect (ghi thu chi) dùng **Event/Listener** hoặc gọi trong Service.

---

## 4. Mô hình code Frontend (Vue 3)

### Pattern: View → Store/Composable → API → BE

```
View (giao diện)
  ↓ gọi
Store Pinia / Composable (state, logic UI)
  ↓ gọi
api/products.js (Axios)
  ↓ HTTP + Bearer Token
Laravel API
```

| File / thư mục | Vai trò | Code gì |
|----------------|---------|---------|
| `views/` | **Trang màn hình** — layout + gọi store/api | `ProductListView.vue` |
| `components/common/` | UI dùng chung | `AppTable.vue`, `AppModal.vue` |
| `components/modules/` | Component theo nghiệp vụ | `PosCart.vue`, `ImeiScanner.vue` |
| `layouts/` | Khung Admin/POS (sidebar, header) | `AdminLayout.vue`, `PosLayout.vue` |
| `router/index.js` | Định tuyến + guard đăng nhập | `/products` → cần token |
| `stores/auth.js` | State đăng nhập, token | `login()`, `logout()`, `user` |
| `stores/cart.js` | Giỏ hàng POS | thêm/xóa sản phẩm, IMEI |
| `api/client.js` | Axios + gắn token vào header | `Authorization: Bearer ...` |
| `api/products.js` | Hàm gọi API theo module | `getProducts()`, `createProduct()` |
| `composables/` | Logic tái sử dụng | `usePagination()`, `useToast()` |

### Cấu trúc thư mục FE

```
frontend/
├── src/
│   ├── api/                    # 1 file = 1 module BE
│   │   ├── client.js
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── ...
│   ├── views/                  # 1 folder = 1 màn hình nghiệp vụ
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── finance/
│   │   └── warranty/
│   ├── components/
│   │   ├── common/             # dùng mọi nơi
│   │   └── modules/            # chỉ dùng trong 1 module
│   ├── layouts/
│   ├── router/
│   ├── stores/
│   ├── composables/
│   └── utils/
├── index.html
└── vite.config.js
```

### Routes FE chính

| Path | View | Mô tả |
|------|------|-------|
| `/login` | LoginView | Đăng nhập |
| `/` | DashboardView | Tổng quan doanh thu |
| `/products` | ProductListView | Danh sách sản phẩm |
| `/inventory/imports` | StockImportListView | Phiếu nhập kho |
| `/pos` | PosView | Bán hàng POS |
| `/orders` | OrderListView | Lịch sử đơn hàng |
| `/customers` | CustomerListView | Khách hàng |
| `/finance` | TransactionListView | Thu chi |
| `/reports` | RevenueReportView | Báo cáo |
| `/warranty` | WarrantyLookupView | Tra cứu bảo hành |

### Quy tắc phân chia FE

- **View** = trang (route), không chứa logic API phức tạp.
- **Component** = UI tái sử dụng, nhận props / emit events.
- **Store** = state cần chia sẻ nhiều component (auth, cart).
- **api/** = mọi gọi HTTP tập trung ở đây; View không gọi Axios trực tiếp.
- **composables/** = logic UI tái sử dụng (pagination, toast, form validation).

### Biến môi trường FE

```env
VITE_API_URL=http://localhost:8080/api/v1
```

---

## 5. Làm gì trước? FE trước hay BE trước?

### Khuyến nghị: BE trước, FE song song từng module

| Cách | Vấn đề |
|------|--------|
| Làm hết UI trước | Mock data sai → sửa lại nhiều khi nối API |
| Làm hết BE trước | Không thấy kết quả, khó test thực tế |
| **Đúng: từng module BE → FE** | Mỗi tính năng chạy end-to-end ngay |

### Thứ tự triển khai theo Phase

```
Phase 1 — Nền tảng (LÀM TRƯỚC)
├── BE: migrations (roles, users, products, imei...)
├── BE: Auth API (login/logout/me)
└── FE: init Vue 3 + Login + Layout Admin

Phase 2 — Sản phẩm & Kho
├── BE: CRUD products, variants, stock import, IMEI
└── FE: màn quản lý sản phẩm + nhập kho

Phase 3 — Bán hàng
├── BE: POS API (checkout, lock IMEI)
└── FE: màn POS

Phase 4 — Thu chi & Báo cáo
├── BE: transactions, reports API
└── FE: dashboard, biểu đồ

Phase 5 — Bảo hành + Mobile
├── BE: warranty lookup API
└── FE/Mobile: tra cứu IMEI, Flutter app
```

**Mỗi phase:** BE xong API → test Postman → FE làm UI nối API → test trên browser.

---

## 6. Luồng code 1 tính năng (ví dụ: Danh sách sản phẩm)

### Bước BE

```
1. Migration: products, product_variants
2. Model: Product, ProductVariant (quan hệ hasMany)
3. ProductController@index
4. ProductResource (format JSON)
5. Route: GET /api/v1/products
6. Test Postman → thấy JSON
```

### Bước FE

```
1. api/products.js → hàm getProducts()
2. views/products/ProductListView.vue → gọi getProducts(), hiển thị AppTable
3. router/index.js → path '/products'
4. Mở browser → thấy danh sách từ BE thật
```

---

## 7. Luồng xác thực (Sanctum)

```
Client                         API
  │  POST /api/v1/auth/login
  │  { email, password, device_name }
  ├──────────────────────────────►
  │                               Validate → Create token
  │  { token, user, role }
  ◄──────────────────────────────┤
  │  GET /api/v1/products
  │  Authorization: Bearer {token}
  ├──────────────────────────────►
  │                               Middleware: auth:sanctum + role
  │  { data: [...] }
  ◄──────────────────────────────┤
```

FE lưu token vào `localStorage` hoặc Pinia store, Axios interceptor tự gắn vào mọi request.

---

## 8. Việc cần làm & trạng thái

| # | Việc | Trạng thái |
|---|------|------------|
| 1 | Cài Laravel + Sanctum | ✅ Xong |
| 2 | Migration mặc định (users, tokens) | ✅ Xong |
| 3 | Migration Lieng (roles, products, imei...) | ⏳ Cần DATABASE_URL Neon |
| 4 | Auth API (login/me/logout) | ⏳ Tiếp theo |
| 5 | Init Vue 3 + Login UI | ✅ Xong (skeleton) |
| 6 | Module Products (BE + FE) | ⏳ Chưa làm |
| 7 | Module Kho & IMEI (BE + FE) | ⏳ Chưa làm |
| 8 | Module POS (BE + FE) | ⏳ Chưa làm |
| 9 | Module Thu chi & Báo cáo | ⏳ Chưa làm |
| 10 | Bảo hành + Mobile app | ⏳ Chưa làm |

---

## 9. Tài liệu liên quan

| File | Nội dung |
|------|----------|
| [architecture.md](architecture.md) | Kiến trúc hệ thống, stack công nghệ |
| [database-schema.md](database-schema.md) | ERD, mô tả bảng dữ liệu |
| [api-design.md](api-design.md) | Danh sách REST API endpoints |
| [workflows.md](workflows.md) | Luồng bán hàng, nhập kho, bảo hành |
| [roles-permissions.md](roles-permissions.md) | Ma trận phân quyền |
| [project-structure.md](project-structure.md) | Cấu trúc thư mục + roadmap |
| `backend/MIGRATION_ORDER.md` | Thứ tự migration Laravel |
| `database/schema.sql` | SQL schema đầy đủ |

---

## 10. Tóm tắt nhanh

| | Backend | Frontend |
|---|---------|----------|
| **Framework** | Laravel 9 + Sanctum | Vue 3 + Vite + Pinia + Tailwind |
| **Pattern** | Controller → Service → Model | View → Store → API |
| **Logic nghiệp vụ** | `app/Services/` | `stores/` + `composables/` |
| **Gọi API** | — | `src/api/` (Axios) |
| **Giao diện** | — | `views/` + `components/` |
| **Routing** | `routes/api.php` | `router/index.js` |
| **Thứ tự làm** | API trước, test Postman | UI nối API ngay sau mỗi module BE |

**Không** làm hết giao diện trước rồi mới nối BE.  
**Cũng không** làm hết BE mà không có FE để test.  
**Làm từng module:** BE API xong → FE nối → test → sang module tiếp.
