## Parent
#116 · web tham chiếu #112

## Màn hình
**Thẩm định AutoGrade** — `app/(app)/appraisal/index.tsx` (+ form stack)

## Trong màn gồm gì (UI-first, khớp web)
1. **List phiếu** — mã, model, hạng, FinalPrice, trạng thái  
2. **Form / tạo phiếu** (có thể 1 màn scroll hoặc wizard):
   - Thông tin khách + model/ROM  
   - Upload / chọn 4 ảnh: trước, sau, cạnh, màn Pin  
   - Checklist nội vi: cảm ứng, loa, rung, Face ID (tick tay trên mobile phase 1)  
   - Nút chạy AI (placeholder) + breakdown giá + FinalPrice  
3. Badge **Đang phát triển / AI mock** nếu chưa nối FastAPI

## Chuyển từ web
| Web | File | Mang sang |
|-----|------|-----------|
| Thẩm định | `views/appraisal/AppraisalListView.vue` | List + form 4 bước (rút gọn layout mobile) |
| Mock schema | `mocks/appraisalMock.js` | Có thể share logic / copy field names |

## Không làm trong issue này
- Train YOLO / gọi FastAPI thật (issue AI sau)

## Giao diện cần làm
- [ ] List + empty
- [ ] Form đủ INPUT AutoGrade (ảnh + nội vi + giá)
- [ ] Panel kết quả mock (hạng, trừ giá, FinalPrice)

## DoD
- [ ] Screenshot list + form
- [ ] Ghi rõ “UI — AI gắn sau”
