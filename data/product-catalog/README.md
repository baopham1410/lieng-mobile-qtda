# Thư viện ảnh & thông số điện thoại — Lieng Mobile

Dùng nội bộ khi thêm sản phẩm: chọn ảnh + copy spec, nhập giá cửa hàng.

## Cấu trúc thư mục

```
data/product-catalog/
├── catalog.json      ← danh sách đầy đủ
├── by-brand.json     ← tra cứu theo hãng (nhanh)
└── images/
    ├── apple/        ← iPhone
    ├── samsung/      ← Galaxy S, A, Z
    ├── xiaomi/       ← Xiaomi, Redmi
    ├── oppo/
    ├── vivo/
    ├── realme/
    ├── oneplus/
    ├── huawei/
    └── nokia/
```

## Thêm máy mới

1. Mở file JSON đúng hãng: `scripts/product_catalog/sources/samsung.json`
2. Thêm object (id, name, image_url CDN GSMArena, specs_short)
3. Chạy:

```powershell
cd scripts\product_catalog
python download_catalog.py
```

## Tìm URL ảnh GSMArena CDN

Vào trang máy trên gsmarena.com → chuột phải ảnh lớn → copy link, hoặc dùng pattern:

`https://fdn2.gsmarena.com/vv/bigpic/<ten-file>.jpg`

## Dùng trên web

Copy ảnh sang `frontend/public/products/<hang>/` hoặc serve từ `data/product-catalog/images/`.

## Lưu ý

- Ảnh từ GSMArena CDN — chỉ tham khảo nội bộ.
- Giá (`price`) luôn `null` — nhập giá Lieng Mobile khi bán.
