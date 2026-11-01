import apiClient from './client'
import { mapPaginated, unwrapApiData, withApiFallback } from '@/utils/apiFallback'
import { buildProductVariantFields, resolveCategorySlug } from '@/data/importCategoryForm'

export async function fetchProducts(params) {
  const { data } = await apiClient.get('/products', { params })
  const mapped = mapPaginated(data)
  return {
    rows: mapped.rows,
    stats: mapped.stats,
    categories: mapped.filters?.categories ?? [],
    brands: mapped.filters?.brands ?? [],
  }
}

export async function fetchProductCategories() {
  const { data } = await apiClient.get('/product-categories')
  return unwrapApiData(data) ?? []
}

export async function fetchProduct(id) {
  const { data } = await apiClient.get(`/products/${id}`)
  return unwrapApiData(data)
}

/** Biến thể sản phẩm có sẵn — dùng tab "Có sẵn trong kho" khi nhập kho. */
export async function fetchImportProductVariants() {
  const { data } = await apiClient.get('/products/import-variants')
  return unwrapApiData(data) ?? []
}

export async function createProduct(payload) {
  const { data } = await apiClient.post('/products', payload)
  return unwrapApiData(data)
}

export async function updateProduct(id, payload) {
  const { data } = await apiClient.put(`/products/${id}`, payload)
  return unwrapApiData(data)
}

export async function deleteProduct(id) {
  const { data } = await apiClient.delete(`/products/${id}`)
  return data
}

export function uploadProductImage(id, file) {
  const form = new FormData()
  form.append('image', file)
  return apiClient.post(`/products/${id}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function removeProductImage(id) {
  return apiClient.delete(`/products/${id}/image`)
}

export function buildProductPayload(form, categories = []) {
  const brand = form.brand === 'Khác' ? form.customBrand?.trim() : form.brand
  const categorySlug = resolveCategorySlug(form.categoryId, categories)

  return {
    name: form.name.trim(),
    category_id: Number(form.categoryId),
    brand: brand || null,
    model_code: form.modelCode?.trim() || null,
    description: form.description?.trim() || null,
    is_active: form.isActive !== false,
    variant: buildProductVariantFields(categorySlug, form),
    prices: {
      import: form.importPrice ? Number(form.importPrice) : null,
      retail: form.retailPrice ? Number(form.retailPrice) : null,
      wholesale: form.wholesalePrice ? Number(form.wholesalePrice) : null,
    },
  }
}
