# -*- coding: utf-8 -*-
from pathlib import Path

root = Path(__file__).resolve().parent
src = root / "01_Final_Technical_Report.md"
alt = root / "01_Final_Technical_Report_updated.md"
t = src.read_text(encoding="utf-8")

replacements = [
    (
        """## 1.2. Van de cot loi

1. Thieu he thong tap trung co API.  
2. Thieu phan quyen Admin / Nhan vien / Quan.  
3. Thieu ung dung di dong cho Quan theo doi sao ke / chi phi.  
4. Thieu quy trinh phan mem chuyen nghiep (Issue → PR → CI) de minh chung mon QLDA.

## 1.3. Giai phap da trien khai

Nhom da xay monorepo:

- **Backend:** Laravel 9 + Sanctum + Neon PostgreSQL  
- **Frontend:** Vue 3 + Vite + Pinia + Tailwind (Admin, POS, Quan)  
- **Mobile:** Expo (React Native) — login, quay, ghi chi, archive, account, statement  

## 1.4. Muc tieu SMART (da dat / dat mot phan)

| SMART | Ket qua thuc te |
|-------|-----------------|
| S | Da giao Admin/POS/Quan web + Mobile core |
| M | Hang chuc Issue man hinh dong; PR #76–#91 merged; CI 3 job |
| A | 2 thanh vien active sau khi Giang rut |
| R | Phuc vu van hanh cua hang + minh chung QLDA Pathway 1 |
| T | Baseline chay local da xac nhan (FE :5173, API :8080, login demo OK) |""",
        """## 1.2. Van de cot loi

1. Thieu he thong tap trung co API / phan quyen.  
2. Thieu mobile on dinh cho Quan / nhan vien.  
3. **Thu mua may cu:** dinh gia cam tinh, lech chi nhanh, rut ro may loi, khach mat niem tin (de cuong AI).  
4. Thieu chatbot noi bo tro giup nhan vien.  
5. Can quy trinh QLDA (Issue → PR → CI).

## 1.3. Giai phap — phan da trien khai vs con thieu

**Da co (baseline van hanh):**

- Backend Laravel 9 + Sanctum + Neon  
- Frontend Vue 3 Admin/POS/Quan (UI **chua toi uu het luong**)  
- Mobile Expo **man co ban** (chua xong/on dinh)  
- GitHub Actions + Projects  

**Chua lam (theo de cuong AI — bat buoc tiep):**

- Cong Public tu chan doan + QR  
- YOLOv8/11 detect nut/xuoc + OCR model/ROM/pin  
- Cong thuc dinh gia dong + phieu thu mua / kho hang cu  
- Chatbot Admin RAG + Ollama  

Chi tiet ke hoach: file 00_Trang_Thai_Va_Ke_Hoach_AI.md.

## 1.4. Muc tieu SMART (trang thai)

| SMART | Ket qua thuc te |
|-------|-----------------|
| S | Baseline van hanh **co**; AI dinh gia + chatbot **chua** |
| M | PR #76–#91; CI xanh; AI MVP **chua do** |
| A | Bao+Hong coding; Giang trong de cuong, rut coding (CR-002) |
| R | QLDA process **dat**; gia tri AI de cuong **chua dat** |
| T | Baseline local OK; Sprint AI S7–S10 **con lai** |""",
    ),
    (
        """**In-Scope:** Auth, catalog, nhap kho, POS/orders/customers/finance, Quan web, reports/warranty/users, mobile Expo modules, Docker Compose, CI, docs QTDA.  
**Out-of-Scope:** App Store production, AI chatbot production, da tenant, payment gateway day du.""",
        """**In-Scope da/dang lam:** Auth, catalog, nhap kho, POS/orders/customers/finance, Quan web, reports/warranty/users, mobile Expo co ban, Docker, CI, docs.  
**In-Scope chua hoan thanh (CR-004):** AI dinh gia O2O (Public+Admin), YOLO+OCR+cong thuc gia, chatbot Admin, toi uu UI, hoan thien mobile.  
**Out-of-Scope:** App Store, kiosk tu dong, Zalo bot khach, multi-tenant.""",
    ),
    (
        """## 7.3. Dong du an (ky thuat)

Baseline code tren `main`; goi bang chung draft trong `docs/GOI_BANG_CHUNG_QLDA/`; con lai: deploy cloud HTTPS (neu chua), chu ky Stakeholder/GV, export PDF len Drive.""",
        """## 7.3. Dong du an (ky thuat) — trang thai that

Nhom **chua dong** san pham theo de cuong AI. Moi dong duoc:

- Baseline van hanh + quy trinh QLDA tren `main`  
- Goi bang chung draft (co cap nhat pham vi AI)  

**Con bat buoc:** toi uu UI/luong, hoan thien mobile, AI dinh gia MVP, chatbot, deploy cloud, UAT + chu ky Stakeholder.""",
    ),
]

for i, (old, new) in enumerate(replacements, 1):
    if old not in t:
        raise SystemExit(f"block {i} not found")
    t = t.replace(old, new)

alt.write_text(t, encoding="utf-8")
print("wrote", alt)
