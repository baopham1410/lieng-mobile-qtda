# Luồng Nghiệp Vụ

## 1. Luồng Nhập Hàng & Khởi Tạo Dòng Chi

```mermaid
sequenceDiagram
    actor NV as Nhân viên kho
    participant App as Web/Mobile
    participant API as Laravel API
    participant DB as MySQL

    NV->>App: Tạo phiếu nhập (draft)
    App->>API: POST /stock-imports
    API->>DB: INSERT stock_imports (status=draft)

    NV->>App: Thêm sản phẩm + số lượng
    App->>API: POST /stock-imports/{id}/items

    NV->>App: Quét/nhập danh sách IMEI
    App->>API: POST /stock-imports/{id}/imei
    API->>DB: Validate IMEI unique
    API->>DB: INSERT imei_codes (status=in_stock)

    NV->>App: Xác nhận phiếu nhập
    App->>API: POST /stock-imports/{id}/confirm
    API->>DB: UPDATE stock_imports (status=confirmed)
    API->>DB: INSERT transactions (type=expense)
    API-->>App: Phiếu nhập hoàn tất
```

**Quy tắc**:
- Số IMEI nạp vào phải khớp tổng quantity của các items.
- Confirm không thể hoàn tác — chỉ admin mới cancel (và phải kiểm tra IMEI chưa bán).

---

## 2. Luồng Bán Hàng POS & Xuất Kho

```mermaid
sequenceDiagram
    actor NV as Nhân viên bán
    participant App as Web/Mobile POS
    participant API as Laravel API
    participant DB as MySQL

    NV->>App: Tìm sản phẩm khách mua
    NV->>App: Quét/chọn IMEI cụ thể
    App->>API: GET /imei/{code}
    API-->>App: IMEI in_stock ✓

    App->>API: POST /orders (draft)
    App->>API: POST /orders/{id}/items { imei_code_id }

    NV->>App: Áp dụng giảm giá / thành viên
    NV->>App: Chọn PT thanh toán
    NV->>App: Checkout
    App->>API: POST /orders/{id}/checkout

    API->>DB: BEGIN TRANSACTION
    API->>DB: UPDATE imei_codes SET status=sold
    API->>DB: UPDATE orders SET status=completed
    API->>DB: INSERT transactions (type=income)
    API->>DB: INSERT warranties (nếu có KH)
    API->>DB: COMMIT

    API-->>App: Hóa đơn + in PDF
```

**Quy tắc**:
- Mỗi order_item gắn đúng 1 IMEI.
- IMEI phải `in_stock` tại thời điểm checkout.
- Dùng DB transaction để tránh bán trùng IMEI.

---

## 3. Luồng Tra Cứu Bảo Hành

```
Input: IMEI (15 số)
  ↓
GET /warranties/lookup/{imei}
  ↓
Trả về: Thông tin máy, KH, ngày bắt đầu/kết thúc BH, lịch sử sửa chữa
```

---

## 4. Luồng Báo Cáo Lãi/Lỗ

```
Doanh thu = SUM(transactions WHERE type=income AND period)
Chi phí  = SUM(transactions WHERE type=expense AND period)
Lợi nhuận gộp = Doanh thu - Chi phí

Chi tiết theo:
  - Ngày / Tuần / Tháng
  - Phương thức thanh toán
  - Danh mục chi (expense_categories)
```

---

## 5. Trạng thái IMEI

```mermaid
stateDiagram-v2
    [*] --> in_stock: Nhập kho
    in_stock --> sold: Bán hàng
    in_stock --> defective: Báo lỗi
    sold --> warranty: KH yêu cầu BH
    warranty --> sold: Sửa xong trả KH
    defective --> in_stock: Sửa xong (admin)
```

| Status | Mô tả |
|--------|-------|
| `in_stock` | Trong kho, sẵn sàng bán |
| `sold` | Đã bán |
| `defective` | Máy lỗi, không bán được |
| `warranty` | Đang trong quy trình bảo hành |
