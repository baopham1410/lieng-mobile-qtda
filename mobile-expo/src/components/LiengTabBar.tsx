import { Ionicons } from '@expo/vector-icons'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Colors, Radius } from '@/constants/config'

const TAB_ICONS: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; iconOn: keyof typeof Ionicons.glyphMap; label: string }
> = {
  home: { icon: 'pie-chart-outline', iconOn: 'pie-chart', label: 'Tổng quan' },
  pos: { icon: 'cart-outline', iconOn: 'cart', label: 'Quầy POS' },
  orders: { icon: 'receipt-outline', iconOn: 'receipt', label: 'Đơn hàng' },
  services: { icon: 'shield-checkmark-outline', iconOn: 'shield-checkmark', label: 'Dịch vụ' },
  account: { icon: 'person-outline', iconOn: 'person', label: 'Tôi' },

  // Giữ fallback tạm cho route cũ nếu có
  quay: { icon: 'storefront-outline', iconOn: 'storefront', label: 'Quầy nhỏ' },
  statement: { icon: 'stats-chart-outline', iconOn: 'stats-chart', label: 'Sao kê' },
  expense: { icon: 'add-circle-outline', iconOn: 'add-circle', label: 'Ghi chi' },
  archive: { icon: 'folder-open-outline', iconOn: 'folder-open', label: 'Kho' },
}

export function LiengTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const bottom = Math.max(insets.bottom, 10)

  // Danh sách 5 tab chính chuẩn shell Lieng Mobile
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
          const isPos = route.name === 'pos'

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

          // Nút Quầy POS đồng mức, không bị nhô cao
          if (isPos) {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: focused }}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.posItem,
                  focused && styles.posItemFocused,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                ]}
              >
                <View style={[styles.posIconWrap, focused && styles.posIconWrapFocused]}>
                  <Ionicons
                    name={focused ? 'cart' : 'cart-outline'}
                    size={18}
                    color={focused ? Colors.white : Colors.brand}
                  />
                </View>
                <Text
                  style={[styles.posLabel, focused && styles.posLabelFocused]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            )
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={({ pressed }) => [
                styles.item,
                focused && styles.itemFocused,
                pressed && { opacity: 0.8 },
              ]}
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
    marginHorizontal: 14,
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 7,
    minHeight: 62,
    borderWidth: 1,
    borderColor: '#FECACA', // viền đỏ nhạt border-red-200 chuẩn web
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },

  // ── Các tab thông thường ──
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRadius: Radius.lg,
    gap: 3,
  },
  itemFocused: {
    backgroundColor: '#FEF2F2',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 24,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.slate500,
    textAlign: 'center',
  },
  labelOn: {
    color: Colors.brand,
    fontWeight: '800',
  },

  // ── Nút Quầy POS đồng đều, không nhô cao ──
  posItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: Radius.lg,
    gap: 3,
  },
  posItemFocused: {
    backgroundColor: '#FEF2F2',
  },
  posIconWrap: {
    width: 32,
    height: 25,
    borderRadius: Radius.full,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posIconWrapFocused: {
    backgroundColor: Colors.brand,
  },
  posLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: Colors.brand,
    textAlign: 'center',
  },
  posLabelFocused: {
    color: Colors.brandDeep,
    fontWeight: '900',
  },

  // ── Huy hiệu đếm số ──
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.brand,
    borderRadius: Radius.full,
    paddingHorizontal: 4,
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
