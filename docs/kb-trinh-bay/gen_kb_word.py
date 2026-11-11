"""Generate 2 Word files (tables) for teacher presentation of chatbot KBs."""
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

OUT = Path(__file__).resolve().parent


def set_run_font(run, size=11, bold=False):
    run.font.name = "Times New Roman"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    run.font.size = Pt(size)
    run.bold = bold


def add_title(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    set_run_font(run, 16, bold=True)


def add_subtitle(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    set_run_font(run, 12)


def shade_header(row):
    for cell in row.cells:
        shading = cell._tePr if False else cell._tc.get_or_add_tcPr()
        # simple shading via XML
        from docx.oxml import OxmlElement

        tcPr = cell._tc.get_or_add_tcPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:fill"), "C00000")
        shd.set(qn("w:val"), "clear")
        tcPr.append(shd)
        for p in cell.paragraphs:
            for run in p.runs:
                run.font.color.rgb = RGBColor(255, 255, 255)
                set_run_font(run, 11, bold=True)


def fill_table(table, headers, rows):
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ""
        run = hdr[i].paragraphs[0].add_run(h)
        set_run_font(run, 11, bold=True)
    shade_header(table.rows[0])
    for r_i, row_data in enumerate(rows):
        row = table.rows[r_i + 1].cells
        for c_i, val in enumerate(row_data):
            row[c_i].text = ""
            run = row[c_i].paragraphs[0].add_run(str(val))
            set_run_font(run, 11)


def build_admin():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(2)
        section.right_margin = Cm(2)

    add_title(doc, "BẢNG KIẾN THỨC (KB) — BOT TRONG (ADMIN)")
    add_subtitle(doc, "Dự án Lieng Mobile — Chatbot trợ lý nhân viên (RAG + Ollama)")
    p = doc.add_paragraph()
    run = p.add_run(
        "Mục đích: cung cấp tài liệu nội bộ để bot trả lời cách dùng POS, kho IMEI, bảo hành, "
        "phân quyền… Không fine-tune model trên Colab; dùng RAG nạp file Markdown."
    )
    set_run_font(run, 11)

    doc.add_paragraph()
    h = doc.add_paragraph()
    set_run_font(h.add_run("Bảng 1. Danh mục file KB Admin"), 12, bold=True)

    rows = [
        ("01-pos-ban-hang.md", "POS bán hàng", "/pos", "Chọn máy/IMEI, TM/CK/mixed, PayOS"),
        ("02-nhap-kho-imei.md", "Nhập kho & IMEI", "/inventory/imports", "Tạo phiếu, quét IMEI, xác nhận"),
        ("03-san-pham-danh-muc.md", "Sản phẩm & danh mục", "/products, /categories", "Giá nhập–bán, tháng BH"),
        ("04-don-hang-khach.md", "Đơn hàng & khách", "/orders, /customers", "Xem đơn, hồ sơ KH"),
        ("05-thu-chi-bao-cao.md", "Thu chi & báo cáo", "/finance, /reports", "Dashboard, doanh thu, tồn"),
        ("06-bao-hanh.md", "Bảo hành", "/warranty", "Tra IMEI, phiếu sửa"),
        ("07-phan-quyen.md", "Phân quyền", "—", "admin / sales / warehouse"),
        ("08-chay-he-thong.md", "Chạy hệ thống", "local", "Laravel + Vue + Ollama"),
        ("09-tham-dinh-tu-van.md", "Thẩm định & tư vấn", "/appraisal, /consult", "AutoGrade, quầy hotline"),
    ]
    table = doc.add_table(rows=1 + len(rows), cols=4)
    table.style = "Table Grid"
    fill_table(table, ("File Markdown", "Chủ đề", "Menu / Path", "Nội dung chính"), rows)

    doc.add_paragraph()
    h2 = doc.add_paragraph()
    set_run_font(h2.add_run("Bảng 2. Ai được hỏi bot trong"), 12, bold=True)
    roles = [
        ("admin", "Có", "Đầy đủ (kể cả finance/báo cáo)"),
        ("sales_staff", "Có", "POS, đơn, BH — không finance chi tiết"),
        ("warehouse_staff", "Có", "Nhập kho, IMEI, tồn — không POS sâu"),
    ]
    t2 = doc.add_table(rows=1 + len(roles), cols=3)
    t2.style = "Table Grid"
    fill_table(t2, ("Vai trò", "Dùng bot?", "Phạm vi trả lời"), roles)

    doc.add_paragraph()
    note = doc.add_paragraph()
    set_run_font(
        note.add_run(
            "Nguồn file kỹ thuật: data/assistant-kb/admin/ — dùng để ingest RAG (ChromaDB + nomic-embed-text)."
        ),
        10,
    )
    out = OUT / "KB-Bot-Trong-Admin.docx"
    doc.save(out)
    return out


def build_public():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(2)
        section.right_margin = Cm(2)

    add_title(doc, "BẢNG KIẾN THỨC (KB) — BOT NGOÀI (KHÁCH)")
    add_subtitle(doc, "Dự án Lieng Mobile — Chatbot tư vấn khách trên website (RAG + Ollama)")
    p = doc.add_paragraph()
    run = p.add_run(
        "Mục đích: trả lời khách về giờ mở cửa, hotline, bảo hành, thu cũ đổi mới, FAQ. "
        "Không tiết lộ doanh thu / tồn kho nội bộ / phân quyền nhân viên."
    )
    set_run_font(run, 11)

    doc.add_paragraph()
    h = doc.add_paragraph()
    set_run_font(h.add_run("Bảng 1. Danh mục file KB Public"), 12, bold=True)

    rows = [
        ("01-gio-dia-chi-hotline.md", "Giờ – địa chỉ – liên hệ", "8:00–21:30 T2–CN; 123 Nguyễn Văn Cừ Q5; Hotline 0383 435 600"),
        ("02-bao-hanh.md", "Bảo hành", "Chính hãng theo dòng máy; tra IMEI tại quầy"),
        ("03-thu-cu-doi-moi.md", "Thu cũ đổi mới", "Thẩm định tại cửa hàng; AutoGrade hỗ trợ định giá"),
        ("04-san-pham-khuyen-mai.md", "Sản phẩm & KM", "Xem website; trả góp/KM theo đợt; gọi NV để chốt giá"),
        ("05-faq-khach.md", "FAQ", "Khi nào gọi người thật; bot không thay quầy chốt giá tồn"),
    ]
    table = doc.add_table(rows=1 + len(rows), cols=3)
    table.style = "Table Grid"
    fill_table(table, ("File Markdown", "Chủ đề", "Nội dung chính"), rows)

    doc.add_paragraph()
    h2 = doc.add_paragraph()
    set_run_font(h2.add_run("Bảng 2. Thông tin liên hệ chuẩn (trích KB)"), 12, bold=True)
    contact = [
        ("Cửa hàng", "Lieng Mobile"),
        ("Địa chỉ", "123 Nguyễn Văn Cừ, P.4, Q.5, TP.HCM"),
        ("Giờ mở cửa", "8:00 – 21:30 (Thứ 2 – Chủ nhật)"),
        ("Hotline", "0383 435 600"),
        ("Zalo", "0901 234 567"),
        ("Email", "lienhe@liengmobile.vn"),
    ]
    t2 = doc.add_table(rows=1 + len(contact), cols=2)
    t2.style = "Table Grid"
    fill_table(t2, ("Hạng mục", "Thông tin"), contact)

    doc.add_paragraph()
    note = doc.add_paragraph()
    set_run_font(
        note.add_run(
            "Nguồn file kỹ thuật: data/assistant-kb/public/ — ingest riêng collection KB khách, tách khỏi bot Admin."
        ),
        10,
    )
    out = OUT / "KB-Bot-Ngoai-Khach.docx"
    doc.save(out)
    return out


if __name__ == "__main__":
    a = build_admin()
    b = build_public()
    print(a)
    print(b)
