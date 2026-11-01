import apiClient from './client'
import { unwrapApiData } from '@/utils/apiFallback'

export async function fetchCategories() {
  const { data } = await apiClient.get('/product-categories')
  return unwrapApiData(data) ?? []
}

export async function createCategory(payload) {
  const { data } = await apiClient.post('/product-categories', payload)
  return unwrapApiData(data)
}

export async function updateCategory(id, payload) {
  const { data } = await apiClient.put(`/product-categories/${id}`, payload)
  return unwrapApiData(data)
}

export async function deleteCategory(id) {
  const { data } = await apiClient.delete(`/product-categories/${id}`)
  return data
}
