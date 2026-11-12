# HANDOFF — AI Thẩm định (AutoGrade) cho AI / dev tiếp theo

> **Mục đích file này:** bàn giao đủ context để agent khác làm tiếp khi session trước hết limit.  
> **Ngày bàn giao:** 2026-11-12  
> **Quyết định product:** (1B) YOLO + OCR thật · (2A) Web Admin trước, Mobile sau.

---

## 1. Mục tiêu cần đạt

Pipeline Web Admin:

1. NV tạo phiếu thu cũ iPhone  
2. Upload **4 ảnh**: `front` / `back` / `side` / `battery` (màn Pin / Giới thiệu)  
3. Gọi AI: **YOLOv8** (ngoại quan) + **PaddleOCR** (pin% / model / ROM)  
4. Phân **Loại 1→4** (map UI grade A–D) theo grading matrix  
5. Lấy **giá sàn** từ bảng giá + áp **khấu hao linh kiện** khi cần  
6. NV xác nhận / override → lưu DB → báo giá khách  

Ảnh quy trình (nguồn đề tài): [`quy-trinh-phan-loai-dinh-gia.png`](./quy-trinh-phan-loai-dinh-gia.png)

---

## 2. Assets đã đưa vào repo (BẮT BUỘC dùng các path này)

Đã copy vào **cả hai** worktree:

- `D:\DU_AN_WEB\lieng-mobile-main\` (main mới nhất, detached `3c650bd`)  
- `D:\DU_AN_WEB\lieng-mobile-qtda\` (clone chính; local `main` lệch — ưu tiên làm trên `lieng-mobile-main` hoặc branch mới từ `origin/main`)

| File | Path trong repo |
|------|-----------------|
| YOLO weights | [`data/autograde/weights/yolov8s_baseline_best.pt`](../../data/autograde/weights/yolov8s_baseline_best.pt) |
| Bảng giá Excel | [`data/autograde/pricing/Bang_Gia_TradeIn_iPhone_Full_Series.xlsx`](../../data/autograde/pricing/Bang_Gia_TradeIn_iPhone_Full_Series.xlsx) |
| Bảng giá JSON | [`data/autograde/pricing/iphone_tradein_pricing.json`](../../data/autograde/pricing/iphone_tradein_pricing.json) |
| Flowchart PNG | [`docs/autograde/quy-trinh-phan-loai-dinh-gia.png`](./quy-trinh-phan-loai-dinh-gia.png) |

Nguồn máy user (backup):

- `C:\Users\phamb\Downloads\yolov8s_baseline_best.pt`  
- `D:\DATA\Downloads\Bang_Gia_TradeIn_iPhone_Full_Series (1).xlsx`

---

## 3. Hiện trạng code (đã có / chưa có)

### Đã có (UI demo)

| Thành phần | Path |
|------------|------|
| Admin list + form 4 bước | `frontend/src/views/appraisal/AppraisalListView.vue` |
| Mock schema + `mockAutoGradeSuggest` | `frontend/src/mocks/appraisalMock.js` |
| Route `/appraisal` | `frontend/src/router/index.js` |
| Nav Thẩm định | `frontend/src/data/adminNav.js` |
| Mobile form nhẹ (chưa parity) | `mobile-expo/app/(app)/appraisal.tsx` |
| KB chatbot thu cũ | `data/assistant-kb/admin/09-tham-dinh-tu-van.md`, `public/03-thu-cu-doi-moi.md` |
| Chatbot RAG FastAPI | `assistant-service/` — **KHÔNG** nhét vision vào đây |

### Chưa có (cần làm)

- Laravel: model/migration/API appraisal + upload ảnh  
- `autograde-service/` FastAPI vision (YOLO + OCR + valuation)  
- Wire FE bỏ localStorage-only → API  
- PaddleOCR thật  
- Load weights YOLO trong service  
- Human-confirm detections trên UI  

Plan chi tiết phases: xem Cursor plan `ai_appraisal_plan_370d9ec5` hoặc tóm tắt §6 dưới.

---

## 4. Grading matrix (chuẩn đề tài — ưu tiên Excel/flowchart, không hardcode mock cũ)

Map UI hiện tại (A–D) ↔ Loại 1–4:

| Loại (Excel) | UI grade | Giá | Logic AI |
|--------------|----------|-----|----------|
| Loại 1 Like New 99% | **A** | Cột `loai_1_like_new` | YOLO không lỗi / class `good`; OCR pin ≥ 90%; không unknown part |
| Loại 2 95–98% | **B** | `loai_2_scratch` | YOLO đếm box `scratch` ≤ 5; OCR đọc pin (nếu pin &lt; 90% → +khấu hao pin) |
| Loại 3 Cấn / Vỡ kính | **C** | `loai_3_dent_crack` | YOLO: `cracked_screen` **hoặc** `dent` ≤ 3 |
| Loại 4 Hỏng nặng | **D** | `loai_4_heavy` | YOLO: `damaged` / `damaged_screen` |
| Từ chối thu | `reject` | — | iCloud lock / máy không lên / FaceID mất (form trước khi AI) |

**Nhãn YOLO kỳ vọng** (đối chiếu flowchart + sheet khấu hao):

- `good` (optional)  
- `scratch`  
- `dent`  
- `cracked_screen` (ép kính ngoài)  
- `damaged` / `damaged_screen` (thay cụm màn)  

> Agent tiếp theo: **verify `model.names`** bằng Ultralytics khi load `yolov8s_baseline_best.pt` — nếu tên class khác, tạo alias map trong config.

---

## 5. Valuation — CHỐT theo bảng Excel (không dùng BASE_PRICE_BOOK mock)

Có **2 lớp giá** trong JSON:

### 5.1 Floor price theo Loại (`floor_prices`)

Lookup key: `(model, storage)` → chọn cột theo grade:

```text
final_floor = floor_prices[model][storage][loai_N]
```

Ví dụ iPhone 15 Pro Max 256GB: Loại1 / Loại2 / Loại3 / Loại4 nằm trong JSON.

### 5.2 Khấu hao linh kiện (`parts_deductions`)

Theo nhóm máy (sheet `Khau_Hao_Linh_Kien`):

| Field JSON | Ý nghĩa |
|------------|---------|
| `cracked_screen_outer_glass` | Ép kính ngoài |
| `damaged_screen_full_assembly` | Thay cụm màn zin |
| `battery_below_90` | Pin &lt; 90% |
| `scratch` | Xước dăm (có thể nhân số box hoặc 1 lần theo policy) |
| `dent` | Cấn móp |
| `faceid_touchid_loss` | Mất FaceID/TouchID (hardware checklist) |

**Công thức đề xuất (đồng bộ flowchart + Excel):**

```text
1) Infer YOLO 3 góc + OCR battery
2) grade = rule_matrix(detections, ocr, hardware)   # Loại 1–4 hoặc reject
3) base = floor_price(model, storage, grade)
4) extras = Σ parts fees chưa nằm trong định nghĩa Loại
   (vd. pin < 90% khi vẫn Loại 2; FaceID fail; unknown part)
