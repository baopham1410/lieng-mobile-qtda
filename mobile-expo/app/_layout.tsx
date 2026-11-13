import { useEffect, type ReactNode } from 'react'
import { Platform } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { AuthProvider } from '@/context/AuthContext'
import { LocaleProvider } from '@/context/LocaleContext'
import { StoreProvider } from '@/context/StoreContext'
import { Colors } from '@/constants/config'

function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (!(window as any).ZXing && !document.querySelector('script#zxing-lib')) {
        const s = document.createElement('script')
        s.id = 'zxing-lib'
        s.src = 'https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js'
        s.async = true
        s.onerror = () => {
          const s2 = document.createElement('script')
          s2.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js'
          s2.async = true
          document.head.appendChild(s2)
        }
        document.head.appendChild(s)
      }
    }
  }, [])

  return (
    <LocaleProvider>
      <AuthProvider>
        <StoreProvider>{children}</StoreProvider>
      </AuthProvider>
    </LocaleProvider>
  )
}

export default function RootLayout() {
  return (
    <Providers>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.canvas },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(app)" />
      </Stack>
    </Providers>
  )
}
