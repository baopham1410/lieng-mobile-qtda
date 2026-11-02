import type { ReactNode } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { AuthProvider } from '@/context/AuthContext'
import { LocaleProvider } from '@/context/LocaleContext'
import { Colors } from '@/constants/config'

function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>{children}</AuthProvider>
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
