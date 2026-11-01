import { storeInfo } from '@/data/storeIntro'

export const mockAccounts = []

export function isMockToken(token) {
  return typeof token === 'string' && token.startsWith('mock-')
}

export function findMockAccount() {
  return null
}

export function findMockAccountByRole() {
  return null
}

export function getMockUserFromStorage() {
  return null
}

export function applyMockSession() {
  return { token: null, user: null }
}

export function clearMockSession() {}

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
