import { importProductVariants as seedVariants } from '@/mocks/stockImportMock'

const CATALOG_KEY = 'lieng_import_product_variants'

function readCustom() {
  try {
    const raw = localStorage.getItem(CATALOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeCustom(variants) {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(variants))
}

export function listImportProductVariants() {
  return [...seedVariants, ...readCustom()]
}

function nextVariantId() {
  const all = listImportProductVariants()
  const maxSeed = seedVariants.reduce((max, v) => Math.max(max, v.productVariantId), 0)
  const maxCustom = all.reduce((max, v) => Math.max(max, v.productVariantId ?? 0), 0)
  return Math.max(maxSeed, maxCustom, 9000) + 1
}

export function registerProductVariant({ name, variant, unitPrice, brand = '', category = 'other' }) {
  const created = {
    productVariantId: nextVariantId(),
    category,
    name: name.trim(),
    variant: variant.trim(),
    unitPrice,
    brand: brand.trim(),
    isUserCreated: true,
  }
  writeCustom([...readCustom(), created])
  return created
}

/** Khi xác nhận phiếu: tạo biến thể mới vào danh mục cho các dòng isNew */
export function registerNewItemsFromImport(items) {
  return items.map((item) => {
    if (!item.isNew) return item

    const registered = registerProductVariant({
      name: item.name,
      variant: item.variant,
      unitPrice: item.unitPrice,
      brand: item.brand ?? '',
      category: item.category ?? 'other',
    })

    return {
      ...item,
      isNew: false,
      productVariantId: registered.productVariantId,
    }
  })
}
