/**
 * Theme đồng bộ AdminLayout web Lieng (#fdf2f2 + đỏ thương hiệu #7A0C10 + emerald + amber).
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.2.164:8080/api/v1'

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
  amber: '#D97706',
  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber200: '#FDE68A',
  amber300: '#FCD34D',
  amber700: '#B45309',
  amber800: '#92400E',
  amber900: '#78350F',
  amberBorder: '#FDE68A',

  /** Nền shell web */
  canvas: '#FDF2F2',
  panel: '#FFFFFF',
  panelSoft: '#FFF7F7',
  panelWarm: '#FFF8F0',
  white: '#FFFFFF',
  ink: '#111118',

  /** Status - Emerald green (chuẩn Tailwind của Web) */
  green: '#059669',
  greenDeep: '#047857',
  greenSoft: '#ECFDF5',
  greenBorder: '#A7F3D0',
  greenRing: '#6EE7B7',

  /** Status - Red */
  red: '#DC2626',
  redDeep: '#B91C1C',
  redSoft: '#FEF2F2',
  redBorder: '#FECACA',
  redRing: '#FCA5A5',

  /** Status - Sky Blue */
  blue: '#0284C7',
  blueDeep: '#0369A1',
  blueSoft: '#F0F9FF',
  blueBorder: '#BAE6FD',

  /** Slates & Grays */
  slate: '#64748B',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slateLight: '#F1F5F9',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  tabInactive: '#94A3B8',

  /** Borders */
  border: '#FECACA',
  borderLight: '#FEE2E2',
  borderAmber: '#FDE68A',
  shadow: 'rgba(0, 0, 0, 0.04)',
} as const

export const Radius = {
  xs: 8,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const

export const Space = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const
