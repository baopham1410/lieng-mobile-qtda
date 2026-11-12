## Parent
#116

## Màn / component
**Tab bar shell** — thay `QuanTabBar.tsx` → `AppTabBar.tsx`  
File: `app/(app)/(tabs)/_layout.tsx`

## Trong shell gồm gì
5 tab cố định (icon + label VI/LO):
1. Trang chủ  
2. Bán hàng  
3. Đơn  
4. Dịch vụ  
5. Tôi  

- Active state đỏ thương hiệu
- Safe area bottom
- Ẩn tab Quầy / Sao kê / Ghi chi / Kho khỏi shell chính

## Chuyển từ web
| Web | Mang sang |
|-----|-----------|
| `adminNav.js` nhóm Cửa hàng / Bán lẻ / Dịch vụ | Chỉ lấy **nhãn + thứ tự** phù hợp mobile (không copy hết sidebar) |
| `AdminLayout` màu `#fdf2f2` | Màu tab bar + nền |

## Giao diện cần làm
- [ ] 5 icon tab (Phosphor-equivalent hoặc SF-style đơn giản)
- [ ] Label i18n mới (bỏ “Quầy/Sao kê/Ghi chi/Kho”)
- [ ] Highlight tab đang chọn
- [ ] Wire 5 route placeholder nếu màn chưa xong (màn trống + title)

## DoD
- [ ] Screenshot tab bar
- [ ] Không còn `QuanTabBar` trên flow sales/admin
