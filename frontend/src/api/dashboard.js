import apiClient, { silentRequest } from './client'
import { mapPaginated } from '@/utils/apiFallback'

export async function fetchDashboard(config = {}) {
  const { data } = await apiClient.get('/reports/dashboard', config)
  const d = data.data
  return {
    stats: {
      revenueToday: d.today_revenue,
      ordersToday: d.today_orders,
      imeiInStock: d.imei_in_stock,
      revenueMonth: d.month_revenue,
      pendingImports: d.pending_imports,
      lowStockVariants: d.low_stock_variants,
    },
    revenueCostChart: d.revenue_cost_chart ?? null,
    deviceShareChart: d.device_share_chart ?? null,
    recentOrders: (d.recent_orders ?? []).map((o) => ({
      id: o.id,
      customer: o.customer,
      total: o.total,
      status: o.status,
      time: o.time,
    })),
    lowStockList: d.low_stock_list ?? [],
    staffActivity: (d.staff_activity ?? []).map((row) => ({
      id: row.id,
      staff: row.staff,
      role: row.role,
      title: row.title,
      description: row.description,
      link: row.link,
      module: row.module,
      at: row.at,
    })),
  }
}
