import { formatPrice } from '@/data/storeIntro'

export { formatPrice }

export const catalogCategories = [
  { id: 'all', label: 'Tất cả thiết bị', icon: 'all' },
  { id: 'phone', label: 'Điện thoại', icon: 'phone' },
  { id: 'tablet', label: 'Máy tính bảng', icon: 'tablet' },
  { id: 'laptop', label: 'Laptop & Mac', icon: 'laptop' },
  { id: 'watch', label: 'Đồng hồ thông minh', icon: 'watch' },
  { id: 'accessory', label: 'Phụ kiện cao cấp', icon: 'accessory' },
]

export const catalogBrands = ['Tất cả', 'Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Anker', 'Lieng Care']

export const sortOptions = [
  { value: 'popular', label: 'Bán chạy nhất' },
  { value: 'price-asc', label: 'Giá thấp → cao' },
  { value: 'price-desc', label: 'Giá cao → thấp' },
  { value: 'newest', label: 'Mới nhất' },
]

export const catalogProducts = [
  {
    id: 'p-1',
    productId: 1,
    name: 'iPhone 15 Pro Max 256GB',
    brand: 'Apple',
    category: 'phone',
    image: '/products/iphone-15.jpg',
    price: 28990000,
    oldPrice: 32990000,
    badge: 'Flagship Titan',
    specs: ['256GB', 'Titan Tự Nhiên', 'Chính hãng VN/A'],
    rating: 4.9,
    sold: 142,
    inStock: true,
    colors: ['Titan Tự Nhiên', 'Titan Xanh', 'Titan Đen', 'Titan Trắng'],
    warrantyMonths: 12,
  },
  {
    id: 'p-2',
    productId: 2,
    name: 'Samsung Galaxy S24 256GB',
    brand: 'Samsung',
    category: 'phone',
    image: '/products/samsung-s24.jpg',
    price: 16990000,
    oldPrice: 19990000,
    badge: 'Galaxy AI',
    specs: ['256GB', 'Snapdragon 8 Gen 3', 'Galaxy AI'],
    rating: 4.8,
    sold: 98,
    inStock: true,
    colors: ['Xám Marble', 'Đen Onyx', 'Tím Cobalt', 'Vàng Amber'],
    warrantyMonths: 12,
  },
  {
    id: 'p-3',
    productId: 3,
    name: 'Xiaomi 14 256GB Leica',
    brand: 'Xiaomi',
    category: 'phone',
    image: '/products/xiaomi-14.jpg',
    price: 14990000,
    oldPrice: 17990000,
    badge: 'Leica Optics',
    specs: ['256GB', 'Camera Leica', 'Sạc siêu tốc 90W'],
    rating: 4.7,
    sold: 64,
    inStock: true,
    colors: ['Xanh Ngọc', 'Đen Cổ Điển', 'Trắng'],
    warrantyMonths: 18,
  },
  {
    id: 'p-4',
    productId: 4,
    name: 'OPPO Reno11 5G 256GB',
    brand: 'OPPO',
    category: 'phone',
    image: '/products/oppo-reno11.jpg',
    price: 9990000,
    oldPrice: 11490000,
    badge: 'Chuyên gia chân dung',
    specs: ['256GB', 'Camera Tele chân dung', 'Sạc 67W'],
    rating: 4.6,
    sold: 85,
    inStock: true,
    colors: ['Xanh Sóng Biển', 'Xám Hoa Cương'],
    warrantyMonths: 12,
  },
  {
    id: 'p-5',
    productId: 5,
    name: 'iPad Air M2 11-inch 128GB',
    brand: 'Apple',
    category: 'tablet',
    image: '/products/ipad-air.jpg',
    price: 16990000,
    oldPrice: 18990000,
    badge: 'Chip M2',
    specs: ['128GB', 'Liquid Retina 11"', 'Hỗ trợ Apple Pencil Pro'],
    rating: 4.9,
    sold: 53,
    inStock: true,
    colors: ['Xanh Dương', 'Tím', 'Vàng Ánh Sao', 'Xám Không Gian'],
    warrantyMonths: 12,
  },
  {
    id: 'p-6',
    productId: 6,
    name: 'Tai nghe Apple AirPods Pro 2 (USB-C)',
    brand: 'Apple',
    category: 'accessory',
    image: '/products/airpods-pro.jpg',
    price: 5490000,
    oldPrice: 6190000,
    badge: 'Chống ồn 2X',
    specs: ['USB-C', 'Chống ồn chủ động', 'Âm thanh không gian'],
    rating: 4.9,
    sold: 210,
    inStock: true,
    colors: ['Trắng'],
    warrantyMonths: 12,
  },
  {
    id: 'p-7',
    productId: 7,
    name: 'Đồng hồ Samsung Galaxy Watch6 40mm',
    brand: 'Samsung',
    category: 'watch',
    image: '/products/galaxy-watch6.jpg',
    price: 4990000,
    oldPrice: 6990000,
    badge: 'Sale Sốc',
    specs: ['40mm', 'Theo dõi giấc ngủ', 'Cảm biến BIA sức khỏe'],
    rating: 4.7,
    sold: 76,
    inStock: true,
    colors: ['Đen', 'Vàng'],
    warrantyMonths: 12,
  },
  {
    id: 'p-8',
    productId: 8,
    name: 'Củ sạc nhanh 65W GaN Anker 3 cổng',
    brand: 'Anker',
    category: 'accessory',
    image: '/products/gan-charger.jpg',
    price: 690000,
    oldPrice: 890000,
    badge: 'GaN III',
    specs: ['65W Max', '2 USB-C + 1 USB-A', 'Bảo vệ quá nhiệt'],
    rating: 4.8,
    sold: 340,
    inStock: true,
    colors: ['Đen', 'Trắng'],
    warrantyMonths: 24,
  },
  {
    id: 'p-9',
    productId: 9,
    name: 'Ốp lưng Clear Case MagSafe chống sốc',
    brand: 'Lieng Care',
    category: 'accessory',
    image: '/products/phone-case.jpg',
    price: 290000,
    oldPrice: 450000,
    badge: 'Bảo vệ 360°',
    specs: ['MagSafe nam châm mạnh', 'TPU chống ố vàng', 'Đệm khí góc'],
    rating: 4.6,
    sold: 520,
    inStock: true,
    colors: ['Trong suốt'],
    warrantyMonths: 6,
  },
]

export function filterCatalogProducts({ products = [], keyword = '', category = 'all', brand = 'Tất cả', sort = 'popular' }) {
  let rows = Array.isArray(products) && products.length > 0 ? [...products] : [...catalogProducts]
  const q = String(keyword).trim().toLowerCase()

  if (q) {
    rows = rows.filter((item) =>
      [item.name, item.brand, item.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    )
  }

  if (category !== 'all') {
    rows = rows.filter((item) => item.categoryId === category || item.category === category)
  }

  if (brand !== 'Tất cả') {
    rows = rows.filter((item) => item.brand === brand)
  }

  if (sort === 'price-asc') {
    rows.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
  } else if (sort === 'price-desc') {
    rows.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
  } else if (sort === 'newest') {
    rows.sort((a, b) => (b.productId ?? 0) - (a.productId ?? 0))
  }

  return rows
}
