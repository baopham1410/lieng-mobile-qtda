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

function apiErrorMessage(err, fallback) {
  const raw =
    err?.response?.data?.message ||
    (err?.response?.data?.errors && Object.values(err.response.data.errors).flat()[0]) ||
    err?.message ||
    fallback

  if (/already been taken/i.test(String(raw))) {
    return 'Mã phiếu đã tồn tại — hệ thống sẽ cấp mã mới, hãy lưu lại.'
  }

  return raw
}

export async function fetchNextImportCode() {
  try {
    const data = await apiGet('/stock-imports/next-code')
    return data?.code || repo.generateImportCode()
  } catch {
    return repo.generateImportCode()
  }
}

/** Ghi phiếu nhập bắt buộc qua API — không fallback local (tránh “xác nhận xong biến mất”). */
export async function createStockImport(payload) {
  try {
    return await apiWrite('post', '/stock-imports', payload)
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Không tạo được phiếu nhập'))
  }
}

export async function updateStockImport(code, payload) {
  try {
    return await apiWrite('put', `/stock-imports/${code}`, payload)
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Không cập nhật được phiếu nhập'))
  }
}

export async function confirmStockImport(code) {
  try {
    return await apiWrite('post', `/stock-imports/${code}/confirm`)
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Không xác nhận được phiếu nhập'))
  }
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