5) suggested = max(0, base - extras)   # hoặc = base nếu extras đã phản ánh trong cột Loại
6) staff_final = NV override
```

> Mock FE cũ dùng `FinalPrice = BasePrice − ΣC_YOLO − ΣC_OCR` với BasePrice hardcode — **thay bằng floor theo Loại**. Có thể vẫn trả `deductions[]` cho UI breakdown (chênh Loại1→LoạiN + extras).

---

## 6. Roadmap triển khai (thứ tự bắt buộc)

### Phase 0 — Contract
- OpenAPI từ shape `aiResult` trong `appraisalMock.js`  
- Dùng sẵn `iphone_tradein_pricing.json`  
- GitHub epic + issues  

### Phase 1 — Laravel persist (Web)
- Tables: `appraisal_tickets`, `appraisal_photos`  
- API CRUD + upload 4 slots  
- Permissions `appraisal.*`  
- Wire FE; giữ mock flag  

### Phase 2 — `autograde-service` FastAPI (port **8091**)
- **Tách** khỏi `assistant-service` (8090 RAG)  
- `GET /health`  
- `POST /appraise` multipart: images + model/storage/hardware JSON  
- Response cùng shape UI  
- Config Laravel: `AUTO_GRADE_URL=http://127.0.0.1:8091`  

### Phase 3 — PaddleOCR (slot `battery`)
- Parse model, ROM, pin%  
- Autofill nếu confidence cao  
- `POST /ocr/battery` debug  

