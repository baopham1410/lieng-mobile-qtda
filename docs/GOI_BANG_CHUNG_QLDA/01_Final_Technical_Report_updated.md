# BAO CAO TONG KET KY THUAT  
## Du an Lieng Mobile — Quan tri du an phan mem (QLDA)

**Nhom:** Bao (`baopham1410`), Hong (`Chimsedinang605`)  
**Repo:** https://github.com/baopham1410/lieng-mobile-qtda  
**Projects:** https://github.com/users/baopham1410/projects/1  
**Pathway:** 1 — Song hanh do an chuyen nganh  
**Phien ban:** 1.0 (draft — viet thi qua khu)

> Van phong: toan bo bao cao mo ta viec **da xay ra**. Khong dung thi tuong lai.

---

# Chuong 1. Tong quan du an & Boi canh nghiep vu

## 1.1. Boi canh

Lieng Mobile la cua hang kinh doanh dien thoai / phu kien. Truoc du an, viec quan ly kho, ban hang, bao cao va chi phi Quan con manh mun (Excel / thao tac thu cong), kho dong bo giua nhan vien cua hang va Quan.

## 1.2. Van de cot loi

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
| T | Baseline local OK; Sprint AI S7–S10 **con lai** |

---

# Chuong 2. Phuong phap luan & Co cau quan tri

## 2.1. Lua chon Hybrid Scrum–Kanban

Nhom **da chon Hybrid**:

- **Scrum:** Sprint ngan, Issue = User Story / man hinh, Planning qua Milestone, Retro.  
- **Kanban:** GitHub Projects cot `Backlog → Ready → In Progress → In Review → Done`.

**Ly do da ap dung:** Pathway 1 doi hoi linh hoat khi pham vi UI thay doi (CR-001 foundation-only); thanh vien rut (CR-002); can thay trang thai cong viec hang ngay tren board, khong chi ke hoach Waterfall cung.

## 2.2. Co cau 5 vai tro & % dong gop

| Vai tro | Nguoi | % |
|---------|-------|---|
| PM / Scrum Master | Bao | 20 |
| Tech Lead / Architect | Bao | 15 |
| Backend Engineer | Bao | 20 |
| Frontend / Mobile | Hong (chinh) + Bao (mobile core) | 35 |
| QA & Test / DoD | Hong + Bao (Actions) | 10 |

**Ty le ca nhan quy doi:** Bao **55%** · Hong **45%**.  
Giang da duoc phan cong man mobile o giai dau nhung **khong con dong gop coding** sau CR-002; ti le khong tinh vao cot moc cuoi.

## 2.3. Quy tac quan tri da van hanh

Issue → nhanh `feature/...` → PR + self-test → peer Approve → CI xanh → merge `main`. Branch protection bat buoc 1 approve + 3 status checks.

---

# Chuong 3. Duong co so pham vi, WBS & Tu dien WBS

## 3.1. Scope baseline

Xem chi tiet tai `03_WBS_and_WBS_Dictionary.md`. Tom tat:

**In-Scope da/dang lam:** Auth, catalog, nhap kho, POS/orders/customers/finance, Quan web, reports/warranty/users, mobile Expo co ban, Docker, CI, docs.  
**In-Scope chua hoan thanh (CR-004):** AI dinh gia O2O (Public+Admin), YOLO+OCR+cong thuc gia, chatbot Admin, toi uu UI, hoan thien mobile.  
**Out-of-Scope:** App Store, kiosk tu dong, Zalo bot khach, multi-tenant.

## 3.2. Cay WBS (100% Rule — muc 1)

```
1. Lieng Mobile QLDA
├── 1.1 Khoi tao & quan tri
├── 1.2 Backend API
├── 1.3 Frontend Web
├── 1.4 Mobile Expo
├── 1.5 Chat luong & DevOps
└── 1.6 Dong du an & bang chung
```

Moi goi 1.x duoc pha xuong goi 1–2 tuan trong file 03.

---

# Chuong 4. Uoc luong, Lich trinh & Velocity

## 4.1. Uoc luong

Nhom da uoc luong bang **Story Points** (Planning Poker don gian: 1 / 2 / 3 / 5).  
Vi du: 1 man Vue trung binh = 3 SP; man foundation = 5 SP; man mobile = 3 SP; CI workflow = 2 SP.

## 4.2. Lich trinh / duong gang (CPM — tom tat)

Duong gang thuc te nhom da di:

`Monorepo (#76) → Backend API (#77) → FE foundation (#78/#79) → Man FE song song Bao|Hong → Mobile (#86/#87) → Docs/Docker/CI (#88–#90)`

