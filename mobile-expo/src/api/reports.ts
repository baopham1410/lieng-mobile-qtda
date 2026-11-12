import { api } from './client'

export interface DashboardReportData {
  today_revenue: number
  today_orders: number
  month_revenue: number
  month_profit: number
  imei_in_stock: number
  pending_imports: number
  low_stock_variants: number
  recent_orders?: Array<{
    id: string
    customer: string
    total: number
    status: string
    time: string
  }>
  revenue_cost_chart?: {
    monthly?: {
      summary?: {
        growth?: number
      }
    }
  }
}

export async function fetchDashboardReport(): Promise<DashboardReportData | null> {
  try {
    const { data } = await api.get('/reports/dashboard')
    return data?.data ?? data
  } catch {
    return null
  }
}

export async function fetchProfileSummary() {
  try {
    const { data } = await api.get('/profile/summary')
    return data?.data ?? data
  } catch {
    return null
  }
}
