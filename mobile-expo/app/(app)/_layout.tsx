import { Redirect, Stack } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'

import { Colors } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'

export default function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.canvas,
        }}
      >
        <ActivityIndicator color={Colors.brand} size="large" />
      </View>
    )
  }

  if (!user) return <Redirect href="/login" />

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.canvas } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="statement/[id]"
        options={{
          headerShown: true,
          title: 'Chi tiết sao kê',
          headerStyle: { backgroundColor: Colors.white },
          headerTintColor: Colors.brand,
          headerTitleStyle: { fontWeight: '900' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.canvas },
        }}
      />
    </Stack>
  )
}
