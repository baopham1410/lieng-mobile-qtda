# Cấu Trúc Dự Án — Tổng Quan

```
Lieng_mobile/
│
├── README.md
├── .gitignore
├── docker-compose.yml             # Nginx + PHP (optional)
│
├── docs/                          # Tài liệu thiết kế
│   ├── development-guide.md
│   ├── neon-setup.md
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-design.md
│   ├── workflows.md
│   ├── roles-permissions.md
│   └── project-structure.md       # File này
│
├── docker/
│   ├── nginx/default.conf
│   └── php/Dockerfile
│
├── data/                          # Dữ liệu dùng chung (không thuộc FE/BE)
│   └── product-catalog/           # catalog.json — output từ scripts/
│
├── scripts/                       # Tool phụ trợ
│   └── product_catalog/           # Python: crawl/scrape danh mục điện thoại
│
├── backend/                       # Laravel 9 API
│   ├── app/Models/
│   ├── database/migrations/
│   ├── database/seeders/
│   ├── routes/api.php
│   ├── README.md
│   └── MIGRATION_ORDER.md
│
├── frontend/                      # Vue 3 Admin / POS / Store
│   ├── public/                    # hero/, favicon, ảnh tĩnh
│   └── src/
│       ├── api/                   # Axios theo module BE
│       ├── assets/styles/
│       ├── components/
│       │   ├── common/            # Modal, SlideOver, Breadcrumb...
│       │   ├── intro/             # Trang mua hàng (store)
│       │   └── layout/            # Sidebar, Header
│       ├── composables/
│       ├── data/                  # Cấu hình ổn định (menu, danh mục, store info)
│       │   ├── adminNav.js
│       │   ├── productCategories.js
│       │   └── storeIntro.js
│       ├── mocks/                 # Dữ liệu demo tạm (chờ API)
│       │   ├── auth.js            # Đăng nhập demo + chi nhánh
│       │   ├── *Mock.js           # Theo module nghiệp vụ
│       │   └── storeCatalog.js    # Catalog trang mua hàng
│       ├── repositories/          # localStorage (chờ nối API)
│       ├── router/
│       ├── stores/
│       ├── utils/
│       └── views/
│           ├── auth/
│           ├── dashboard/
│           ├── products/
│           ├── inventory/
│           ├── orders/            # POS + danh sách đơn
│           ├── customers/
│           ├── finance/
│           ├── reports/
│           ├── warranty/
│           ├── profile/
│           └── intro/             # Trang chủ khách /store
│
└── mobile/                        # Flutter (chưa init)
    └── README.md
```

## Quy ước Frontend

| Thư mục | Dùng cho |
|---------|----------|
| `src/views/` | Trang (1 route = 1 view) |
| `src/components/common/` | UI dùng nhiều module |
| `src/components/intro/` | Chỉ trang mua hàng |
| `src/data/` | Cấu hình: `adminNav`, `productCategories`, `storeIntro` |
| `src/mocks/` | Dữ liệu demo (`auth.js`, `*Mock.js`, `storeCatalog.js`) |
| `src/repositories/` | Persist localStorage trước khi có API |
| `src/api/` | Mọi gọi HTTP tới Laravel |

## Roadmap phát triển

### Phase 1 — Nền tảng
- [x] Init Laravel + Sanctum
- [x] Migrations + Seeders (Neon PostgreSQL)
- [x] Init Vue 3 + Login + Layout Admin
- [ ] Auth API (login/logout/me)

### Phase 2 — Sản phẩm & Kho
- [x] UI quản lý sản phẩm + nhập kho (mock)
- [ ] CRUD Products, Variants, Prices (API)
- [ ] Stock Import + IMEI (API)

### Phase 3 — Bán hàng
- [x] UI POS + đơn hàng (mock)
- [ ] POS API + checkout thật

### Phase 4 — Thu chi & Báo cáo
- [x] UI thu chi + báo cáo (mock)
- [ ] transactions, reports API

### Phase 5 — Bảo hành + Mobile
- [x] UI tra cứu bảo hành (mock)
- [ ] warranty API + Flutter app

## Quyết định kỹ thuật

| Quyết định | Lựa chọn |
|------------|----------|
| Backend | Laravel 9 + Sanctum |
| Frontend | Vue 3 + Tailwind |
| Mobile | Flutter |
| Database | Neon PostgreSQL |
