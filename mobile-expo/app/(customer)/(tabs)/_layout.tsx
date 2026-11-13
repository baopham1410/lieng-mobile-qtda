import { Tabs } from 'expo-router'
import { CustomerTabBar } from '@/components/CustomerTabBar'

export default function CustomerTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomerTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Trang chủ',
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Cửa hàng',
        }}
      />
      <Tabs.Screen
        name="trade-in"
        options={{
          title: 'Thu cũ AI',
        }}
      />
      <Tabs.Screen
        name="warranty"
        options={{
          title: 'Bảo hành',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tôi',
        }}
      />
    </Tabs>
  )
}
