/** Theme đồng bộ AdminLayout web Lieng (#fdf2f2 + đỏ thương hiệu). */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.247:8080/api/v1'

export const APP_NAME = 'Quán Lieng'
export const APP_TAGLINE = 'Quản lý cửa hàng nhỏ'

export const TOKEN_KEY = 'auth_token'
export const USER_KEY = 'auth_user'

export const Colors = {
  /** Đỏ thương hiệu (AuthLayout / sidebar) */
  brand: '#7A0C10',
  brandDeep: '#5B0B0F',
  brandSoft: '#9F1239',
  /** Accent đỏ */
  accent: '#DC2626',
  amber: '#DC2626',
  amber700: '#B91C1C',
  /** Nền shell web */
  amberSoft: '#FDF2F2',
  amber50: '#FEF2F2',
  amber100: '#FEE2E2',
  amberBorder: '#FECACA',
  amberRing: '#FCA5A5',
  canvas: '#FDF2F2',
  panel: '#FFF7F7',
  white: '#FFFFFF',
  ink: '#111118',
  /** Status */
  green: '#047857',
  greenSoft: '#ECFDF5',
  greenBorder: '#A7F3D0',
  red: '#DC2626',
  redSoft: '#FEF2F2',
  redBorder: '#FECACA',
  blue: '#0369A1',
  blueSoft: '#F0F9FF',
  slate: '#64748B',
  slate400: '#94A3B8',
  slateLight: '#F1F5F9',
  tabInactive: '#94A3B8',
  border: '#FECACA',
  shadow: 'rgba(122,12,16,0.08)',
} as const

export const Radius = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
} as const

export const Space = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
} as const
