import { formatCurrency, formatMoney, formatStatementMoney, parseMoneyInput } from '@/utils/formatCurrency'

export { formatCurrency, formatMoney, formatStatementMoney, parseMoneyInput }

export const financeStats = {
  incomeToday: 0,
  expenseToday: 0,
  netToday: 0,
  balanceMonth: 0,
  incomeMonth: 0,
  expenseMonth: 0,
}

export const transactionTypeOptions = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'income', label: 'Phiếu thu' },
  { value: 'expense', label: 'Phiếu chi' },
]

export const transactionCategoryOptions = [
  { value: 'all', label: 'Tất cả danh mục' },
  { value: 'sales', label: 'Bán hàng' },
  { value: 'import', label: 'Nhập hàng' },
  { value: 'operating', label: 'Vận hành' },
  { value: 'other', label: 'Khác' },
]

export const expenseCategories = []

export const transactionTypeLabels = {
  income: 'Thu',
  expense: 'Chi',
}

export const transactionTypeClass = {
  income: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  expense: 'bg-red-50 text-red-600 ring-red-100',
}

export const categoryLabels = {
  sales: 'Bán hàng',
  import: 'Nhập hàng',
  operating: 'Vận hành',
  other: 'Khác',
}

export const referenceTypeLabels = {
  Order: 'Đơn bán hàng',
  StockImport: 'Phiếu nhập kho',
  Manual: 'Thủ công',
}

export const paymentMethodLabels = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  ewallet: 'Ví điện tử',
  mixed: 'Cả hai',
}

export const transactionRows = []

export function formatTransactionTime(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function signedAmount(type, amount) {
  const prefix = type === 'income' ? '+' : '−'
  return `${prefix}${formatCurrency(amount)}`
}
