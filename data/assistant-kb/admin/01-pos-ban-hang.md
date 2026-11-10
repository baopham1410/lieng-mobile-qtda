# POS — Bán hàng tại quầy

## Menu
Vào **Bán hàng** → `/pos` (nút xanh nổi trên sidebar).

## Các bước bán máy
1. Chọn sản phẩm / biến thể (dung lượng, màu).
2. Nếu máy có IMEI: chọn hoặc quét IMEI còn tồn.
3. (Tuỳ chọn) gắn khách hàng để tạo bảo hành / lịch sử.
4. Chọn hình thức thanh toán:
   - Tiền mặt
   - Chuyển khoản (PayOS)
   - Mixed (một phần tiền mặt + một phần CK)
5. Xác nhận thanh toán → hệ thống tạo đơn.
6. Nếu đơn có IMEI: phiếu bảo hành được tạo theo số tháng BH của sản phẩm.

## Lưu ý
- IMEI phải còn trạng thái tồn (chưa bán).
- PayOS: sau khi khách chuyển khoản, bấm **Kiểm tra ngay** để đồng bộ trạng thái.
- Nhân viên kho không dùng POS; chỉ `admin` và `sales_staff`.
