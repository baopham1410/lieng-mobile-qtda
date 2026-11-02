import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ActivityIndicator, View } from 'react-native'

import { Colors } from '@/constants/config'
import {
  categoryLabel,
  LOCALE_KEY,
  translate,
  type AppLocale,
} from '@/i18n/messages'

type LocaleContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => Promise<void>
  t: (key: string, params?: Record<string, string | number>) => string
  cat: (value: string, fallback?: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('vi')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCALE_KEY)
        if (saved === 'vi' || saved === 'lo') setLocaleState(saved)
      } finally {
        setReady(true)
      }
    })()
  }, [])

  const setLocale = useCallback(async (next: AppLocale) => {
    setLocaleState(next)
    await AsyncStorage.setItem(LOCALE_KEY, next)
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  )

  const cat = useCallback(
    (value: string, fallback?: string) => categoryLabel(locale, value, fallback),
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t, cat }),
    [locale, setLocale, t, cat],
  )

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.canvas,
        }}
      >
        <ActivityIndicator color={Colors.brand} />
      </View>
    )
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
