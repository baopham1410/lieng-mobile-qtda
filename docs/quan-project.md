# Dự án Quán — quản lý cửa hàng nhỏ (độc lập về nghiệp vụ)

> Cập nhật: **23/07/2026**  
> Quyết định: **coi Quán là một sản phẩm / dự án riêng**, dùng cho cửa hàng nhỏ (dịch vụ, phụ kiện, máy lẻ…).  
> **Không** gộp nghiệp vụ với Admin POS/IMEI cho đến khi có nhu cầu rõ.

---

## 1. Định vị

| | **Dự án Quán** | **Dự án Admin Lieng** (cùng monorepo) |
|---|---|---|
| Đối tượng | Cửa hàng nhỏ, 1–vài người | Cửa hàng lớn: kho máy, IMEI, POS chuẩn |
| Người dùng chính | `quan_manager` (Admin Quán), `quan_staff` (NV — không kho sao kê) | `admin`, NV bán, NV kho |
| Việc hàng ngày | Bán nhanh, ghi chi, chốt sao kê ngày | Nhập kho, bán IMEI, bảo hành, báo cáo máy |
| Dữ liệu | `quan_products`, `quan_entries`, `quan_statements` | `products`, `imei`, `orders`, `transactions`… |
| App mobile | `mobile-expo` (ưu tiên Quán) | Chưa ưu tiên |

**Hiện tại code vẫn nằm chung monorepo** (`backend` + `frontend` + `mobile-expo`) để tái dùng đăng nhập/API. Về **sản phẩm và roadmap**, Quán được ưu tiên và đánh giá riêng.

---

## 2. Phạm vi chức năng Quán (trong / ngoài)

### Trong phạm vi (đã có / cần hoàn thiện)

- Đăng nhập role Chủ quán → vào thẳng quầy
- Sản phẩm quầy theo **danh mục** (Điện thoại, Dịch vụ, Màn hình, Pin, …)
- Bán: chỉnh **giá từng lần**, số lượng, TM / CK / cả hai
- Ghi chi trong ngày
- Tổng kết hôm nay
- Sao kê: xem kỳ, in, lưu ảnh, **lưu kho theo ngày**
- Kho sao kê: xem / cập nhật / xóa
- App Expo: đăng nhập + quầy + sao kê (cần bắt kịp web)

### Ngoài phạm vi Quán (thuộc Admin — không bắt buộc gắn)

- POS theo IMEI, phiếu nhập kho máy
- Báo cáo doanh thu máy / tồn IMEI
- Quản lý nhân viên toàn hệ thống
- Bảo hành theo IMEI chi tiết

→ Không cố “thống nhất số liệu” Quán ↔ POS trừ khi sau này chủ cửa hàng yêu cầu gộp báo cáo.

---

## 3. Giao diện Quán (web)

| Màn | URL | Việc làm |
|-----|-----|----------|
| Quầy | `/quan` | Bán, ghi chi, tổng kết, mở sao kê |
| Kho sao kê | `/quan/statements` | Xem lại ngày đã lưu |

Tài khoản demo: `quan@liengmobile.com` / `password`

Chi tiết layout: xem [`trang-thai-du-an.md`](./trang-thai-du-an.md) mục **1bis · B–C**.

---

## 4. Roadmap ưu tiên (chỉ Quán)

1. **UX Chủ quán** — menu/login chỉ lộ Quán (+ hồ sơ), giảm cảm giác “lẫn admin”
2. **Ổn định dùng thật** — timezone, lưu sao kê cuối ngày, catalog đúng hàng bán
3. **App Expo** — khớp web (danh mục + giá lần bán); kết nối API ổn trên điện thoại
4. **Deploy Quán** — lên hosting riêng hoặc subdomain (vd. `quan.…`) khi sẵn sàng
5. (Sau) Tách repo / branding riêng nếu cần — không bắt buộc lúc này

---

## 5. Nguyên tắc làm việc tiếp theo

- Feature mới cho cửa hàng nhỏ → làm trong **Quán**, không nhét vào POS/IMEI.
- Không refactor gộp `quan_entries` vào `orders` trừ khi có quyết định sản phẩm mới.
- Doc / commit / demo cho Chủ quán tập trung `/quan` + `mobile-expo`.

---

## 6. Liên kết

- [Trạng thái monorepo tổng](./trang-thai-du-an.md)
- [Phân quyền](./roles-permissions.md)
- [Mobile Expo README](../mobile-expo/README.md)
