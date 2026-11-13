## Bug
Trên biên lai **Sao kê** (`QuanStatementSheet`), hàng thẻ thống kê (`.qs-cards`) bị **tràn khỏi khổ giấy / khung biên lai**.

Card cuối **「SỐ DÒNG · N giao dịch」** (`.qs-card` thứ 4) bị cắt / tràn ra ngoài mép phải khi xem preview và khi in.

## Tái hiện
1. Đăng nhập Admin → **Báo cáo / Sao kê** (hoặc Quán → Sao kê)
2. Mở preview biên lai `QuanStatementSheet`
3. Quan sát 4 card: Kỳ báo cáo · Từ ngày · Đến ngày · Số dòng
4. Card **Số dòng** tràn khỏi biên phải của `.quan-statement-sheet`

## File
- `frontend/src/components/quan/QuanStatementSheet.vue`
  - markup: `.qs-cards` / `.qs-card` (~dòng 111–126)
  - CSS: `.qs-cards`, `.qs-card`, `.qs-card-value` (~352+)
  - `@media print` rules (~603+)

## Việc cần làm (UI)
- [ ] Giữ **4 card trong 1 hàng** nhưng không overflow khổ A4 / container biên lai
- [ ] Fix grid/flex: `minmax(0,1fr)`, `overflow-wrap`, giảm padding/font nếu cần
- [ ] Text 「N giao dịch」 không bị bẻ cột hẹp xấu (hoặc rút 「N dòng」 trên mobile/print)
- [ ] Kiểm tra **màn hình** + **Print / Save as image** không bị cắt mép
- [ ] Screenshot trước/sau comment vào issue

## DoD
- [ ] 4 card nằm gọn trong biên lai (không tràn)
- [ ] In / PNG biên lai không mất chữ 「Số dòng」
