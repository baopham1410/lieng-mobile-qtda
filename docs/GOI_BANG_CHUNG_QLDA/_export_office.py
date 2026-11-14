"""Export QLDA evidence drafts to Word (.docx) and Excel (.xlsx)."""
from __future__ import annotations

import csv
import re
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, Cm
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "NOP_DRIVE_DOCX_V3"
OUT.mkdir(exist_ok=True)

MD_FILES = [
    ("00_Trang_Thai_Va_Ke_Hoach_AI.md", "00_Trang_Thai_Va_Ke_Hoach_AI.docx"),
    ("01_Final_Technical_Report_updated.md", "01_Final_Technical_Report.docx"),
    ("02_Project_Charter.md", "02_Project_Charter_Signed.docx"),
    ("03_WBS_and_WBS_Dictionary.md", "03_WBS_and_WBS_Dictionary.docx"),
    ("05_Sprint_Retrospectives.md", "05_Sprint_Retrospectives.docx"),
    ("06_Scope_Change_Control_Record.md", "06_Scope_Change_Control_Record.docx"),
    ("07_Stakeholder_Acceptance_Signoff.md", "07_Stakeholder_Acceptance_Signoff.docx"),
    ("08_Presentation_Slide_Deck.md", "08_Presentation_Slide_Deck.docx"),
]


def set_doc_defaults(doc: Document) -> None:
    section = doc.sections[0]
    section.top_margin = Cm(2)
    section.bottom_margin = Cm(2)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2)
    style = doc.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(12)


def add_md_table(doc: Document, rows: list[list[str]]) -> None:
    if not rows:
        return
    cols = max(len(r) for r in rows)
    table = doc.add_table(rows=len(rows), cols=cols)
    table.style = "Table Grid"
    for i, row in enumerate(rows):
        for j in range(cols):
            cell = table.rows[i].cells[j]
            cell.text = row[j] if j < len(row) else ""
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.size = Pt(10)
                    run.font.name = "Times New Roman"
                    if i == 0:
                        run.bold = True


def flush_table(doc: Document, buf: list[str]) -> None:
    rows: list[list[str]] = []
    for line in buf:
        if re.match(r"^\|?\s*-{3,}", line.replace("|", " ").strip()) or set(line.strip()) <= set("|-: "):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if cells:
            rows.append(cells)
    add_md_table(doc, rows)


def md_to_docx(src: Path, dest: Path) -> None:
    text = src.read_text(encoding="utf-8")
    doc = Document()
    set_doc_defaults(doc)
    table_buf: list[str] = []
    in_code = False
    code_lines: list[str] = []

    def flush_code() -> None:
        nonlocal code_lines
        if not code_lines:
            return
        p = doc.add_paragraph()
        run = p.add_run("\n".join(code_lines))
        run.font.name = "Consolas"
        run.font.size = Pt(9)
        code_lines = []

    for raw in text.splitlines():
        line = raw.rstrip()

        if line.startswith("```"):
            if in_code:
                flush_code()
                in_code = False
            else:
                if table_buf:
                    flush_table(doc, table_buf)
                    table_buf = []
                in_code = True
            continue

        if in_code:
            code_lines.append(line)
            continue

        if line.strip().startswith("|"):
            table_buf.append(line)
            continue
        if table_buf:
            flush_table(doc, table_buf)
            table_buf = []

        if not line.strip():
            continue

        if line.startswith("# "):
            p = doc.add_heading(line[2:].strip(), level=0)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif line.startswith("## "):
            doc.add_heading(line[3:].strip(), level=1)
        elif line.startswith("### "):
            doc.add_heading(line[4:].strip(), level=2)
        elif line.startswith("> "):
            p = doc.add_paragraph(line[2:].strip())
            p.runs[0].italic = True if p.runs else None
            if not p.runs:
                p.add_run(line[2:].strip()).italic = True
        elif re.match(r"^[-*] ", line):
            doc.add_paragraph(line[2:].strip(), style="List Bullet")
        elif re.match(r"^\d+\.\s", line):
            doc.add_paragraph(re.sub(r"^\d+\.\s", "", line), style="List Number")
        else:
            # strip simple bold/italic markers for readability
            clean = re.sub(r"\*\*(.+?)\*\*", r"\1", line)
            clean = re.sub(r"`([^`]+)`", r"\1", clean)
            doc.add_paragraph(clean)

    if table_buf:
        flush_table(doc, table_buf)
    if code_lines:
        flush_code()

    try:
        doc.save(dest)
        print(f"OK  {dest.name}")
    except PermissionError:
        alt = dest.with_name(dest.stem + "_chia_deu" + dest.suffix)
        doc.save(alt)
        print(f"OK (file đang mở trong Word, đã lưu bản mới): {alt.name}")


def csv_to_xlsx(src: Path, dest: Path) -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = "Risk_Register"
    header_fill = PatternFill("solid", fgColor="1F4E79")
    header_font = Font(bold=True, color="FFFFFF", name="Calibri", size=11)
    with src.open(encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        for r_idx, row in enumerate(reader, start=1):
            for c_idx, val in enumerate(row, start=1):
                cell = ws.cell(row=r_idx, column=c_idx, value=val)
                cell.alignment = Alignment(wrap_text=True, vertical="top")
                if r_idx == 1:
                    cell.fill = header_fill
                    cell.font = header_font
    for col in ws.columns:
        max_len = 0
        letter = col[0].column_letter
        for cell in col:
            max_len = max(max_len, len(str(cell.value or "")))
        ws.column_dimensions[letter].width = min(max(12, max_len + 2), 40)
    ws.freeze_panes = "B2"
    try:
        wb.save(dest)
        print(f"OK  {dest.name}")
    except PermissionError:
        alt = dest.with_name(dest.stem + "_chia_deu" + dest.suffix)
        wb.save(alt)
        print(f"OK (file đang mở trong Excel, đã lưu bản mới): {alt.name}")


def main() -> None:
    for md_name, docx_name in MD_FILES:
        md_to_docx(ROOT / md_name, OUT / docx_name)
    csv_to_xlsx(ROOT / "04_Risk_Register_Evolution.csv", OUT / "04_Risk_Register_Evolution.xlsx")
    # short readme in folder
    readme = Document()
    set_doc_defaults(readme)
    readme.add_heading("Huong dan nop Google Drive", level=0)
    for line in [
        "1. Mo tung file .docx, dien ten/MSSV/chu ky.",
        "2. File -> Save As / Export PDF (dung ten file thay yeu cau).",
        "3. File 04 giu .xlsx (hoac Export PDF bang neu can).",
        "4. Upload vao thu muc Drive, bat Anyone with the link can view.",
        "5. Slide: copy noi dung 08 vao PowerPoint/Google Slides roi export PDF.",
    ]:
        readme.add_paragraph(line, style="List Number")
    readme.save(OUT / "00_HUONG_DAN_NOP.docx")
    print(f"DONE -> {OUT}")


if __name__ == "__main__":
    main()
