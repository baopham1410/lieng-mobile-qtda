# PROJECT CHARTER — Lieng Mobile (QLDA)

**Ma du an:** LIENG-MOBILE-QLDA  
**Mon:** Quan tri du an phan mem (VKU)  
**Sourcing Pathway:** Pathway 1 — Ke thua / song hanh do an chuyen nganh (Web + Mobile)  
**Ngay hieu luc:** 05/10/2026  
**Trang thai:** Approved (draft cho ky)

---

## 1. Ten du an & muc tieu

Xay dung he thong quan ly cua hang dien thoai **Lieng Mobile**, tich hop huong de tai chuyen nganh: **AI ho tro tham dinh va dinh gia thu mua dien thoai cu** (O2O: cong Public + Admin/POS).

**Hai lop gia tri:**
1. **Van hanh cua hang** — Admin/POS/Quan web + API + Mobile Expo.  
2. **AI dinh gia thu mua may cu** — YOLO (loi ngoai quan) + OCR (model/ROM/pin) + cong thuc gia dong + QR/phieu thu mua; kem **chatbot noi bo** Admin (RAG).

## 2. Sourcing Pathway & Stakeholder

| Muc | Noi dung |
|-----|----------|
| Pathway | 1 — Song hanh do an chuyen nganh |
| Product Owner / Stakeholder nghiem thu | Giang vien huong dan chuyen nganh + chu cua hang Lieng Mobile (nguoi dung thu) |
| Client dai dien | Bao (PM) lien lac Stakeholder |

## 3. Van de nghiep vu

1. Van hanh: kho/POS/bao cao/Quan manh mun, thieu he thong tap trung.  
2. Thu mua may cu: dinh gia cam tinh, lech chi nhanh, rut ro mua may loi, khach mat niem tin (theo de cuong AI).  
3. Nhan vien moi thieu tro ly noi bo → can chatbot Admin.

## 4. Pham vi (In / Out)

**In-Scope (baseline da/ dang lam):** Auth Sanctum; catalog; nhap kho; POS/don/KH/finance; Quan web; bao cao/BH/user; mobile Expo co ban; CI/docs QLDA.

**In-Scope (da dua vao Charter — CHUA HOAN THANH, xem CR-004):**  
- Cong Public: chup anh / touch test / bao gia uoc luong + ma dinh gia/QR.  
- Admin: quet ma, AI khoanh loi, phieu thu mua, kho hang cu.  
- AI: YOLOv8/11 detect loi; OCR model/ROM/pin; cong thuc `P = P0 - C_ngoai quan - C_linh kien - M`.  
- Chatbot noi bo Admin (RAG + tool bao cao).  
- Toi uu UI/luong + hoan thien Mobile.

**Out-of-Scope:** App Store release; kiosk tu dong; Zalo bot khach; multi-tenant; thanh toan online day du.

## 5. Muc tieu SMART

| # | Muc tieu |
|---|----------|
| S | Baseline van hanh chay that + MVP AI dinh gia (OCR/rule → YOLO) + chatbot Admin |
| M | Baseline UI/API; demo AI dinh gia < 2 phut/may; chatbot tra loi >= 5 cau mau |
| A | 3 thanh vien (Bao/Hong/Giang), monorepo GitHub |
| R | Giam dinh gia cam tinh; minh chung QLDA + de tai AI |
| T | Baseline QLDA truoc bao ve; AI MVP theo Sprint S7–S10 |

## 6. Rang buoc & gia dinh

- Rang buoc: dung GitHub Ecosystem (Issues, PR, Projects, Actions); Conventional Commits; peer review.
- Gia dinh: Neon PostgreSQL kha dung; Stakeholder phan hoi trong 3 ngay lam viec.
- Hang so: thoi gian mon hoc; thanh vien ban dau 3, sau do Giang rut khoi coding active.

## 7. Cong cu quan tri (Muc 7 Charter)

GitHub Repository `baopham1410/lieng-mobile-qtda` (public), GitHub Projects Kanban, Issues, PRs, Actions CI, Branch protection `main`.

## 8. Milestone chinh

1. Monorepo + Backend API auth/Quan  
2. Frontend foundation + man Admin/POS/Quan  
3. Mobile Expo core + statement  
4. CI/CD + Docker + goi bang chung  

## 9. Ngan sach / nguon luc

Chi phi cloud (Neon/free tier), thoi gian nhom ~8–12 gio/tuan/nguoi. Khong ngan sach phan mem ban quyen ngoai GitHub Free/Education.

## 10. To chuc & 5 vai tro

| Vai tro chuan | Phu trach | % dong gop (quy doi) |
|---------------|-----------|----------------------|
| PM / Scrum Master | Bao (`baopham1410`) | 20% |
| Tech Lead / Architect | Bao | 15% |
| Backend Engineer | Bao | 20% |
| Frontend / Mobile Engineer | Hong (`Chimsedinang605`) + Bao (mobile core) | 30% |
| QA & Test / AI data & UAT | Hong + Giang (`ktlgiang`) | 15% |

**Ty le huong toi (khi Giang tham gia lai AI/UAT):** Bao ~50% · Hong ~35% · Giang ~15%.  
**Thuc te giai doan baseline code:** Bao ~55% · Hong ~45% (Giang rut coding — CR-002); Sprint AI se phan lai.

## 11. Rui ro ban dau (tom tat)

Thanh vien rut; scope creep UI; CI thieu; DB Neon/SSL; tre peer review.

## 12. Tieu chi thanh cong / DoD du an

- San pham chay local + (uu tien) cloud HTTPS.  
- Moi code vao `main` qua PR, CI xanh, >=1 approve.  
- Co goi 8 file bang chung + slide.  
- Co bien ban nghiem thu Stakeholder.

## 13. Phe duyet

| Vai | Ho ten | Chu ky | Ngay |
|-----|--------|--------|------|
| Project Lead | Bao | __________ | __/__/____ |
| Thanh vien | Nguyen Hong | __________ | __/__/____ |
| Product Owner / Stakeholder | __________ | __________ | __/__/____ |
| Giang vien QLDA | TS. Nguyen Thanh Tuan | __________ | __/__/____ |
