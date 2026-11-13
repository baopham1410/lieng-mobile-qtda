## Phụ thuộc
IA + shell (issues parent) đã chốt.

## Mục tiêu
Gỡ / thu hẹp các màn **clone Quán web** (`quay`, `expense`, `statement`, `archive`) khỏi trải nghiệm chính; thay bằng màn Lieng phù hợp (hoặc giữ Quán chỉ cho role `quan_*`).

## Hiện trạng cần đổi
| Màn cũ (Quán) | Hướng đề xuất |
|---------------|----------------|
| `quay.tsx` bán nhanh quán | POS / bán hàng Lieng hoặc Home |
| `expense.tsx` ghi chi quán | Ẩn / chỉ `quan_*` hoặc bỏ khỏi tab chính |
| `statement.tsx` sao kê ngày | Ẩn / chỉ `quan_*` |
| `archive.tsx` kho sao kê | Ẩn / chỉ `quan_*` |
| `account.tsx` | Giữ, sửa copy + link Thẩm định (placeholder) |

## Việc cần làm
- [ ] Route theo role: `quan_*` mới thấy flow Quán; `admin`/`sales` thấy flow cửa hàng
- [ ] Ít nhất 1 màn mới placeholder: **Thẩm định** (badge Đang phát triển) — khớp AutoGrade web #112
- [ ] Không phá API `/quan/*` nếu vẫn dùng cho role quán
- [ ] Cập nhật `Redirect` sau login theo role (không luôn `/quay`)

## DoD
- [ ] User sales/admin mở app không rơi vào UX “Quầy/Ghi chi/Sao kê” như web Quán cũ
- [ ] Có entry Thẩm định (placeholder OK)
- [ ] Screenshot + note trong PR
