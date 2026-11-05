# PROJECT CHARTER — Lieng Mobile (QLDA)

**Ma du an:** LIENG-MOBILE-QLDA  
**Mon:** Quan tri du an phan mem (VKU)  
**Sourcing Pathway:** Pathway 1 — Ke thua / song hanh do an chuyen nganh (Web + Mobile)  
**Ngay hieu luc:** 05/10/2026  
**Trang thai:** Approved (draft cho ky)

---

## 1. Ten du an & muc tieu

Xay dung he thong quan ly cua hang dien thoai **Lieng Mobile**: Admin/POS web (Vue 3) + API Laravel/Sanctum + ung dung Quan (Expo), phuc vu nhap-xuat-ton, ban hang, quan ly chi phi Quan, dong bo du lieu thuc.

## 2. Sourcing Pathway & Stakeholder

| Muc | Noi dung |
|-----|----------|
| Pathway | 1 — Song hanh do an chuyen nganh |
| Product Owner / Stakeholder nghiem thu | Giang vien huong dan chuyen nganh + chu cua hang Lieng Mobile (nguoi dung thu) |
| Client dai dien | Bao (PM) lien lac Stakeholder |

## 3. Van de nghiep vu

Cua hang quan ly bang thu cong / Excel manh mun: kho, don hang, bao cao, chi phi Quan kho dong bo giua web va dien thoai. Can he thong chay that, co API, co phan quyen.

## 4. Pham vi (In / Out)

**In-Scope:** Auth Sanctum; catalog SP/DM; nhap kho; POS/don hang/KH/tai chinh; module Quan (bang, sao ke, chi phi); bao cao; bao hanh; user/role; mobile Expo (login, quay, chi, archive, account, statement); CI GitHub Actions; docs QTDA.

**Out-of-Scope (ban dau):** Thanh toan online day du; AI chatbot production; da ngon ngu day du; App Store release; scaling multi-tenant.

## 5. Muc tieu SMART

| # | Muc tieu |
|---|----------|
| S | Giao duoc ban Admin + Quan web + Mobile core chay voi API that |
| M | >= 15 man hinh/web modules co UI; API auth + catalog/quan; CI 3 job xanh |
| A | 2–3 thanh vien, monorepo GitHub, Sprint 1–2 tuan |
| R | Phuc vu van hanh cua hang that + minh chung QLDA |
| T | Hoan thanh baseline truoc bao ve cuoi ky (Tuan 14–15) |

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
| Frontend / Mobile Engineer | Hong (`Chimsedinang605`) + Bao (mobile core) | 35% |
| QA & Test Engineer | Hong + Bao (CI/DoD) | 10% |

**Tong:** Bao ~55% · Hong ~45%.  
**Giang (`ktlgiang`):** tham gia giai doan phan cong man hinh ban dau; sau do rut khoi thuc thi (xem CR-002).

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
