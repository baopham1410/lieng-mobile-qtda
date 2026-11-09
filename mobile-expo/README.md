# Mobile App Quán Lieng (Expo SDK 54)

Ứng dụng di động quản lý bán lẻ, thu chi và sao kê dòng tiền dành riêng cho nhân viên và chủ cửa hàng Quán Lieng.

---

## 1. Cấu trúc màn hình (Information Architecture)

| Mã | Đường dẫn | Tab / Stack | Mô tả chức năng | Trạng thái |
|---|---|---|---|---|
| **P0** | `/login` | — | Đăng nhập email/mật khẩu, đăng nhập nhanh theo vai trò | ✅ Hoàn thành |
| **P1** | `/(tabs)/quay` | Quầy | Lưới SP theo danh mục, bán nhanh (SL, TM/CK/hỗn hợp), thống kê ngày | ✅ Hoàn thành |
| **P2** | `/(tabs)/statement` | Sao kê | Xem dòng tiền theo kỳ (Hôm nay / 7 ngày / Tháng), chốt sổ lưu kho | ✅ Hoàn thành |
| **P3** | `/(tabs)/expense` | Ghi chi | Ghi nhận chi phí quầy trong ngày (TM/CK/hỗn hợp) | ✅ Hoàn thành |
| **P4** | `/(tabs)/archive` | Kho | Kho lưu trữ các bản sao kê ngày đã chốt, lọc theo tháng | ✅ Hoàn thành |
| **P5** | `/statement/[id]` | Stack | Xem chi tiết phiếu sao kê quá khứ, xóa sao kê (Admin/Manager) | ✅ Hoàn thành |
| **P6** | `/(tabs)/account` | Tôi | Thông tin nhân viên, đổi ngôn ngữ (VI/LA), thông tin server API | ✅ Hoàn thành |
| **P7** | `/appraisal` | Stack | **Thẩm định máy cũ (TD-01)**: Mẫu phiếu định giá máy thu cũ đổi mới | 🚧 Đang phát triển |

---

## 2. Chuẩn bị môi trường & Chạy ứng dụng

### Bước 1: Khởi động Backend Laravel
```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8080
```

### Bước 2: Cấu hình địa chỉ IP máy thật (LAN IP)
Tạo file `.env.local` trong thư mục `mobile-expo/`:
```ini
EXPO_PUBLIC_API_URL=http://<IP-LAN-CUA-MAY-TINH>:8080/api/v1
```
> **Lưu ý**: Không dùng `localhost` hoặc `127.0.0.1` khi test trên điện thoại thật. Điện thoại và máy tính phải kết nối chung một mạng Wi-Fi.

### Bước 3: Khởi động ứng dụng Expo
```bash
cd mobile-expo
npm install
npx expo start --lan
```
- Quét mã QR bằng ứng dụng **Expo Go** trên điện thoại (Android) hoặc Camera (iOS).
- Hoặc bấm `w` để mở và chạy trực tiếp trên trình duyệt máy tính.

---

## 3. Tài khoản thử nghiệm (Demo Accounts)

| Vai trò | Email | Mật khẩu | Quyền hạn chính |
|---|---|---|---|
| **Chủ quán / Quản lý** | `quan@liengmobile.com` | `password` | Toàn quyền Quán: Bán hàng, Ghi chi, Lưu kho & Xóa sao kê |
| **Nhân viên quầy** | `banhang@liengmobile.com` | `password` | Bán hàng, Ghi chi, Xem báo cáo trong ngày |
| **Admin hệ thống** | `admin@liengmobile.com` | `password` | Quản trị toàn hệ thống |

---

## 4. Bảng màu thương hiệu (Design Tokens)
Đồng bộ 100% với Web Admin Liêng Mobile (`src/constants/config.ts`):
- **Đỏ thương hiệu chính**: `#7A0C10` (Header, Tab active, Icon)
- **Đỏ điểm nhấn / Nút**: `#DC2626`
- **Nền canvas**: `#FDF2F2` (Hồng phấn nhạt)
- **Hổ phách (Amber)**: `#D97706` / `#FDE68A` (Tiêu đề nhóm danh mục, badge chốt sổ)
- **Xanh lục (Emerald)**: `#059669` (Dòng tiền thu, nút Thêm SP)
