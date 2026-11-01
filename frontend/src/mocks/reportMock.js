import { formatCurrency, formatMoney, parseMoneyInput } from '@/utils/formatCurrency'

export { formatCurrency, formatMoney, parseMoneyInput }

export const reportSummaryByPeriod = {
  week: { revenue: 0, profit: 0, orders: 0, avgOrder: 0, growth: 0, imeiInStock: 0, lowStock: 0 },
  month: { revenue: 0, profit: 0, orders: 0, avgOrder: 0, growth: 0, imeiInStock: 0, lowStock: 0 },
  quarter: { revenue: 0, profit: 0, orders: 0, avgOrder: 0, growth: 0, imeiInStock: 0, lowStock: 0 },
}

export const dailyRevenue = []

export const monthlyRevenue = []

export const expenseBreakdown = []

export const incomeBreakdown = []

export const topProducts = []

export const inventoryByCategory = []

export const lowStockAlerts = []

export function formatCompact(value) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} tr`
  return formatCurrency(value)
}

export function formatPercent(value) {
  return `${value >= 0 ? '+' : ''}${value}%`
}
