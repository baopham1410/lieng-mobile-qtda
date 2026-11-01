/** @deprecated Dùng importCategoryForm + API categories. Giữ để tương thích mock cũ. */
import { IMPORT_CATEGORY_PROFILES, normalizeCategoryId } from '@/data/importCategoryForm'

export const defaultProductCategories = Object.entries(IMPORT_CATEGORY_PROFILES).map(([slug, profile]) => ({
  id: slug,
  label: slug.replace(/-/g, ' '),
  requiresImei: profile.requiresImei,
  ...profile,
}))

export const productCategories = defaultProductCategories

export function getCategoryMeta(categoryId) {
  const slug = normalizeCategoryId(categoryId)
  const profile = IMPORT_CATEGORY_PROFILES[slug]
  if (profile) {
    return { id: slug, label: slug, requiresImei: profile.requiresImei, ...profile }
  }
  return defaultProductCategories.at(-1)
}
