# Thiết Kế API REST

Base URL: `/api/v1`  
Auth: `Authorization: Bearer {token}` (Sanctum)

---

## Auth

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/auth/login` | Đăng nhập, trả token |
| POST | `/auth/logout` | Thu hồi token hiện tại |
| GET | `/auth/me` | Thông tin user + quyền |
| POST | `/auth/refresh` | Tạo token mới |

---

## Users & Roles (Admin)

| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/users` | admin |
| POST | `/users` | admin |
| GET | `/users/{id}` | admin |
| PUT | `/users/{id}` | admin |
| DELETE | `/users/{id}` | admin |
| GET | `/roles` | admin |

---

## Categories

| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/categories` | authenticated |
| POST | `/categories` | admin |
| PUT | `/categories/{id}` | admin |
| DELETE | `/categories/{id}` | admin |

---

## Products & Variants

| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/products` | authenticated |
| POST | `/products` | admin, warehouse_staff |
| GET | `/products/{id}` | authenticated |
| PUT | `/products/{id}` | admin |
| DELETE | `/products/{id}` | admin |
| GET | `/products/{id}/variants` | authenticated |
| POST | `/products/{id}/variants` | admin, warehouse_staff |
| PUT | `/variants/{id}` | admin |
| GET | `/variants/{id}/prices` | admin |
| PUT | `/variants/{id}/prices` | admin |

---

## IMEI

| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/imei` | authenticated |
| GET | `/imei/{imei}` | authenticated — tra cứu theo mã |
| GET | `/imei/{imei}/history` | authenticated — lịch sử máy |
| PATCH | `/imei/{id}/status` | admin, warehouse_staff |

Query params: `?status=in_stock&product_variant_id=1&search=`

---

## Suppliers

| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/suppliers` | admin, warehouse_staff |
| POST | `/suppliers` | admin |
| PUT | `/suppliers/{id}` | admin |
| DELETE | `/suppliers/{id}` | admin |

---

## Stock Import (Nhập kho)

| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/stock-imports` | warehouse_staff, admin |
| POST | `/stock-imports` | warehouse_staff |
| GET | `/stock-imports/{id}` | warehouse_staff, admin |
| PUT | `/stock-imports/{id}` | warehouse_staff |
| POST | `/stock-imports/{id}/items` | warehouse_staff |
| POST | `/stock-imports/{id}/imei` | warehouse_staff — nạp danh sách IMEI |
| POST | `/stock-imports/{id}/confirm` | admin, warehouse_staff |

**Confirm flow**: Tăng tồn kho → Tạo IMEI records → Tạo Transaction expense

---

## Orders (POS / Bán hàng)

| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/orders` | sales_staff, admin |
| POST | `/orders` | sales_staff |
| GET | `/orders/{id}` | sales_staff, admin |
| POST | `/orders/{id}/items` | sales_staff — thêm sản phẩm + IMEI |
| DELETE | `/orders/{id}/items/{itemId}` | sales_staff |
| POST | `/orders/{id}/checkout` | sales_staff |
| POST | `/orders/{id}/cancel` | admin |

**Checkout body example**:
```json
{
  "customer_id": 1,
  "payment_method": "cash",
  "discount": 500000,
  "notes": ""
}
```

---

## Customers

| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/customers` | sales_staff, admin |
| POST | `/customers` | sales_staff |
| GET | `/customers/{id}` | sales_staff, admin |
| PUT | `/customers/{id}` | sales_staff, admin |
| GET | `/customers/{id}/orders` | sales_staff, admin |

---

## Finance (Thu Chi)

| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/transactions` | admin |
| POST | `/transactions` | admin — phiếu chi thủ công |
| GET | `/transactions/{id}` | admin |
| GET | `/expense-categories` | admin |
| POST | `/expense-categories` | admin |

---

## Reports (Báo cáo)

| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/reports/revenue` | admin |
| GET | `/reports/profit-loss` | admin |
| GET | `/reports/inventory` | admin, warehouse_staff |
| GET | `/reports/dashboard` | admin, sales_staff |

Query: `?from=2025-06-01&to=2025-06-30&group_by=day|week|month`

**Dashboard response**:
```json
{
  "today_revenue": 15000000,
  "today_orders": 8,
  "month_revenue": 450000000,
  "month_profit": 120000000,
  "low_stock_variants": [],
  "recent_orders": []
}
```

---

## Warranty (Bảo hành)

| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/warranties` | sales_staff, admin |
| GET | `/warranties/lookup/{imei}` | authenticated — tra cứu nhanh |
| POST | `/warranties/{id}/repairs` | sales_staff, admin |
| GET | `/warranties/{id}/repairs` | sales_staff, admin |

---

## Response format

### Success (paginated)
```json
{
  "data": [...],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 20,
    "total": 98
  }
}
```

### Success (single)
```json
{
  "data": { "id": 1, "name": "..." },
  "message": "Tạo thành công"
}
```

### Error
```json
{
  "message": "Dữ liệu không hợp lệ",
  "errors": {
    "imei": ["Mã IMEI đã tồn tại trong hệ thống"]
  }
}
```
