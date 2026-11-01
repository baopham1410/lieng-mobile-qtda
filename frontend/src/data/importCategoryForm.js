/** Cấu hình form nhập kho theo slug danh mục (khớp bảng categories). */
export const IMPORT_CATEGORY_PROFILES = {
  'dien-thoai': {
    requiresImei: true,
    profile: 'mobile',
    namePlaceholder: 'Ví dụ: iPhone 16 Pro Max',
    hint: 'IMEI 15 số do hãng in trên hộp/máy — quét ở bước Danh sách IMEI, không tự đặt.',
    fields: [
      { key: 'color', label: 'Màu sắc', placeholder: 'Titan Xanh / Đen...', required: true },
      { key: 'storage', label: 'Bộ nhớ', placeholder: '128GB / 256GB...', required: true },
    ],
  },
  tablet: {
    requiresImei: true,
    profile: 'mobile',
    namePlaceholder: 'Ví dụ: iPad Air M3',
    hint: 'IMEI/serial do hãng cấp — nhập ở Danh sách IMEI sau khi thêm dòng hàng.',
    fields: [
      { key: 'color', label: 'Màu sắc', placeholder: 'Xám / Bạc...', required: true },
      { key: 'storage', label: 'Bộ nhớ / Wi‑Fi', placeholder: '128GB / 256GB LTE...', required: true },
    ],
  },
  laptop: {
    requiresImei: true,
    profile: 'laptop',
    namePlaceholder: 'Ví dụ: MacBook Air M3',
    hint: 'Serial/IMEI trên tem máy — dán vào Danh sách IMEI (1 mã / 1 máy).',
    fields: [
      { key: 'color', label: 'Màu sắc', placeholder: 'Midnight / Starlight...', required: true },
      { key: 'storage', label: 'RAM · SSD', placeholder: '16GB · 512GB...', required: true },
    ],
  },
  'phu-kien': {
    requiresImei: false,
    profile: 'accessory',
    namePlaceholder: 'Ví dụ: Ốp lưng MagSafe',
    hint: 'Phụ kiện không có IMEI — chỉ nhập số lượng; bán theo tồn kho.',
    fields: [
      { key: 'variantDesc', label: 'Quy cách / mô tả', placeholder: 'Trong suốt / Dài 1m / Type‑C...', required: true },
    ],
  },
  tivi: {
    requiresImei: false,
    profile: 'appliance',
    namePlaceholder: 'Ví dụ: Samsung Smart TV 55"',
    hint: 'Tivi theo số lượng; serial hãng (nếu có) có thể ghi ở Danh sách IMEI.',
    fields: [
      { key: 'color', label: 'Màu', placeholder: 'Đen / Bạc...', required: false },
      { key: 'storage', label: 'Kích thước màn', placeholder: '55 inch / 65 inch...', required: true },
    ],
  },
  'tu-lanh': {
    requiresImei: false,
    profile: 'appliance',
    namePlaceholder: 'Ví dụ: Panasonic Inverter 190L',
    hint: 'Theo số lượng; dung tích ghi ở quy cách bên dưới.',
    fields: [
      { key: 'color', label: 'Màu', placeholder: 'Trắng / Inox...', required: false },
      { key: 'storage', label: 'Dung tích', placeholder: '190L / 256L...', required: true },
    ],
  },
  quat: {
    requiresImei: false,
    profile: 'accessory',
    namePlaceholder: 'Ví dụ: Senko quạt đứng 16 inch',
    hint: 'Quạt, linh kiện — nhập số lượng, không bắt IMEI 15 số.',
    fields: [
      { key: 'variantDesc', label: 'Quy cách', placeholder: '16 inch / Quạt trần 56 inch...', required: true },
    ],
  },
}

const LEGACY_CATEGORY_ALIASES = {
  phone: 'dien-thoai',
  accessory: 'phu-kien',
  audio: 'phu-kien',
  watch: 'dien-thoai',
  sim: 'phu-kien',
  other: 'phu-kien',
}

const DEFAULT_PROFILE = IMPORT_CATEGORY_PROFILES['phu-kien']

export function normalizeCategoryId(categoryId) {
  const id = String(categoryId ?? '')
  return LEGACY_CATEGORY_ALIASES[id] ?? id
}

export function getImportCategoryProfile(categoryId) {
  const slug = normalizeCategoryId(categoryId)
  return IMPORT_CATEGORY_PROFILES[slug] ?? DEFAULT_PROFILE
}

