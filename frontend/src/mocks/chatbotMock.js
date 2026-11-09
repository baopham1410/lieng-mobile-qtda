/** Mock replies — UI bóng chat. Gắn RAG/Ollama sau. */

export const publicBotMeta = {
  id: 'public',
  title: 'Lieng Mobile',
  subtitle: 'Tư vấn khách · AI demo',
  greeting:
    'Xin chào! Mình là trợ lý Lieng Mobile. Bạn cần tư vấn máy, bảo hành, thu cũ hay địa chỉ cửa hàng?',
  placeholder: 'Hỏi về sản phẩm, bảo hành, thu cũ…',
  fabLabel: 'Chat tư vấn',
  suggestions: ['Giờ mở cửa?', 'Có thu cũ không?', 'Bảo hành thế nào?', 'Hotline'],
}

export const internalBotMeta = {
  id: 'internal',
  title: 'Trợ lý Admin',
  subtitle: 'Nội bộ · POS / kho / BH',
  greeting:
    'Chào bạn! Mình hỗ trợ nhân viên: cách dùng POS, nhập kho IMEI, bảo hành, báo cáo. (AI chưa gắn — đang demo UI)',
  placeholder: 'Hỏi quy trình / menu hệ thống…',
  fabLabel: 'Trợ lý',
  suggestions: ['Nhập kho IMEI?', 'POS thanh toán?', 'Menu Thẩm định?', 'Ai xem thu chi?'],
}

function replyPublic(text) {
  const q = text.toLowerCase()
  if (/giờ|mở cửa|làm việc/.test(q)) {
    return 'Cửa hàng mở **8:00 – 21:30** (T2–CN). Bạn có thể ghé trực tiếp hoặc để lại SĐT để NV gọi lại.'
  }
  if (/hotline|gọi|sđt|phone|zalo/.test(q)) {
    return 'Hotline: **0383 435 600** · Zalo: **0901 234 567**. Nhân viên sẽ hỗ trợ chọn máy và check IMEI tại quầy.'
  }
  if (/bảo hành|bh|warranty/.test(q)) {
    return 'Máy mới bảo hành chính hãng theo từng dòng (thường 12 tháng). Mang máy + hóa đơn tới quầy; NV tra IMEI trên hệ thống Bảo hành.'
  }
  if (/thu cũ|đổi mới|trade|thẩm định|cũ/.test(q)) {
    return 'Có chương trình **thu cũ đổi mới**. Mang máy tới quầy để thẩm định (AutoGrade). Bạn cũng có thể hỏi NV báo giá tạm trước khi đến.'
  }
  if (/iphone|samsung|giá|máy/.test(q)) {
    return 'Bạn xem mục **Sản phẩm** trên trang chủ hoặc nói model + dung lượng (vd. iPhone 15 Pro 256GB) — NV sẽ báo giá mới nhất. (Bot demo chưa nối kho giá thật.)'
  }
  if (/địa chỉ|ở đâu|chi nhánh|cửa hàng/.test(q)) {
    return 'Chi nhánh chính: **123 Nguyễn Văn Cừ, P.4, Q.5, TP.HCM**. Xem thêm mục Cửa hàng trên trang để biết các điểm khác.'
  }
  return 'Cảm ơn bạn đã hỏi! Hiện trợ lý khách đang ở giai đoạn **giao diện demo**. Để được tư vấn chính xác, gọi **0383 435 600** hoặc để lại nội dung — NV sẽ liên hệ.'
}

function replyInternal(text) {
  const q = text.toLowerCase()
  if (/imei|nhập kho|import/.test(q)) {
    return 'Vào **Nhập kho** → tạo phiếu → thêm biến thể → quét/nhập IMEI → xác nhận nhập. Mỗi IMEI là duy nhất trong hệ thống.'
  }
  if (/pos|thanh toán|quầy|payos/.test(q)) {
    return '**Quầy bán hàng**: chọn SP → (khách nếu cần BH) → thanh toán tiền mặt / CK / mixed. Đơn có IMEI sẽ tạo phiếu bảo hành tự động.'
  }
  if (/thẩm định|autograde|thu cũ/.test(q)) {
    return 'Menu **Dịch vụ → Thẩm định**: upload 3 góc + màn Pin → checklist nội vi → chạy AutoGrade (mock) → lưu FinalPrice. AI YOLO/OCR gắn FastAPI sau.'
  }
  if (/thu chi|finance|báo cáo|doanh thu/.test(q)) {
    return '**Thu chi** và **Báo cáo** chỉ role Admin. Sales xem đơn/POS/BH; kho xem nhập kho/tồn. Bot nội bộ sau sẽ đọc số liệu qua API (RAG + tool).'
  }
  if (/bảo hành|warranty/.test(q)) {
    return '**Bảo hành**: tra IMEI, xem hạn, tạo phiếu sửa. Số tháng BH lấy từ sản phẩm khi bán (không còn cứng 12).'
  }
  if (/quyền|role|nhân viên/.test(q)) {
    return 'Admin quản lý tài khoản ở **Nhân viên**. Bot nội bộ sẽ tôn trọng permission (`assistant.use` + finance/orders…) khi gắn AI.'
  }
  return 'Đây là **bot nội bộ demo UI**. Sau sẽ dùng RAG + Ollama theo `docs/chatbot-internal.md`. Bạn hỏi lại về POS, IMEI, BH, thẩm định hoặc quyền menu nhé.'
}

export function getBotMeta(variant) {
  return variant === 'internal' ? internalBotMeta : publicBotMeta
}

export async function mockBotReply(variant, userText) {
  await new Promise((r) => setTimeout(r, 450 + Math.random() * 400))
  const content = variant === 'internal' ? replyInternal(userText) : replyPublic(userText)
  return {
    id: `a-${Date.now()}`,
    role: 'assistant',
    content,
    at: new Date().toISOString(),
  }
}

/** Render nhẹ **bold** trong tin nhắn mock */
export function splitBotMarkdown(text) {
  const parts = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0
  let m
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ t: 'text', v: text.slice(last, m.index) })
    parts.push({ t: 'bold', v: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ t: 'text', v: text.slice(last) })
  return parts.length ? parts : [{ t: 'text', v: text }]
}
