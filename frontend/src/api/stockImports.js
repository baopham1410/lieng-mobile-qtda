import apiClient from './client'
import { unwrapApiData, withApiFallback } from '@/utils/apiFallback'
import * as repo from '@/repositories/stockImportRepository'

const FAST_TIMEOUT = 8000

function parseStockImportPage(body) {
  return {
    imports: Array.isArray(body?.data) ? body.data : [],
    stats: body?.stats ?? null,
  }
}

function localStockImportPage() {
  return {
    imports: repo.listStockImports(),
    stats: repo.getStockImportStats(),
  }
}

async function apiGet(path) {
  const { data } = await apiClient.get(path, { timeout: FAST_TIMEOUT })
  return unwrapApiData(data)
}

async function apiWrite(method, path, payload) {
  const { data } = await apiClient[method](path, payload)
  return unwrapApiData(data)
}

export function fetchStockImportPage(config = {}) {
  return withApiFallback(
    async () => {
      const { data } = await apiClient.get('/stock-imports', { timeout: FAST_TIMEOUT, ...config })
      return parseStockImportPage(data)
    },
    localStockImportPage,
  )
}

export function listStockImports() {
  return withApiFallback(
    async () => {
      const { data } = await apiClient.get('/stock-imports', { timeout: FAST_TIMEOUT })
      return parseStockImportPage(data).imports
    },
    () => repo.listStockImports(),
  )
}

export function getStockImport(code) {
  return withApiFallback(
    () => apiGet(`/stock-imports/${code}`),
    () => repo.getStockImportByCode(code),
  )
}

export function createStockImport(payload) {
  return withApiFallback(
    () => apiWrite('post', '/stock-imports', payload),
    () => repo.saveStockImport(payload),
  )
}

export function updateStockImport(code, payload) {
  return withApiFallback(
    () => apiWrite('put', `/stock-imports/${code}`, payload),
    () => repo.saveStockImport({ ...payload, code }),
  )
}

export function confirmStockImport(code) {
  return withApiFallback(
    () => apiWrite('post', `/stock-imports/${code}/confirm`),
    () => repo.confirmStockImport(code),
  )
}

export function listSuppliers() {
  return withApiFallback(
    () => apiGet('/suppliers'),
    () => repo.listSuppliers(),
  )
}

export function addSupplier(payload) {
  return withApiFallback(
    () => apiWrite('post', '/suppliers', payload),
    () => repo.addSupplier(payload),
  )
}

export function getStockImportStats() {
  return withApiFallback(
    async () => {
      const { data } = await apiClient.get('/stock-imports/stats', { timeout: FAST_TIMEOUT })
      return unwrapApiData(data)
    },
    () => repo.getStockImportStats(),
  )
}

export { generateImportCode, listUsedImeis, formatCurrency } from '@/repositories/stockImportRepository'
