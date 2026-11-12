import { Tabs } from 'expo-router'

import { LiengTabBar } from '@/components/LiengTabBar'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiengTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="home"
    >
      {/* 5 Tab chính của Shell Cửa hàng Lieng Mobile theo chuẩn Google Stitch */}
      <Tabs.Screen name="home" options={{ title: 'Tổng quan' }} />
      <Tabs.Screen name="orders" options={{ title: 'Đơn hàng' }} />
      <Tabs.Screen name="pos" options={{ title: 'Quầy POS' }} />
      <Tabs.Screen name="services" options={{ title: 'Dịch vụ' }} />
      <Tabs.Screen name="account" options={{ title: 'Tôi' }} />

      {/* Module Quán cũ (được giữ làm sub-screen, không hiển thị trên TabBar chính) */}
      <Tabs.Screen name="quay" options={{ title: 'Quầy nhỏ' }} />
      <Tabs.Screen name="statement" options={{ title: 'Sao kê quán' }} />
      <Tabs.Screen name="expense" options={{ title: 'Ghi chi' }} />
      <Tabs.Screen name="archive" options={{ title: 'Kho sao kê' }} />
    </Tabs>
  )
}
