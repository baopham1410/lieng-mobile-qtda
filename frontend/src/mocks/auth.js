import { storeInfo } from '@/data/storeIntro'
import { DEMO_PASSWORD } from '@/data/demoAccounts'

export const rolePermissions = {
  admin: [
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'categories.view',
    'categories.manage',
    'imei.view',
    'imei.manage',
    'imei.status',
    'stock_imports.view',
    'stock_imports.create',
    'stock_imports.confirm',
    'orders.view',
    'orders.create',
    'orders.checkout',
    'orders.cancel',
    'customers.view',
    'customers.create',
    'customers.update',
    'finance.view',
    'finance.manage',
    'finance.reports',
    'warranty.view',
    'warranty.repair',
    'users.view',
    'users.manage',
    'quan.view',
    'quan.create',
    'quan.delete',
    'quan.statements',
  ],
  sales_staff: [
    'products.view',
    'imei.view',
    'orders.view',
    'orders.create',
    'orders.checkout',
    'orders.cancel',
    'customers.view',
    'customers.create',
    'customers.update',
    'warranty.view',
    'warranty.repair',
  ],
  warehouse_staff: [
    'products.view',
    'products.create',
    'imei.view',
    'imei.manage',
    'imei.status',
    'stock_imports.view',
    'stock_imports.create',
    'stock_imports.confirm',
    'customers.view',
    'warranty.view',
    'finance.reports',
  ],
  quan_manager: [
    'quan.view',
    'quan.create',
    'quan.delete',
    'quan.statements',
  ],
  quan_staff: [
    'quan.view',
    'quan.create',
  ],
}

export const mockAccounts = [
  {
    id: 1,
    role: 'admin',
    label: 'Quản lý',
    name: 'Admin Lieng',
    email: 'admin@liengmobile.com',
    phone: '0900000000',
    password: DEMO_PASSWORD,
    is_active: true,
  },
  {
    id: 2,
    role: 'sales_staff',
    label: 'Bán hàng',
    name: 'Nguyễn Thu Hà',
    email: 'banhang@liengmobile.com',
    phone: '0901111111',
    password: DEMO_PASSWORD,
    is_active: true,
  },
  {
    id: 3,
    role: 'warehouse_staff',
    label: 'Kho',
    name: 'Trần Minh Kho',
    email: 'kho@liengmobile.com',
    phone: '0902222222',
    password: DEMO_PASSWORD,
    is_active: true,
  },
  {
    id: 4,
    role: 'quan_manager',
    label: 'Admin Quán',
    name: 'Chủ Quán',
    email: 'quan@liengmobile.com',
    phone: '0903333333',
    password: DEMO_PASSWORD,
    is_active: true,
  },
  {
    id: 5,
    role: 'quan_staff',
    label: 'NV Quán',
    name: 'Nhân viên Quán',
    email: 'nvquan@liengmobile.com',
    phone: '0904444444',
    password: DEMO_PASSWORD,
    is_active: true,
  },
]

export function isMockToken(token) {
  return typeof token === 'string' && token.startsWith('mock-')
}

export function createMockUser(account) {
  const roleIdMap = {
    admin: 1,
    sales_staff: 2,
    warehouse_staff: 3,
    quan_manager: 4,
    quan_staff: 5,
  }
  const roleDisplayMap = {
    admin: 'Quản trị viên',
    sales_staff: 'Nhân viên bán hàng',
    warehouse_staff: 'Nhân viên kho',
    quan_manager: 'Quản lý Quán',
    quan_staff: 'Nhân viên Quán',
  }

  const roleName = account.role || 'admin'
  const roleId = roleIdMap[roleName] || 1

  return {
    id: account.id || roleId,
    name: account.name,
    email: account.email,
    phone: account.phone || '0900000000',
    avatar_url: account.avatar_url || null,
    is_active: account.is_active ?? true,
    role: {
      id: roleId,
      name: roleName,
      display_name: roleDisplayMap[roleName] || account.label || roleName,
    },
    role_name: roleName,
    permissions: rolePermissions[roleName] || [],
    created_at: '2026-01-01T00:00:00.000000Z',
    updated_at: '2026-01-01T00:00:00.000000Z',
  }
}

export function findMockAccount(email, password) {
  const normEmail = String(email || '').trim().toLowerCase()
  if (password !== undefined && password !== DEMO_PASSWORD) {
    return null
  }
  return mockAccounts.find((a) => a.email.toLowerCase() === normEmail) || null
}

export function findMockAccountByRole(role) {
  return mockAccounts.find((a) => a.role === role) || null
}

export function getMockUserFromStorage() {
  try {
    const raw = localStorage.getItem('mock_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function applyMockSession(account) {
  const user = createMockUser(account)
  const token = `mock-token-${account.role}-${Date.now()}`
  localStorage.setItem('token', token)
  localStorage.setItem('mock_user', JSON.stringify(user))
  return { token, user }
}

export function clearMockSession() {
  localStorage.removeItem('mock_user')
}

export const activeBranch = {
  code: 'LM-Q5-01',
  name: `${storeInfo.name} — Chi nhánh chính`,
  address: storeInfo.address,
  hotline: storeInfo.hotlineDisplay,
  hours: storeInfo.hours,
  branchesTotal: storeInfo.branches,
}

export const loginCopy = {
  inactiveAccount: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản lý cửa hàng.',
}
