## Parent
#116 (epic shell Lieng Mobile)

## Màn hình
**Login** — `app/login.tsx`

## Trong màn gồm gì
- Logo / tên **Lieng Mobile** (không “Quán Lieng”)
- Email + mật khẩu
- Nút Đăng nhập
- Chọn ngôn ngữ VI / LO (giữ)
- (Tuỳ) gợi ý tài khoản demo **admin / sales** — **không** hiện `quan@…` làm mặc định
- Redirect sau login theo role → `/home` (không cứng `/quay`)

## Chuyển từ web
| Web | File web | Mang sang mobile |
|-----|----------|------------------|
| Login | `frontend/src/views/auth/LoginView.vue` | Layout brand đỏ, form email/pass, lỗi API |
| Auth API | `POST /api/v1/login` (+ Sanctum) | Đã có `src/api/auth.ts` — giữ, sửa UX |

## Giao diện cần làm
- [ ] Hero/logo Lieng Mobile full-bleed nhẹ (đỏ thương hiệu)
- [ ] Form field + PrimaryButton theo `ui.tsx`
- [ ] Alert lỗi đăng nhập
- [ ] Bỏ copy “Ứng dụng Quán” / default quan

## DoD
- [ ] Screenshot login mới
- [ ] Login sales/admin vào Home, không vào Quầy Quán
