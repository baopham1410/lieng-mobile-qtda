export type AppUser = {
  id: number
  name: string
  email: string
  phone?: string | null
  roleName?: string | null
  roleDisplayName?: string | null
  permissions?: string[]
  role?: any
}

export type QuanCategory = {
  value: string
  label: string
}

export type QuanProduct = {
  id: number
  name: string
  category: string
  categoryLabel: string
  price: number
  isActive: boolean
  sortOrder: number
}

export type QuanEntry = {
  id: number
  code?: string
  type: 'income' | 'expense' | string
  title: string
  quanProductId?: number | null
  qty: number
  amount: number
  paymentMethod?: string | null
  cashAmount: number
  transferAmount: number
  note?: string | null
  staffName?: string
  occurredAt?: string | null
}

export type QuanStats = {
  incomeToday: number
  expenseToday: number
  cashToday: number
  transferToday: number
  netToday: number
  salesCountToday: number
  expenseCountToday: number
}

export type QuanStatement = {
  id: number
  code: string
  statementDate: string
  incomeTotal: number
  expenseTotal: number
  cashTotal: number
  transferTotal: number
  netTotal: number
  salesCount: number
  expenseCount: number
  rowCount: number
  note?: string | null
  staffName?: string
  createdAt?: string
  updatedAt?: string
  rowsSnapshot?: QuanEntry[]
}

export function mapUser(json: Record<string, unknown>): AppUser {
  const role = json.role as Record<string, unknown> | null | undefined
  return {
    id: Number(json.id),
    name: String(json.name ?? ''),
    email: String(json.email ?? ''),
    phone: (json.phone as string) ?? null,
    roleName: role ? String(role.name ?? '') : null,
    roleDisplayName: role ? String(role.display_name ?? '') : null,
    permissions: Array.isArray(json.permissions)
      ? json.permissions.map(String)
      : [],
  }
}
