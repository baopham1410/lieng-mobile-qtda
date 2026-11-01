/**
 * Cụm thoại cửa hàng — Lào ↔ Việt (tham khảo nhanh khi mic không bắt được).
 */
export const laoShopPhrases = [
  { lo: 'ສະບາຍດີ', vi: 'Xin chào' },
  { lo: 'ຂອບໃຈ', vi: 'Cảm ơn' },
  { lo: 'ເທົ່າໃດ?', vi: 'Bao nhiêu tiền?' },
  { lo: 'ແພງໄປ', vi: 'Đắt quá' },
  { lo: 'ລົດໄດ້ບໍ?', vi: 'Giảm được không?' },
  { lo: 'ຂ້ອຍຢາກຊື້', vi: 'Tôi muốn mua' },
  { lo: 'ມີສີອື່ນບໍ?', vi: 'Có màu khác không?' },
  { lo: 'ມີປະກັນບໍ?', vi: 'Có bảo hành không?' },
  { lo: 'ປະກັນກີ່ປີ?', vi: 'Bảo hành mấy năm?' },
  { lo: 'ຈ່າຍເງິນສົດ', vi: 'Trả tiền mặt' },
  { lo: 'ໂອນເງິນ', vi: 'Chuyển khoản' },
  { lo: 'ຂ້ອຍຈະຄິດດູນ', vi: 'Tôi sẽ suy nghĩ thêm' },
  { lo: 'ເອົາໜ່ວຍນີ້', vi: 'Lấy cái này' },
  { lo: 'ທົດລອງໄດ້ບໍ?', vi: 'Thử được không?' },
  { lo: 'ຊ້າໄປ', vi: 'Chậm quá / trễ quá' },
  { lo: 'ດີບໍ?', vi: 'Có tốt không?' },
  { lo: 'ເປັນຂອງໃໝ່ບໍ?', vi: 'Có phải hàng mới không?' },
  { lo: 'ຂ້ອຍບໍ່ເຂົ້າໃຈ', vi: 'Tôi không hiểu' },
  { lo: 'ພູດຊ້າໆ', vi: 'Nói chậm thôi' },
  { lo: 'ລາກ່ອນ', vi: 'Tạm biệt / tôi đi trước' },
]

export function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function isSpeechRecognitionSupported() {
  return Boolean(getSpeechRecognitionCtor())
}
