import { Ionicons } from '@expo/vector-icons'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Colors, Radius } from '@/constants/config'

const TAB_ICONS: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; iconOn: keyof typeof Ionicons.glyphMap; label: string }
> = {
  home: { icon: 'home-outline', iconOn: 'home', label: 'Trang chủ' },
  pos: { icon: 'calculator-outline', iconOn: 'calculator', label: 'Bán hàng' },
  orders: { icon: 'receipt-outline', iconOn: 'receipt', label: 'Đơn hàng' },
  services: { icon: 'construct-outline', iconOn: 'construct', label: 'Dịch vụ' },
  account: { icon: 'person-outline', iconOn: 'person', label: 'Tôi' },

  // Giữ fallback tạm cho route cũ nếu có
  quay: { icon: 'storefront-outline', iconOn: 'storefront', label: 'Quầy' },
  statement: { icon: 'stats-chart-outline', iconOn: 'stats-chart', label: 'Sao kê' },
  expense: { icon: 'add-circle-outline', iconOn: 'add-circle', label: 'Ghi chi' },
  archive: { icon: 'folder-open-outline', iconOn: 'folder-open', label: 'Kho' },
}

export function LiengTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const bottom = Math.max(insets.bottom, 10)

  // Danh sách các tab chính được hiển thị trên thanh tab bar
  const visibleTabs = ['home', 'pos', 'orders', 'services', 'account']

  const routesToRender = state.routes.filter((route) => visibleTabs.includes(route.name))

  return (
    <View style={[styles.wrap, { paddingBottom: bottom }]}>
      <View style={styles.bar}>
        {routesToRender.map((route) => {
          const actualIndex = state.routes.findIndex((r) => r.key === route.key)
          const focused = state.index === actualIndex
          const meta = TAB_ICONS[route.name] ?? {
            icon: 'ellipse-outline' as const,
            iconOn: 'ellipse' as const,
            label: route.name,
          }
          const { options } = descriptors[route.key]
          const label = options.title ?? meta.label

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params)
            }
          }

          // Nút POS ở giữa có phong cách nổi bật (FAB action)
          if (route.name === 'pos') {
            return (
              <View key={route.key} style={styles.centerSlot}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.fab,
                    focused && styles.fabFocused,
                    pressed && { opacity: 0.88, transform: [{ scale: 0.96 }] },
                  ]}
                >
                  <Ionicons name="calculator" size={26} color={Colors.white} />
                </Pressable>
                <Text style={[styles.fabLabel, focused && styles.fabLabelFocused]}>
                  {label}
                </Text>
              </View>
            )
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={[styles.item, focused && styles.itemFocused]}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={focused ? meta.iconOn : meta.icon}
                  size={20}
                  color={focused ? Colors.brand : Colors.slate500}
                />
                {options.tabBarBadge !== undefined && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{options.tabBarBadge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, focused && styles.labelOn]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    marginHorizontal: 12,
    backgroundColor: Colors.panel,
    borderRadius: Radius.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: 62,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand,
        shadowOpacity: 0.14,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: Radius.lg,
    gap: 3,
  },
  itemFocused: {
    backgroundColor: Colors.redSoft,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate500,
    textAlign: 'center',
  },
  labelOn: {
    color: Colors.brand,
    fontWeight: '800',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    top: -14,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand,
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  fabFocused: {
    backgroundColor: Colors.brandDeep,
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate500,
    marginTop: 2,
  },
  fabLabelFocused: {
    color: Colors.brand,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: Colors.brand,
    borderRadius: Radius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
})

