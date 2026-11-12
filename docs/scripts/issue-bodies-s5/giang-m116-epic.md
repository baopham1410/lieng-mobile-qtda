## Vai trò issue này
**Epic / mục lục** — tách từ #116 cũ. Mỗi màn = 1 issue con (1 UI = 1 nhiệm vụ).

## IA mobile Lieng (đề xuất — chốt với #115)
Bỏ tabs Quán (Quầy / Sao kê / Ghi chi / Kho). Shell mới **5 tab**:

| Tab | Route đề xuất | Lấy từ web | Issue con |
|-----|---------------|------------|-----------|
| Trang chủ | `/(tabs)/home` | `/dashboard` | (link) |
| Bán hàng | `/(tabs)/pos` | `/pos` | (link) |
| Đơn | `/(tabs)/orders` | `/orders` | (link) |
| Dịch vụ | `/(tabs)/service` | `/warranty` + `/appraisal` | (link) |
| Tôi | `/(tabs)/account` | `/profile` | (link) |

Ngoài tab: **Login** + **Tab bar shell** + stack **Thẩm định** (placeholder).

Module Quán cũ: ẩn khỏi tab chính → theo dõi #117 (chỉ role `quan_*` nếu còn).

## Theme (áp mọi màn)
- Nền `#FDF2F2` / panel `#FFF7F7`
- Đỏ `#7A0C10` / accent `#DC2626`
- Token trong `mobile-expo/src/constants/config.ts` + `ui.tsx`

## DoD epic
- [ ] Mọi issue con closed hoặc có PR
- [ ] App sales/admin không còn IA Quán làm mặc định