export function categoryRequiresImeiById(categoryId, customRequiresImei = false) {
  if (categoryId === 'new') return !!customRequiresImei
  return getImportCategoryProfile(categoryId).requiresImei
}

export function mergeCategoriesWithFormProfiles(apiCategories = []) {
  if (!apiCategories.length) {
    return Object.entries(IMPORT_CATEGORY_PROFILES).map(([slug, profile]) => ({
      id: slug,
      slug,
      label: slugToLabel(slug),
      ...profile,
    }))
  }

  return apiCategories.map((cat) => {
    const slug = cat.slug ?? cat.id
    const profile = getImportCategoryProfile(slug)
    return {
      id: String(cat.id),
      slug,
      label: cat.name ?? cat.label ?? slug,
      ...profile,
    }
  })
}

function slugToLabel(slug) {
  const map = {
    'dien-thoai': 'Điện thoại',
    tablet: 'Tablet',
    laptop: 'Laptop',
    'phu-kien': 'Phụ kiện',
    tivi: 'Tivi',
    'tu-lanh': 'Tủ lạnh',
    quat: 'Quạt',
  }
  return map[slug] ?? slug
}

export function getCategoryDisplayLabel(categoryId) {
  const slug = normalizeCategoryId(categoryId)
  return slugToLabel(slug)
}

export function buildImportVariantLabel(categoryId, form) {
  const profile = getImportCategoryProfile(categoryId)
  if (profile.profile === 'accessory') {
    return form.variantDesc?.trim() ?? ''
  }
  const parts = profile.fields
    .map((field) => form[field.key]?.trim())
    .filter(Boolean)
  if (parts.length) return parts.join(' · ')
  return form.variantDesc?.trim() ?? ''
}

export function validateImportProductForm(categoryId, form, customRequiresImei = false) {
  const profile = categoryId === 'new'
    ? { requiresImei: customRequiresImei, fields: customRequiresImei ? IMPORT_CATEGORY_PROFILES['dien-thoai'].fields : DEFAULT_PROFILE.fields }
    : getImportCategoryProfile(categoryId)

  const brand = form.brand === 'Khác' ? form.customBrand?.trim() : form.brand
  if (!form.name?.trim()) return 'Vui lòng nhập tên sản phẩm.'
  if (!brand) return 'Vui lòng chọn thương hiệu.'

  for (const field of profile.fields) {
    if (field.required && !form[field.key]?.trim()) {
      return `Vui lòng nhập ${field.label.toLowerCase()}.`
    }
  }

  return null
}

export function resolveCategorySlug(categoryId, categories = []) {
  const cat = categories.find((c) => String(c.id) === String(categoryId))
  return cat?.slug ?? normalizeCategoryId(categoryId)
}

export function applyProductVariantToForm(form, product, categorySlug) {
  const profile = getImportCategoryProfile(categorySlug)
  const variant = product?.variant ?? {}

  form.color = ''
  form.storage = ''
  form.ram = ''
  form.variantDesc = ''

  if (profile.profile === 'accessory') {
    form.variantDesc = [variant.color, variant.storage, variant.ram].filter(Boolean).join(' · ') || variant.storage || ''
  } else {
    form.color = variant.color ?? ''
    form.storage = variant.storage ?? ''
    form.ram = variant.ram ?? ''
  }

  form.condition = variant.condition ?? 'new'
  form.sku = variant.sku ?? ''
}

export function buildProductVariantFields(categorySlug, form) {
  const profile = getImportCategoryProfile(categorySlug)

  if (profile.profile === 'accessory') {
    const desc = form.variantDesc?.trim()
    return {
      sku: form.sku?.trim() || null,
      color: null,
      storage: desc || null,
      ram: null,
      condition: form.condition || 'new',
    }
  }

  return {
    sku: form.sku?.trim() || null,
    color: form.color?.trim() || null,
    storage: form.storage?.trim() || null,
    ram: form.ram?.trim() || null,
    condition: form.condition || 'new',
  }
}

export function validateProductEditForm(categoryId, form, categories = []) {
  const slug = resolveCategorySlug(categoryId, categories)
  return validateImportProductForm(slug, {
    name: form.name,
    brand: form.brand,
    customBrand: form.customBrand,
    color: form.color,
    storage: form.storage,
    variantDesc: form.variantDesc,
  })
}
