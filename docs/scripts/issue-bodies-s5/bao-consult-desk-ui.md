## Mục tiêu
Quầy **Tư vấn** nội bộ: khách ngoài vẫn **Gọi ngay** (`tel:`), NV trong Admin tiếp nhận cuộc gọi, ghi KH + ghi âm.

## Phạm vi đã làm
1. Hotline storefront → `0383 435 600` (nút Gọi ngay = `tel:`)
2. Admin nav **Tư vấn** → `/consult`
3. `ConsultDeskView` — workspace nhận cuộc gọi + lịch sử (không modal/CRM form)
4. Ghi SĐT/tên/chủ đề/ghi chú + MediaRecorder / upload file
5. Kết thúc: Xong · Nhỡ máy · Hẹn gọi lại (mock `localStorage`)
6. i18n VI/LO + `consultMock.js`

## Việc tiếp theo
- [ ] Nối tổng đài / Softphone / CDR tự mở phiếu
- [ ] API + DB phiếu tư vấn (bỏ localStorage)
- [ ] Phân quyền NV tiếp nhận

## Commit
`feat(consult): add admin call-desk for hotline reception`

## DoD UI
- [x] Khách: Gọi ngay vẫn gọi điện
- [x] Admin: mục Tư vấn, tiếp nhận trên trang
- [x] Ghi thông tin KH + ghi âm demo
- [ ] PBX thật chưa (đúng scope UI-first)
