import { Tabs } from 'expo-router'

import { QuanTabBar } from '@/components/QuanTabBar'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <QuanTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="quay" options={{ title: 'Quầy' }} />
      <Tabs.Screen name="statement" options={{ title: 'Sao kê' }} />
      <Tabs.Screen name="expense" options={{ title: 'Ghi chi' }} />
      <Tabs.Screen name="archive" options={{ title: 'Kho' }} />
      <Tabs.Screen name="account" options={{ title: 'Tôi' }} />
    </Tabs>
  )
}
