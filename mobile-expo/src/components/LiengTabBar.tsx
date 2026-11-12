import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Radius } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { canManageQuanStatements, getVisibleTabs } from '@/utils/permissions'

export interface BottomTabBarProps {
  state: any
  descriptors: any
  navigation?: any
  emitter?: any
  navigateToTab?: (key: string) => void
  insets?: any
}

const TAB_ICONS: Record<
  string,
  {
    iconType?: 'material' | 'ionicons'
    icon: string
    iconOn: string
    label: string
  }
> = {
  home: { icon: 'grid-outline', iconOn: 'grid', label: 'Tổng quan' },
  orders: { icon: 'receipt-outline', iconOn: 'receipt', label: 'Đơn hàng' },
  pos: { iconType: 'material', icon: 'point-of-sale', iconOn: 'point-of-sale', label: 'Quầy POS' },
  services: { icon: 'shield-checkmark-outline', iconOn: 'shield-checkmark', label: 'Dịch vụ' },
  quay: { icon: 'storefront-outline', iconOn: 'storefront', label: 'Quầy Quán' },
  statement: { icon: 'stats-chart-outline', iconOn: 'stats-chart', label: 'Sao kê' },
  expense: { icon: 'add-circle-outline', iconOn: 'add-circle', label: 'Chi phí' },
  archive: { icon: 'folder-open-outline', iconOn: 'folder-open', label: 'Kho lưu' },
  account: { icon: 'person-circle-outline', iconOn: 'person-circle', label: 'Tôi' },
}

export function LiengTabBar(props: BottomTabBarProps) {
  const { state, descriptors, navigation, emitter, navigateToTab } = props
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const bottom = Math.max(insets.bottom, 6)
  const canArchive = canManageQuanStatements(user)

  // Hiển thị các tab được phân quyền theo vai trò người dùng
  const visibleTabs = getVisibleTabs(user)
  const routesToRender = visibleTabs
    .map((name) => state?.routes?.find((r: any) => r.name === name))
    .filter(Boolean) as any[]

  return (
    <View style={[styles.wrap, { paddingBottom: bottom }]}>
      <View style={styles.bar}>
        {routesToRender.map((route: any) => {
          const actualIndex = state.routes.findIndex((r: any) => r.key === route.key)
          const focused = state.index === actualIndex
          const meta = TAB_ICONS[route.name] ?? {
            icon: 'ellipse-outline',
            iconOn: 'ellipse',
            label: route.name,
          }
          const options = descriptors?.[route.key]?.options ?? {}
          const label = options.title ?? meta.label
          const locked = route.name === 'archive' && !canArchive

          const onPress = () => {
            if (locked && Platform.OS !== 'web') {
              Alert.alert(
                'Chức năng bị khóa',
                'Chỉ Quản lý Quán hoặc Admin mới có quyền xem & chốt Kho sao kê.'
              )
              return
            }
            if (emitter && typeof emitter.emit === 'function') {
              try {
                const event = emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                })
                if (event?.defaultPrevented) return
              } catch (e) {
                // Ignore emit error
              }
            } else if (navigation && typeof navigation.emit === 'function') {
              try {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                })
                if (event?.defaultPrevented) return
              } catch (e) {
                // Ignore emit error
              }
            }

            if (!focused) {
              if (typeof navigateToTab === 'function') {
                try {
                  navigateToTab(route.key)
                  return
                } catch (e) {}
              }
              try {
                router.replace(`/(app)/(tabs)/${route.name}` as any)
              } catch (err) {
                router.push(`/(app)/(tabs)/${route.name}` as any)
              }
            }
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
                locked && { opacity: 0.48 },
                pressed && { opacity: 0.8 },
              ]}
            >
              {focused ? (
                // Khi bấm vào bất kỳ tab nào: có hình tròn đỏ đô bao quanh và phóng to
                <View style={styles.activeCircle}>
                  {meta.iconType === 'material' ? (
                    <MaterialIcons name={meta.iconOn as any} size={25} color="#FFFFFF" />
                  ) : (
                    <Ionicons name={meta.iconOn as any} size={24} color="#FFFFFF" />
                  )}
                  {options.tabBarBadge !== undefined && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{options.tabBarBadge}</Text>
                    </View>
                  )}
                </View>
              ) : (
                // Khi chưa chọn: nằm thẳng hàng bình thường với các mục khác
                <View style={styles.inactiveIconBox}>
                  {meta.iconType === 'material' ? (
                    <MaterialIcons name={meta.icon as any} size={22} color="#58413F" />
                  ) : (
                    <Ionicons name={meta.icon as any} size={22} color="#58413F" />
                  )}
                  {locked && (
                    <View style={styles.lockPin}>
                      <Ionicons name="lock-closed" size={9} color="#991B1B" />
                    </View>
                  )}
                  {options.tabBarBadge !== undefined && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{options.tabBarBadge}</Text>
                    </View>
                  )}
                </View>
              )}

              <Text style={[styles.label, focused && styles.labelFocused]} numberOfLines={1}>
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
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: '#ECEEF0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -3 },
      },
      android: { elevation: 8 },
      default: {
        shadowColor: 'rgba(0,0,0,0.06)',
        shadowOffset: { width: 0, height: -3 },
        shadowRadius: 12,
      },
    }),
  },

  // ── Tab Item ──
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minHeight: 52,
    gap: 3,
  },
  lockPin: {
    position: 'absolute',
    top: -3,
    right: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Khi tab được chọn (focused): có hình tròn đỏ đô bao quanh và phóng to ──
  activeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7A0C10',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10, // Nổi tròn nhẹ cân đối
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#7A0C10',
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
      default: {
        boxShadow: '0 4px 12px rgba(122, 12, 16, 0.35)',
      },
    }),
  },

  // ── Khi tab chưa được chọn ──
  inactiveIconBox: {
    width: 38,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#58413F',
    textAlign: 'center',
  },
  labelFocused: {
    color: '#7A0C10',
    fontWeight: '700',
    fontSize: 11.5,
  },

  // ── Badge ──
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#B32446',
    borderRadius: Radius.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
})
