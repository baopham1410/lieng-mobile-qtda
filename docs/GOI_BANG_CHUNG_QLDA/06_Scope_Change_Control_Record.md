# Scope Change Control Record (CCB)

**Du an:** Lieng Mobile QLDA  
**CCB:** Bao (PM/Tech Lead), Hong (FE/Mobile), Stakeholder (tham van khi can)

Moi thay doi pham vi so voi Charter/WBS baseline deu ghi nhan CR duoi day.

---

## CR-001 — Frontend PR3 chi giu foundation (Approved)

| Truong | Noi dung |
|--------|----------|
| Ngay de xuat | 01/11/2026 |
| Nguoi de xuat | Bao (Tech Lead) |
| Ly do | PR FE init da mang theo nhieu man UI → pham muc tieu “nen tang”, kho review, trung viec Hong |
| Mo ta thay doi | **Thu hep:** PR3 chi giu Vue/Vite/layouts/Tailwind + **stub** man; UI that day bang PR Issue rieng |
| Anh huong schedule | +1 PR fix (#79); Sprint FE keo dai theo Issue nhung ro DoD hon |
| Anh huong effort | Bao: fix stub; Hong/Bao: implement man theo Issue |
| Quyet dinh CCB | **Approved** |
| Minh chung | PR #79 `fix(frontend): PR3 chi giu nen tang, stub UI...` |
| Cap nhat baseline | WBS 1.3.2 them; Out: khong merge full UI trong foundation |

---

## CR-002 — Giang rut khoi thuc thi coding (Approved)

| Truong | Noi dung |
|--------|----------|
| Ngay de xuat | ~01–02/11/2026 |
| Nguoi de xuat | Bao (PM) |
| Ly do | Thanh vien Giang (`ktlgiang`) khong tiep tuc coding active; Issue mobile van gan ten Giang |
| Mo ta thay doi | **Phan lai nguon luc:** Hong/Bao nhan man mobile con lai; giu collaborator neu can minh chung lich su |
| Anh huong | Tang workload Hong/Bao; % dong gop cap nhat Bao 55% / Hong 45% |
| Quyet dinh CCB | **Approved** |
| Minh chung | PR #86 (Bao mobile core), PR #87 (Hong statement bundle closes #71–74) |
| Cap nhat baseline | Charter muc 10; Risk R-03 Closed/Mitigated |

---

## CR-003 — Public repo + bat Branch Protection & CI bat buoc (Approved)

| Truong | Noi dung |
|--------|----------|
| Ngay de xuat | 02/11/2026 |
| Nguoi de xuat | Bao |
| Ly do | Thay yeu cau Branch Protection; GitHub Free khong bat duoc tren private |
| Mo ta thay doi | Doi visibility **PUBLIC**; bat require PR + 1 approve + 3 CI checks; them templates/CODEOWNERS |
| Anh huong | Moi PR can Hong↔Bao review; khong merge khi CI do |
| Quyet dinh CCB | **Approved** |
| Minh chung | Repo PUBLIC; PR #90 Actions; PR #91 templates (Hong Approved) |
| Cap nhat baseline | Charter muc 7; WBS 1.5.2–1.5.3 Done |

---

## CR-004 — Mo rong pham vi theo de cuong AI tham dinh dinh gia (Approved)

| Truong | Noi dung |
|--------|----------|
| Ngay de xuat | 05/11/2026 |
| Nguoi de xuat | Bao (PM) + nhom |
| Ly do | De cuong chuyen nganh: AI tham dinh/dinh gia thu mua DT cu; baseline QLDA moi co van hanh cua hang, **chua** AI/chatbot/toi uu UI-mobile |
| Mo ta thay doi | **Mo rong In-Scope:** Public O2O, YOLO+OCR+cong thuc gia, Admin thu mua/kho cu, chatbot Admin, toi uu UI, hoan thien Mobile (WBS 1.7) |
| Anh huong | Them Sprint S5–S10; tang SP ~40+; can Giang tham gia AI data/UAT |
| Quyet dinh CCB | **Approved** (dua vao Charter/WBS; **chua** coi la Done) |
| Minh chung | De cuong DOCX; `00_Trang_Thai_Va_Ke_Hoach_AI.md` |
| Cap nhat baseline | Charter muc 1/4/5; WBS 1.7; Risk R-11..R-14 |

---

## Bang tong hop

| CR | Tieu de | Quyet dinh | Evidence |
|----|---------|------------|----------|
| CR-001 | Foundation-only FE | Approved | PR #79 |
| CR-002 | Giang rut / phan lai | Approved | PR #86, #87 |
| CR-003 | Public + protection + CI | Approved | PR #90, #91 |
| CR-004 | Mo rong AI dinh gia + chatbot | Approved (chua Done) | De cuong AI + file 00 |

**Chu ky CCB**

| Vai | Chu ky | Ngay |
|-----|--------|------|
| PM (Bao) | __________ | __/__/____ |
| FE Lead (Hong) | __________ | __/__/____ |
