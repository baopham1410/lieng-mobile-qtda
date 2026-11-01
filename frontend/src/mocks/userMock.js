const STORAGE_KEY = 'mock_staff_users'

export const roleOptions = [
  { id: 1, name: 'admin', display_name: 'Quản trị viên' },
  { id: 2, name: 'sales_staff', display_name: 'Nhân viên bán hàng' },
  { id: 3, name: 'warehouse_staff', display_name: 'Nhân viên kho' },
  { id: 4, name: 'quan_manager', display_name: 'Admin Quán' },
  { id: 5, name: 'quan_staff', display_name: 'Nhân viên Quán' },
]

export const staffRoleOptions = roleOptions.filter((r) => r.name !== 'admin')

export const roleBadgeClass = {
  admin: 'bg-red-100 text-red-700 ring-red-200',
  sales_staff: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  warehouse_staff: 'bg-blue-100 text-blue-700 ring-blue-200',
  quan_manager: 'bg-amber-100 text-amber-800 ring-amber-200',
  quan_staff: 'bg-orange-100 text-orange-800 ring-orange-200',
}

const seedUsers = []

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return structuredClone(seedUsers)
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export function getMockUsers() {
  return loadUsers()
}

export function getMockUserStats(users) {
  const list = users ?? loadUsers()
  return {
    total: list.length,
    active: list.filter((u) => u.is_active).length,
    sales: list.filter((u) => u.role?.name === 'sales_staff').length,
    warehouse: list.filter((u) => u.role?.name === 'warehouse_staff').length,
  }
}

export function createMockUser(payload) {
  const users = loadUsers()
  const role = roleOptions.find((r) => r.id === Number(payload.role_id))
  const user = {
    id: Math.max(0, ...users.map((u) => u.id)) + 1,
    name: payload.name,
    email: payload.email,
    phone: payload.phone || '',
    is_active: payload.is_active !== false,
    role,
    created_at: new Date().toISOString(),
  }
  users.unshift(user)
  saveUsers(users)
  return user
}

export function updateMockUser(id, payload) {
  const users = loadUsers()
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) return null

  const role = payload.role_id
    ? roleOptions.find((r) => r.id === Number(payload.role_id))
    : users[index].role

  users[index] = {
    ...users[index],
    ...payload,
    role: role ?? users[index].role,
  }
  saveUsers(users)
  return users[index]
}

export function deleteMockUser(id) {
  const users = loadUsers().filter((u) => u.id !== id)
  saveUsers(users)
}

export function getInitials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function formatStaffDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
