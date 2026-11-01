import { formatPrice } from '@/data/storeIntro'

export { formatPrice }

export const catalogCategories = [{ id: 'all', label: 'Tất cả', icon: '🛍️' }]

export const catalogBrands = ['Tất cả']

export const sortOptions = [
  { value: 'popular', label: 'Bán chạy nhất' },
  { value: 'price-asc', label: 'Giá thấp → cao' },
  { value: 'price-desc', label: 'Giá cao → thấp' },
  { value: 'newest', label: 'Mới nhất' },
]

export const catalogProducts = []

export function filterCatalogProducts({ products = [], keyword = '', category = 'all', brand = 'Tất cả', sort = 'popular' }) {
  let rows = Array.isArray(products) ? [...products] : []
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
  }

  return rows
}
