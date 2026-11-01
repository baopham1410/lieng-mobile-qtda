import apiClient from './client'
import { mapPaginated } from '@/utils/apiFallback'

export async function fetchQuanProducts(params = {}) {
  const { data } = await apiClient.get('/quan/products', { params })
  return {
    rows: data.data ?? [],
    categories: data.categories ?? [],
  }
}

export function createQuanProduct(payload) {
  return apiClient.post('/quan/products', payload)
}

export function updateQuanProduct(id, payload) {
  return apiClient.put(`/quan/products/${id}`, payload)
}

export function deleteQuanProduct(id) {
  return apiClient.delete(`/quan/products/${id}`)
}

export async function fetchQuanEntries(params) {
  const { data } = await apiClient.get('/quan/entries', { params })
  const mapped = mapPaginated(data)
  return { rows: mapped.rows, stats: mapped.stats, meta: mapped.meta }
}

export function createQuanEntry(payload) {
  return apiClient.post('/quan/entries', payload)
}

export function updateQuanEntry(id, payload) {
  return apiClient.put(`/quan/entries/${id}`, payload)
}

export function deleteQuanEntry(id) {
  return apiClient.delete(`/quan/entries/${id}`)
}

export async function fetchQuanStatements(params = {}) {
  const { data } = await apiClient.get('/quan/statements', { params })
  const mapped = mapPaginated(data)
  return { rows: mapped.rows, meta: mapped.meta }
}

export async function fetchQuanStatement(id) {
  const { data } = await apiClient.get(`/quan/statements/${id}`)
  return data.data
}

export function saveQuanStatement(payload = {}) {
  return apiClient.post('/quan/statements', payload)
}

export function deleteQuanStatement(id) {
  return apiClient.delete(`/quan/statements/${id}`)
}

export async function fetchQuanCosts(params = {}) {
  const { data } = await apiClient.get('/quan/costs', { params })
  return data.data ?? {
    products: [],
    categories: [],
    summary: {},
    byProduct: [],
  }
}
