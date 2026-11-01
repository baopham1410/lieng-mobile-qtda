import { defaultProductCategories } from '@/data/productCategories'
import { categoryRequiresImeiById, normalizeCategoryId } from '@/data/importCategoryForm'

const CATEGORIES_KEY = 'lieng_product_categories'

function readCustom() {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeCustom(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}

function toCategoryId(label) {
  const base = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base || `cat-${Date.now()}`
}

export function listProductCategories() {
  const custom = readCustom()
  const defaultIds = new Set(defaultProductCategories.map((c) => c.id))
  return [...defaultProductCategories, ...custom.filter((c) => !defaultIds.has(c.id))]
}

export function getCategoryMeta(categoryId) {
  return listProductCategories().find((c) => c.id === categoryId) ?? defaultProductCategories.at(-1)
}

export function categoryRequiresImei(categoryId) {
  const meta = getCategoryMeta(categoryId)
  if (meta?.requiresImei != null && categoryId !== 'new') {
    return meta.requiresImei
  }
  return categoryRequiresImeiById(normalizeCategoryId(categoryId), meta?.requiresImei)
}

export function getCategoryLabels() {
  return Object.fromEntries(listProductCategories().map((c) => [c.id, c.label]))
}

export function addProductCategory({ label, requiresImei = false }) {
  const trimmed = label.trim()
  if (!trimmed) throw new Error('Vui lòng nhập tên danh mục')

  const all = listProductCategories()
  if (all.some((c) => c.label.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('Danh mục này đã tồn tại')
  }

  let id = toCategoryId(trimmed)
  if (all.some((c) => c.id === id)) {
    id = `${id}-${Date.now()}`
  }

  const created = { id, label: trimmed, requiresImei: !!requiresImei, isUserCreated: true }
  writeCustom([...readCustom(), created])
  return created
}
