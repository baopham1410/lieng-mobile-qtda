"""Intent detection + rich UI blocks (actions / chips / contact)."""

from __future__ import annotations

import re


def detect_intent(collection: str, question: str) -> str:
    q = question.lower()

    if collection == "kb_public":
        if re.search(r"hotline|gọi|goi|sđt|sdt|zalo|liên hệ|lien he|địa chỉ|dia chi|ở đâu|o dau", q):
            return "contact"
        if re.search(r"giờ|gio|mở cửa|mo cua|làm việc|lam viec", q):
            return "hours"
        if re.search(r"bảo hành|bao hanh|bh\b|warranty", q):
            return "warranty_public"
        if re.search(r"thu cũ|thu cu|đổi mới|doi moi|thẩm định|tham dinh", q):
            return "trade_in"
        return "faq"

    # admin
    if re.search(
        r"hết hàng|het hang|hết máy|het may|tồn\s*=\s*0|ton\s*=\s*0|out of stock|"
        r"không còn|khong con|tồn kho|ton kho|sắp hết|sap het|tồn thấp|ton thap",
        q,
    ):
        return "stock"
    if re.search(r"nhập kho|nhap kho|imei|phiếu nhập|phieu nhap", q):
        return "stock_import"
    if re.search(r"\bpos\b|bán hàng|ban hang|thanh toán|thanh toan|payos", q):
        return "pos"
    if re.search(r"bảo hành|bao hanh|tra imei|warranty", q):
        return "warranty"
    if re.search(r"thẩm định|tham dinh|autograde|thu cũ|thu cu", q):
        return "appraisal"
    if re.search(r"tư vấn|tu van|hotline|tiếp nhận|tiep nhan", q):
        return "consult"
    if re.search(r"doanh thu|báo cáo|bao cao|dashboard|thu chi", q):
        return "reports"
    if re.search(r"quyền|quyen|role|nhân viên|nhan vien", q):
        return "roles"
    return "howto"


def build_blocks(collection: str, intent: str) -> list[dict]:
    """Default rich blocks (Laravel may prepend table for stock)."""
    if collection == "kb_public":
        return _public_blocks(intent)
    return _admin_blocks(intent)


def _actions(items: list[dict]) -> dict:
    return {"type": "actions", "items": items}


def _chips(items: list[str]) -> dict:
    return {"type": "chips", "items": items}


def _public_blocks(intent: str) -> list[dict]:
    contact = {
        "type": "contact",
        "hotline": "0383435600",
        "hotline_display": "0383 435 600",
        "zalo": "0901 234 567",
    }
    if intent in ("contact", "hours"):
        return [
            contact,
            _actions(
                [
                    {"label": "Gọi ngay", "href": "tel:0383435600"},
                    {"label": "Zalo", "href": "https://zalo.me/0901234567"},
                ]
            ),
            _chips(["Có thu cũ không?", "Bảo hành thế nào?", "Giờ mở cửa?"]),
        ]
    if intent == "warranty_public":
        return [
            _actions([{"label": "Gọi hotline", "href": "tel:0383435600"}]),
            _chips(["Giờ mở cửa?", "Thu cũ đổi mới?", "Địa chỉ cửa hàng?"]),
        ]
    if intent == "trade_in":
        return [
            _actions(
                [
                    {"label": "Gọi tư vấn", "href": "tel:0383435600"},
                    {"label": "Xem trang chủ", "href": "/#dich-vu"},
                ]
            ),
            _chips(["Hotline?", "Bảo hành thế nào?"]),
        ]
    return [
        _actions([{"label": "Gọi hotline", "href": "tel:0383435600"}]),
        _chips(["Giờ mở cửa?", "Hotline?", "Có thu cũ không?"]),
    ]


def _admin_blocks(intent: str) -> list[dict]:
    mapping = {
        "stock": [
            _actions(
                [
                    {"label": "Mở Sản phẩm", "to": "/products"},
                    {"label": "Tạo nhập kho", "to": "/inventory/imports"},
                ]
            ),
            _chips(["Tồn dưới 5 máy?", "Cách nhập IMEI?", "Mở POS?"]),
        ],
        "stock_import": [
            _actions(
                [
                    {"label": "Mở Nhập kho", "to": "/inventory/imports"},
                    {"label": "Mở Sản phẩm", "to": "/products"},
                ]
            ),
            _chips(["SP nào hết hàng?", "POS bán thế nào?"]),
        ],
        "pos": [
            _actions(
                [
                    {"label": "Mở POS", "to": "/pos"},
                    {"label": "Xem Đơn hàng", "to": "/orders"},
                ]
            ),
            _chips(["Nhập kho IMEI?", "Bảo hành tra sao?"]),
        ],
        "warranty": [
            _actions([{"label": "Mở Bảo hành", "to": "/warranty"}]),
            _chips(["Nhập kho IMEI?", "SP hết hàng?"]),
        ],
        "appraisal": [
            _actions([{"label": "Mở Thẩm định", "to": "/appraisal"}]),
            _chips(["Mở Tư vấn hotline?", "POS?"]),
        ],
        "consult": [
            _actions([{"label": "Mở Quầy tư vấn", "to": "/consult"}]),
            _chips(["Thẩm định AutoGrade?", "Hotline khách?"]),
        ],
        "reports": [
            _actions(
                [
                    {"label": "Dashboard", "to": "/dashboard"},
                    {"label": "Báo cáo", "to": "/reports"},
                    {"label": "Thu chi", "to": "/finance"},
                ]
            ),
            _chips(["SP hết hàng?", "Đơn pending?"]),
        ],
        "roles": [
            _chips(["Ai dùng POS?", "Ai nhập kho?", "Ai xem thu chi?"]),
        ],
        "howto": [
            _actions(
                [
                    {"label": "POS", "to": "/pos"},
                    {"label": "Nhập kho", "to": "/inventory/imports"},
                    {"label": "Bảo hành", "to": "/warranty"},
                ]
            ),
            _chips(["Nhập kho IMEI?", "SP hết hàng?", "POS thanh toán?"]),
        ],
    }
    return mapping.get(intent, mapping["howto"])
