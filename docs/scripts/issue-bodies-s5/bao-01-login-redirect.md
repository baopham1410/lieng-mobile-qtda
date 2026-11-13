## Muc tieu
Role Quán / Admin / NV sau login vào đúng trang mặc định, không lạc menu.

## Viec can lam
- [ ] Rà `roleRedirect` + `routeAccess`: Quán → `/quan`, Admin → `/dashboard`, sales → `/pos` (hoặc mặc định hợp lý)
- [ ] LoginView: thông báo lỗi rõ, loading state, không flash sai route
- [ ] Sau login redirect đúng role (test 2–3 account)

## Acceptance Criteria
- [ ] AC1: `quan_*` login xong vào Quán (không vào Dashboard Admin đầy menu)
- [ ] AC2: `admin` vào Dashboard
- [ ] AC3: Sai mật khẩu hiện lỗi tiếng Việt rõ
- [ ] AC4: PR + CI xanh + request Hong review

## Nguoi lam
**Bao**
