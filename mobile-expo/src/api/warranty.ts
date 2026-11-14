import { api } from './client'

export interface WarrantyLookupResult {
  imei: string
  product_name: string
  sku?: string
  status: 'valid' | 'expired' | 'not_found'
  warranty_end?: string
  customer_name?: string
  customer_phone?: string
  repairs?: Array<{
    id: number
    symptom: string
    status: string
    created_at: string
  }>
}

export async function lookupWarrantyByImei(imei: string) {
  const { data } = await api.get(`/warranties/lookup/${encodeURIComponent(imei)}`)
  return data
}

export interface CustomerWarrantyItem {
  id: number
  imei: string
  deviceName: string
  color: string
  package: string
  startDate: string
  endDate: string
  daysRemaining: number
  status: string
  statusBadge: string
  orderCode: string
  repairs: Array<{
    id: number
    description: string
    date?: string
    cost: number
    technician: string
  }>
}

export async function fetchMyWarranties(phone?: string): Promise<CustomerWarrantyItem[]> {
  const url = phone ? `/customer/my-warranties?phone=${encodeURIComponent(phone)}` : '/customer/my-warranties'
  const { data } = await api.get(url)
  return data.data || []
}

export async function fetchMyInquiries(phone?: string) {
  const url = phone ? `/customer/my-inquiries?phone=${encodeURIComponent(phone)}` : '/customer/my-inquiries'
  const { data } = await api.get(url)
  return data.data || []
}

export async function createWarrantyRepair(payload: {
  imei: string
  symptom: string
  description?: string
  notes?: string
  customer_name?: string
  customer_phone?: string
}) {
  const { data } = await api.post('/warranties/repairs', {
    ...payload,
    description: payload.description || payload.symptom,
  })
  return data
}

