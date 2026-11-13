## Mục tiêu
Sửa lỗi POS chuyển khoản: đã thanh toán thật nhưng bấm **Kiểm tra ngay** vẫn pending.

## Nguyên nhân
Endpoint payment-status chỉ đọc DB local. Đơn chỉ chuyển paid khi webhook PayOS về — local/webhook lệch thì không cập nhật.

## Việc cần làm
- [x] Gọi PayOS API khi poll / Kiểm tra ngay (getPaymentRequest)
- [x] Nếu paid → finalize đơn; failed/expired → release
- [ ] PR + CI xanh + Hong review + merge main

## Acceptance Criteria
- [ ] AC1: Tạo đơn CK → QR → chuyển tiền → Kiểm tra ngay → paymentStatus = paid, đơn completed
- [ ] AC2: Chưa thanh toán vẫn pending, không crash
- [ ] AC3: Lỗi PayOS API vẫn poll lại được, có message rõ

## Evidence
- PR: https://github.com/baopham1410/lieng-mobile-qtda/pull/99
- Commit: ix(pos): sync PayOS status when checking transfer payment

## Người làm
**Bao**
