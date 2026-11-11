import { Ionicons } from '@expo/vector-icons'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Colors, Radius } from '@/constants/config'

const TAB_ICONS: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; iconOn: keyof typeof Ionicons.glyphMap; label: string }
> = {
  home: { icon: 'grid-outline', iconOn: 'grid', label: 'Tổng quan' },
  orders: { icon: 'receipt-outline', iconOn: 'receipt', label: 'Đơn hàng' },
  pos: { icon: 'storefront-outline', iconOn: 'storefront', label: 'Quầy POS' },
  services: { icon: 'shield-checkmark-outline', iconOn: 'shield-checkmark', label: 'Dịch vụ' },
  account: { icon: 'person-circle-outline', iconOn: 'person-circle', label: 'Tôi' },
}

export function LiengTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const bottom = Math.max(insets.bottom, 6)

  // Thứ tự 5 tab chuẩn Google Stitch: Tổng quan -> Đơn hàng -> Quầy POS (nổi bật) -> Dịch vụ -> Tôi
  const visibleTabs = ['home', 'orders', 'pos', 'services', 'account']
  const routesToRender = visibleTabs
    .map((name) => state.routes.find((r) => r.name === name))
    .filter(Boolean) as (typeof state.routes)[number][]

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

          // Nút Quầy POS nổi bật trung tâm (Google Stitch Floating Hub)
          if (isPos) {
            return (
              <View key={route.key} style={styles.posCenterSlot}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: focused }}
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.posElevatedBtn,
                    pressed && { transform: [{ scale: 0.94 }] },
                  ]}
                >
                  <View style={[styles.posFabCircle, focused && styles.posFabCircleFocused]}>
                    <Ionicons name="card-outline" size={26} color={Colors.white} />
                  </View>
                  <Text style={[styles.posLabel, focused && styles.posLabelFocused]}>
                    {label}
                  </Text>
                </Pressable>
              </View>
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
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={focused ? meta.iconOn : meta.icon}
                  size={22}
                  color={focused ? Colors.primaryContainer : Colors.onSurfaceVariant}
                />
                {options.tabBarBadge !== undefined && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{options.tabBarBadge}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.label, focused && styles.labelFocused]}
                numberOfLines={1}
              >
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
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: '#ECEEF0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 12 },
      default: {
        shadowColor: 'rgba(0,0,0,0.06)',
        shadowOffset: { width: 0, height: -4 },
        shadowRadius: 16,
      },
    }),
  },

  // ── Tab thông thường ──
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minHeight: 48,
    gap: 3,
  },
  itemFocused: {},
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  labelFocused: {
    color: Colors.primaryContainer,
    fontWeight: '700',
  },

  // ── Tab Quầy POS Center FAB ──
  posCenterSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 48,
  },
  posElevatedBtn: {
    position: 'absolute',
    top: -24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posFabCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryContainer, // #7A0C10 chuẩn Stitch
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7A0C10',
        shadowOpacity: 0.38,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  posFabCircleFocused: {
    backgroundColor: Colors.primary,
  },
  posLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryContainer,
    marginTop: 4,
    textAlign: 'center',
  },
  posLabelFocused: {
    color: Colors.primary,
    fontWeight: '800',
  },

  // ── Badge ──
  badge: {
    position: 'absolute',
    top: -3,
    right: -8,
    backgroundColor: Colors.secondary,
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
