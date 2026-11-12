## Muc tieu
Sua loi POS chuyen khoan: da thanh toan that nhung bam **Kiem tra ngay** van pending.

## Nguyen nhan
Endpoint payment-status chi doc DB local. Don chi chuyen paid khi webhook PayOS ve — local/webhook lech thi khong cap nhat.

## Viec can lam
- [x] Goi PayOS API khi poll / Kiem tra ngay (getPaymentRequest)
- [x] Neu paid → finalize don; failed/expired → release
- [ ] PR + CI xanh + Hong review + merge main

## Acceptance Criteria
- [ ] AC1: Tao don CK → QR → chuyen tien → Kiem tra ngay → paymentStatus = paid, don completed
- [ ] AC2: Chua thanh toan van pending, khong crash
- [ ] AC3: Loi PayOS API van poll lai, co message ro (khong silent fail UX)

## Evidence
- PR: https://github.com/baopham1410/lieng-mobile-qtda/pull/99
- Commit: fix(pos): sync PayOS status when checking transfer payment

## Nguoi lam
**Bao**
