import { api } from './client'

export interface OwnerDashboardData {
  kpis: {
    revenue_today: number
    revenue_growth: string
    cash_in_vault: number
    vault_status: string
    total_orders: number
    completion_rate: string
    pending_approvals_count: number
    completed_orders?: number
    pending_orders?: number
    imei_in_stock?: number
    services_pending?: number
  }
  pending_approvals: Array<{
    id: string
    type: 'discount' | 'trade_in'
    badge: string
    time: string
    title: string
    info: string
    amount: number
    amount_formatted: string
    subtext: string
    order_code?: string
    order_id?: number
    ticket_code?: string
  }>
  recent_orders: Array<{
    id: number
    code: string
    device: string
    customer: string
    cashier: string
    total: number
    status: string
    status_label: string
    payment_method: string
    payment_label: string
    time: string
  }>
  store_info: {
    branch: string
    manager: string
    shift: string
  }
}

export interface VaultStatusData {
  shift_name: string
  status: string
  status_label: string
  opening_cash: number
  opening_cash_formatted: string
  cash_sales: number
  cash_sales_formatted: string
  operational_expenses: number
  operational_expenses_formatted: string
  actual_cash_in_vault: number
  actual_cash_in_vault_formatted: string
  target_revenue: number
  target_achieved_pct: number
  target_label: string
  branch: {
    name: string
    address: string
    manager: string
  }
  peripherals: {
    bill_printer: { name: string; status: string; status_label: string }
    pos_server: { name: string; latency: string; status_label: string }
  }
}

export async function getOwnerDashboard(): Promise<OwnerDashboardData> {
  const res = await api.get<{ data: OwnerDashboardData }>('/owner/dashboard')
  return res.data.data
}

export async function approveOwnerRequest(
  id: string,
  payload?: { type?: string; ticket_code?: string; order_code?: string }
): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>(`/owner/approvals/${id}/approve`, payload)
  return res.data
}

export async function rejectOwnerRequest(
  id: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>(`/owner/approvals/${id}/reject`, { reason })
  return res.data
}

export async function getVaultStatus(): Promise<VaultStatusData> {
  const res = await api.get<{ data: VaultStatusData }>('/owner/vault')
  return res.data.data
}

export async function recordVaultExpense(data: {
  amount: number
  title: string
  recipient?: string
  note?: string
}): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>('/owner/vault/expense', data)
  return res.data
}

export async function auditVault(counts: Record<string, number>): Promise<{
  success: boolean
  data: {
    total_counted: number
    total_counted_formatted: string
    difference: number
    difference_formatted: string
    is_balanced: boolean
  }
  message: string
}> {
  const res = await api.post('/owner/vault/audit', { counts })
  return res.data
}

export async function settleVault(note?: string): Promise<{
  success: boolean
  message: string
  data: {
    statement_code: string
    settled_at: string
    cash_handed_over: string
    print_copies: string[]
  }
}> {
  const res = await api.post('/owner/vault/settle', { note })
  return res.data
}

export async function approveOrderDiscount(orderIdOrCode: number | string): Promise<any> {
  const res = await api.post(`/orders/${orderIdOrCode}/approve-discount`)
  return res.data
}

export async function cancelAndRefundOrder(orderIdOrCode: number | string): Promise<any> {
  const res = await api.post(`/orders/${orderIdOrCode}/cancel-and-refund`)
  return res.data
}

export async function remindOrderPayment(orderIdOrCode: number | string): Promise<any> {
  const res = await api.post(`/orders/${orderIdOrCode}/remind-payment`)
  return res.data
}

export async function printOrderReceipt(orderIdOrCode: number | string): Promise<any> {
  const res = await api.post(`/orders/${orderIdOrCode}/print-receipt`)
  return res.data
}

export async function lookupWarrantyImei(imei: string): Promise<any> {
  const res = await api.get(`/warranties/lookup/${imei}`)
  return res.data.data
}

export async function getHubTickets(): Promise<any> {
  const res = await api.get('/warranties/hub-tickets')
  return res.data.data
}

export async function evaluateTradeIn(data: {
  model: string
  grade: 'S' | 'A' | 'B' | 'C'
  battery_health?: number
}): Promise<any> {
  const res = await api.post('/warranties/trade-in/evaluate', data)
  return res.data.data
}

export async function approveSpecialBuyback(ticketId: string, amount: number): Promise<any> {
  const res = await api.post(`/warranties/tickets/${ticketId}/approve-special-buyback`, {
    special_amount: amount,
  })
  return res.data
}

