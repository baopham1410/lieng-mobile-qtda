# Nhập kho & quản lý IMEI

## Menu
**Kho hàng → Nhập kho** → `/inventory/imports`.

## Các bước nhập
1. Tạo phiếu nhập mới (hoặc mở phiếu nháp).
2. Thêm dòng sản phẩm / biến thể (có thể tạo SP mới ngay trên phiếu).
3. Nhập hoặc **quét IMEI** (camera / OCR / súng quét) cho từng máy.
4. Kiểm tra IMEI không trùng trong hệ thống.
5. Xác nhận nhập kho → IMEI chuyển sang tồn.

## Lưu ý
- Mỗi IMEI là duy nhất.
- Role: `admin`, `warehouse_staff` được tạo/xác nhận nhập; `sales_staff` không nhập kho.
- Sau khi bán tại POS, IMEI không còn ở trạng thái tồn.