Nut that co thoi gian: **Backend truoc FE that**; **FE foundation truoc man chi tiet** (sau CR-001).

## 4.3. Velocity quan sat

| Dot | Noi dung chinh | PR merged (minh chung) | Nhan xet |
|-----|----------------|------------------------|----------|
| Sprint 0–1 | Scaffold + API + FE foundation | #76–#79 | Setup nang |
| Sprint 2 | Man Admin/POS/Quan web | #80–#85 | Throughput cao (song song Bao/Hong) |
| Sprint 3 | Mobile | #86–#87 | Hong + Bao |
| Sprint 4 | Docs, Docker, CI, ecosystem | #88–#91 | Chat luong / QLDA |

Velocity tang o Sprint 2 khi foundation on dinh; Sprint 4 giam feature, tang process (dung muc tieu mon QLDA).

---

# Chuong 5. Thuc thi, Kiem thu, CI/CD & DoD

## 5.1. Lich su thuc thi GitHub

- Repo public, Conventional Commits (`feat:`, `fix:`, `docs:`, `ci:`, `chore:`, `test:`).  
- Hang loat PR co linked Issues (vd. #80 closes #58; #87 closes #71–#74).  
- Peer review: Hong Approve PR #91; branch protection require 1 review.

## 5.2. Kiem thu

- Backend: PHPUnit (`tests/Unit`, `tests/Feature`) chay tren CI.  
- Frontend: `npm run build` tren CI.  
- Mobile: `tsc --noEmit` tren CI.  
- Smoke local: FE `/`, `/login` 200; `POST /api/v1/auth/login` 200; catalog 200.

## 5.3. CI/CD

Workflow `.github/workflows/ci.yml` (PR #90) chay tren moi PR/push `main`: Frontend, Backend, Mobile. Nhom da demo CI do → sua → xanh (commit demo tren nhanh CI).

## 5.4. Definition of Done (da ap dung)

- [x] Code tren PR, khong push thang `main` (sau khi bat protection)  
- [x] Self-test notes tren PR  
- [x] Peer Approve  
- [x] CI 3 job xanh  
- [x] Issue/Project cap nhat Done  

---

# Chuong 6. Quan tri rui ro & Kiem soat thay doi pham vi

## 6.1. Risk Register

Chi tiet cot Sprint 1 / Sprint 2: file `04_Risk_Register_Evolution.csv`.

Rui ro da xay ra va xu ly:

| ID | Rui ro | Xu ly |
|----|--------|-------|
| R-02 | Scope creep FE full UI trong PR foundation | CR-001: chi giu nen tang, stub UI (PR #79) |
| R-03 | Thanh vien rut | CR-002: Hong/Bao nhan viec Giang |
| R-05 | Thieu CI | PR #90 Actions |
| R-06 | Private repo khong bat branch protection | Public repo + protection |

## 6.2. Change Request

Xem `06_Scope_Change_Control_Record.md` (CR-001, CR-002, CR-003).

---

# Chuong 7. Nghiem thu, Dong du an & Bai hoc

## 7.1. UAT / Nghiem thu

Checklist UAT va mau bien ban: `07_Stakeholder_Acceptance_Signoff.md`.  
Nhom da chuan bi luong login → catalog/POS/Quan → mobile co ban de Stakeholder ky.

## 7.2. Bai hoc (Lessons Learned)

1. **Pham vi:** Tach foundation khoi UI day du som tranh phai rollback (CR-001).  
2. **Nhan su:** Phai co ke hoach backup khi thanh vien rut (CR-002).  
3. **Chat luong:** CI + branch protection som se giam “dump merge”.  
4. **Uoc luong:** Man UI song song dat velocity cao hon khi API/foundation san.  
5. **Minh chung QLDA:** Board + PR approve + Actions la bang chung manh hon chi slide.

## 7.3. Dong du an (ky thuat) — trang thai that

Nhom **chua dong** san pham theo de cuong AI. Moi dong duoc:

- Baseline van hanh + quy trinh QLDA tren `main`  
- Goi bang chung draft (co cap nhat pham vi AI)  

**Con bat buoc:** toi uu UI/luong, hoan thien mobile, AI dinh gia MVP, chatbot, deploy cloud, UAT + chu ky Stakeholder.

---

## Phu luc

- A. Link repo, Projects, Actions  
- B. Danh sach PR #76–#91  
- C. Tham chieu Charter, WBS, Risk, CR, Retro, Slide  

**Nguoi lap bao cao:** Bao (PM) · **Dong gop:** Hong  
**Ngay:** 05/11/2026
