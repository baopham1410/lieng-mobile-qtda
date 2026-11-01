import apiClient, { silentRequest } from './client'

const POS_TIMEOUT = 20000
const POS_OPTS = { timeout: POS_TIMEOUT, ...silentRequest }
const POS_WRITE = { timeout: POS_TIMEOUT }

export async function fetchPosCategories() {
  const { data } = await apiClient.get('/pos/categories', POS_OPTS)
  return data.data ?? []
}

export async function fetchPosProducts(params) {
  const { data } = await apiClient.get('/pos/available', { params, ...POS_OPTS })
  return data.data ?? []
}

export async function suggestPosCustomers(q) {
  const { data } = await apiClient.get('/pos/customers/suggest', { params: { q }, ...POS_OPTS })
  return data.data ?? []
}

export async function lookupPosCustomer(phone) {
  const { data } = await apiClient.get('/pos/customers/lookup', { params: { phone }, ...POS_OPTS })
  return data
}

export async function fetchPosCustomers() {
  const { data } = await apiClient.get('/pos/customers', POS_OPTS)
  return data.data ?? []
}

export function checkoutPos(payload) {
  return apiClient.post('/pos/checkout', payload, POS_WRITE)
}

export async function fetchOrderPaymentStatus(orderId) {
  const { data } = await apiClient.get(`/orders/${orderId}/payment-status`, POS_OPTS)
  return data.data ?? null
}
