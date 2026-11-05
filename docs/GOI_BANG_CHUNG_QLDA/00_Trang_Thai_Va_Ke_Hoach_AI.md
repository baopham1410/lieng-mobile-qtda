# Trang thai san pham & ke hoach AI (ap dung de cuong)

**Nguon de cuong:** `Tong_Quan_De_Tai_AI_Tham_Dinh_Dinh_Gia_Dien_Thoai.docx`  
**Ten huong de tai chuyen nganh:** He thong AI ho tro tham dinh va dinh gia thu mua dien thoai cu  
**Nhom:** Pham Quoc Bao · Nguyen Thi Hong · Khong Thi Le Giang

---

## 1. Ket luan ngan (dung noi voi thay)

| Hang muc | Da xong? | Ghi chu |
|----------|----------|---------|
| Monorepo + API Laravel/Sanctum + FE Admin/POS/Quan (baseline) | **Mot phan / da co** | Chay local; UI/luong chua toi uu |
| GitHub Ecosystem (Issues/PR/Projects/Actions) | **Co** | Minh chung mon QLDA |
| Mobile Expo | **Chua xong** | Co man co ban; chua on API/UX day du |
| AI Chatbot noi bo (RAG + Ollama) | **Chua lam** | Moi co ke hoach `docs/chatbot-internal.md` |
| AI tham dinh / dinh gia thu mua may cu (YOLO + OCR + cong thuc gia) | **Chua lam** | Dung de cuong — day la phan cot loi chuyen nganh con thieu |
| Cong Public tu chan doan + QR hen cua hang | **Chua lam** | De cuong muc 5.1 |
| Admin tiep nhan ma dinh gia + phieu thu mua | **Chua lam** | De cuong muc 5.2 |

→ **QLDA dang minh chung quy trinh** tren baseline cua hang. **Phan AI dinh gia + chatbot + toi uu UI/mobile van la backlog bat buoc** de khop de tai.

---

## 2. Kien truc muc tieu (theo de cuong) — chua implement

```
[Public Web] chup anh / touch test / OCR pin
        │
        ▼
[AI Service] YOLOv8/11 (nut/xuoc) + PaddleOCR + Dynamic Valuation
        │
        ▼
[Laravel API] ma dinh gia / QR / phieu thu mua / kho hang cu
        │
        ├── [Admin/POS] quet QR, xac thuc, nhap kho cu
        └── [Mobile] (tuong lai) ho tro Quan / nhan vien thu mua
```

Cong thuc (de cuong):  
`P(thu mua) = P(goc Model&ROM) - C(khau hao ngoai quan) - C(linh kien loi) - M(bien LN)`

---

## 3. Phan giai Sprint de xuat (de dua vao bao cao Chuong 3–4)

| Sprint | Muc tieu | DoD |
|--------|----------|-----|
| S5 | Toi uu luong UI Admin/POS/Quan da co | UAT noi bo 5 luong cot loi khong crash |
| S6 | Mobile Expo: on API, UX Quan/thu mua | Build Expo + login + 4 man chinh that |
| S7 | AI dinh gia MVP: upload anh + OCR model/ROM/pin + gia uoc luong (rule+OCR, chua bat buoc YOLO) | API + 1 man Admin/Public demo |
| S8 | YOLO detect nut/xuoc + bounding box tren Admin | Inference demo < 2s/anh (CPU) |
| S9 | Chatbot noi bo Admin (RAG doc + tool bao cao) | `/tools/assistant` tra loi 5 cau mau |
| S10 | QR ma dinh gia + phieu thu mua + UAT Stakeholder | Sign-off file 07 |

---

## 4. Anh huong goi bang chung QLDA

- Charter / WBS / Risk / CR-004 da cap nhat: AI dinh gia + chatbot = **In-Scope chua hoan thanh**.  
- Bao cao viet **thi qua khu** cho phan da lam; phan AI viet la **da dua vao baseline pham vi** va **dang/con thieu thuc thi** (khong khai man la da co YOLO neu chua code).
