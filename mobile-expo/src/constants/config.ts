import Constants from 'expo-constants'

function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.includes('exp.direct')) {
      return `http://${host}:8080/api/v1`
    }
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  if (host) {
    return `http://${host}:8080/api/v1`
  }
  return envUrl || 'http://localhost:8080/api/v1'
}

/**
 * Theme đồng bộ AdminLayout web Lieng (#fdf2f2 + đỏ thương hiệu #7A0C10 + emerald + amber).
 */
export const API_BASE_URL = resolveApiBaseUrl()

export const APP_NAME = 'Quán Lieng'
export const APP_TAGLINE = 'Quản lý cửa hàng nhỏ'

export const TOKEN_KEY = 'auth_token'
export const USER_KEY = 'auth_user'

export const Colors = {
  /** Google Stitch - Premium Flagship Retail Theme */
  primary: '#550005',
  primaryContainer: '#7A0C10',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#FF8076',
  inversePrimary: '#FFB3AC',

  secondary: '#B32446',
  secondaryContainer: '#FE5E7A',
  secondaryFixed: '#FFD9DC',
  secondaryFixedDim: '#FFB2BA',
  onSecondaryFixed: '#400010',

  surface: '#F7F9FB',
  surfaceDim: '#D8DADC',
  surfaceBright: '#F7F9FB',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F2F4F6',
  surfaceContainer: '#ECEEF0',
  surfaceContainerHigh: '#E6E8EA',
  surfaceContainerHighest: '#E0E3E5',

  onSurface: '#191C1E',
  onSurfaceVariant: '#58413F',
  outline: '#8C716E',
  outlineVariant: '#DFBFBC',

  /** Đỏ thương hiệu (AuthLayout / sidebar tương thích) */
  brand: '#7A0C10',
  brandDeep: '#550005',
  brandSoft: '#B32446',

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
  canvas: '#F7F9FB',
  panel: '#FFFFFF',
  panelSoft: '#F2F4F6',
  panelWarm: '#FFF8F0',
  white: '#FFFFFF',
  ink: '#191C1E',

  /** Status - Emerald green */
  green: '#059669',
  greenDeep: '#047857',
  greenSoft: '#ECFDF5',
  greenBorder: '#A7F3D0',
  greenRing: '#6EE7B7',

  /** Status - Red */
  red: '#BA1A1A',
  redDeep: '#93000A',
  redSoft: '#FFDAD6',
  redBorder: '#FECACA',
  redRing: '#FCA5A5',

  /** Status - Sky Blue */
  blue: '#0284C7',
  blueDeep: '#0369A1',
  blueSoft: '#F0F9FF',
  blueBorder: '#BAE6FD',

  /** Slates & Grays */
  slate: '#58413F',
  slate400: '#8C716E',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slateLight: '#F2F4F6',
  slate50: '#F8FAFC',
  slate100: '#ECEEF0',
  slate200: '#E2E8F0',
  tabInactive: '#8C716E',

  /** Borders */
  border: '#DFBFBC',
  borderLight: '#ECEEF0',
  borderAmber: '#FDE68A',
  shadow: 'rgba(0, 0, 0, 0.05)',
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
