# WBS & WBS Dictionary — Lieng Mobile QLDA

## 1. Cay WBS (100% Rule)

```
1. Lieng Mobile QLDA
├── 1.1 Khoi tao & quan tri du an
│   ├── 1.1.1 Project Charter & Pathway
│   ├── 1.1.2 Backlog Issues + Milestone
│   ├── 1.1.3 GitHub Projects Kanban
│   └── 1.1.4 Quy tac PR / Conventional Commits
├── 1.2 Backend API
│   ├── 1.2.1 Scaffold Laravel + Sanctum
│   ├── 1.2.2 Auth login/logout/me
│   ├── 1.2.3 Catalog / Products / Categories
│   ├── 1.2.4 Quan APIs (statements, costs…)
│   └── 1.2.5 Seed & cau hinh Neon/SQLite test
├── 1.3 Frontend Web
│   ├── 1.3.1 Init Vue3 + layouts + Tailwind
│   ├── 1.3.2 Foundation-only / stub (sau CR-001)
│   ├── 1.3.3 Intro + Auth + Profile
│   ├── 1.3.4 Admin catalog (Dashboard, SP, DM)
│   ├── 1.3.5 Ops (Nhap kho, Bao cao, User, BH, Lao)
│   ├── 1.3.6 POS + Orders + Customers + Finance
│   └── 1.3.7 Quan board + statements + costs
├── 1.4 Mobile Expo
│   ├── 1.4.1 Init Expo + navigation
│   ├── 1.4.2 Login + Quay + Ghi chi
│   └── 1.4.3 Archive + Account + Statement + Detail
├── 1.5 Chat luong & DevOps
│   ├── 1.5.1 PHPUnit + example tests
│   ├── 1.5.2 GitHub Actions CI (FE/BE/Mobile)
│   ├── 1.5.3 Branch protection + CODEOWNERS
│   ├── 1.5.4 Docker Compose
│   └── 1.5.5 Templates Issue/PR
└── 1.6 Dong du an & bang chung
    ├── 1.6.1 Bao cao 7 chuong
    ├── 1.6.2 Risk / Retro / CR / Signoff
    └── 1.6.3 Slide bao ve
```

## 2. Tu dien WBS (cac goi 1–2 tuan)

| WBS ID | Ten goi | Mo ta | DoD | SP | Owner | Minh chung |
|--------|---------|-------|-----|----|-------|------------|
| 1.1.2 | Backlog Issues | Tao Issue man hinh + Milestone | Issue co AC/checklist, label, milestone | 3 | Bao | Milestone “Phan cong man hinh” |
| 1.2.1–1.2.4 | Backend API | Laravel API auth + Quan | PR merged, login API 200 | 8 | Bao | PR #77 |
| 1.3.1–1.3.2 | FE foundation | Vite/Vue/layouts; stub sau CR | PR #78+#79 | 5 | Bao | PR #78, #79 |
| 1.3.3 | Intro/Auth/Profile | UI Hong | closes Issues | 5 | Hong | PR #80, #81 |
| 1.3.4 | Admin catalog | Dashboard/SP/DM | UI + route | 5 | Bao | PR #82 |
| 1.3.5 | Admin ops | Nhap kho/BC/NV/BH/Lao | UI | 5 | Bao | PR #85 |
| 1.3.6 | POS bundle | POS/Orders/KH/Finance | closes #60–63 | 8 | Hong | PR #83 |
| 1.3.7 | Quan web | Board/statements/costs | closes #64–66 | 5 | Hong | PR #84 |
| 1.4.2 | Mobile core | Login/Quay/Chi | Expo chay | 5 | Bao | PR #86 |
| 1.4.3 | Mobile statement | Archive/Account/Statement | closes #71–74 | 5 | Hong | PR #87 |
| 1.5.2–1.5.3 | CI + protection | Actions + protect main | 3 job xanh | 3 | Bao | PR #90, #91 |
| 1.5.4 | Docker | Compose API | doc + compose | 2 | Bao | PR #89 |
| 1.6.* | Evidence package | 8 file Drive | draft trong docs/ | 5 | Bao+Hong | Thu muc nay |

## 3. In-Scope / Out-of-Scope (baseline)

Xem Charter muc 4. Moi thay doi sau baseline di qua CR (file 06).