### Phase 4 — YOLO (weights đã có)
- Load `data/autograde/weights/yolov8s_baseline_best.pt`  
- Infer `front/back/side`  
- Human-in-the-loop confirm boxes trên Web  
- Map class → grade rules §4  

### Phase 5 — Ops
- Audit model version, AI vs staff price  
- QR phiếu, status workflow  

### Phase 6 — Mobile (sau)
- Expo parity schema — **không** trong DoD kỳ Web  

---

## 7. API contract gợi ý (`POST /appraise`)

**Request:** multipart  

- `front`, `back`, `side`, `battery`: files  
- `meta`: JSON `{ brand, model, storage, hardware, imei? }`  

**Response (gợi ý):**

```json
{
  "grade": "B",
  "grade_label": "Loại 2 (95% - 98%)",
  "reject": false,
  "yolo": {
    "weights": "yolov8s_baseline_best.pt",
    "detections": [
      { "class": "scratch", "confidence": 0.91, "bbox": [x,y,w,h], "image": "front" }
    ]
  },
  "ocr": {
    "model": "iPhone 15 Pro",
    "rom": "256GB",
    "battery_percent": 91,
    "unknown_part": false,
    "raw_text": "..."
  },
  "pricing": {
    "floor_loai_1": 0,
    "floor_applied": 0,
    "extras": [{ "code": "battery_below_90", "amount": 0 }],
    "suggested_price": 0,
    "currency": "VND"
  },
  "deductions": [],
  "formula_note": "floor(Loại) - extras",
  "confidence": 0.0
}
```

---

## 8. Môi trường chạy (máy Bao — lưu ý)

| Service | Port | Ghi chú |
|---------|------|---------|
| Vue FE | 5173 | `npm run dev` |
| Laravel | 8080 | Win hiện **chặn `pdo_pgsql`** (Application Control) → worktree main đang chạy **SQLite** tạm |
| assistant-service RAG | 8090 | Chatbot — đừng đụng |
| autograde-service | **8091** | Cần tạo mới |
| Ollama | 11434 | Chatbot only |

Login demo (SQLite seed): `admin@liengmobile.com` / `password`

CUDA/Ollama từng lỗi driver — train/infer YOLO: ưu tiên **CPU YOLOv8s** hoặc Colab; weights đã có sẵn không cần train lại ngay.

---

## 9. Việc AI tiếp theo nên làm NGAY (checklist)

1. [ ] Tạo branch `feature/autograde-ai` từ `origin/main` (trên `lieng-mobile-main` hoặc reset qtda)  
2. [ ] Commit assets `data/autograde/**` + `docs/autograde/**` (file `.pt` ~22MB — GitHub OK &lt;100MB; cân nhắc Git LFS)  
3. [ ] `pip install ultralytics` → in `model.names` từ weights → ghi vào `data/autograde/weights/classes.json`  
4. [ ] Scaffold `autograde-service/` với `/health` + `/appraise` load YOLO + đọc `iphone_tradein_pricing.json`  
5. [ ] Laravel migration + controller proxy  
6. [ ] FE: nút AutoGrade gọi API thay mock  
7. [ ] Thêm PaddleOCR  
8. [ ] Issue GitHub epic + PR  

**Không làm:** nhét YOLO vào `assistant-service`; đừng xóa UI mock cho đến khi API ổn (giữ fallback).

---

## 10. Liên kết issue / UI cũ

- Web AutoGrade UI issue body: `docs/scripts/issue-bodies-s5/bao-appraisal-autograde-ui.md` (trên qtda)  
- Mobile: `#125` / `giang-m-appraisal.md`  
- Chatbot upgrade (xong một phần): PR `#139`, issue `#140`  

---

## 11. Prompt ngắn dán cho AI tiếp theo

```text
Tiếp tục Lieng Mobile AutoGrade theo docs/autograde/HANDOFF-AI-THAM-DINH.md.
Assets sẵn: data/autograde/weights/yolov8s_baseline_best.pt và
data/autograde/pricing/iphone_tradein_pricing.json.
Ưu tiên: Web Admin trước. Tạo autograde-service :8091 (YOLO+OCR+giá Loại1-4),
Laravel CRUD/upload, wire AppraisalListView. Không gộp vào assistant-service RAG.
Verify YOLO class names trước khi code rule grading.
```

---

*Hết bàn giao. Mọi quyết định grading/giá lấy từ Excel/JSON + flowchart PNG; mock FE chỉ là reference UI.*
