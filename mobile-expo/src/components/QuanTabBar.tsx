import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Colors, Radius } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import { canManageQuanStatements } from '@/utils/permissions'

export interface QuanTabBarProps {
  state: any
  descriptors: any
  navigation: any
}

const TAB_ICONS: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; iconOn: keyof typeof Ionicons.glyphMap; labelKey: string }
> = {
  index: { icon: 'storefront-outline', iconOn: 'storefront', labelKey: 'tab.quay' },
  quay: { icon: 'storefront-outline', iconOn: 'storefront', labelKey: 'tab.quay' },
  statement: { icon: 'stats-chart-outline', iconOn: 'stats-chart', labelKey: 'tab.statement' },
  expense: { icon: 'add', iconOn: 'add', labelKey: 'tab.expense' },
  archive: { icon: 'folder-open-outline', iconOn: 'folder-open', labelKey: 'tab.archive' },
  account: { icon: 'person-outline', iconOn: 'person', labelKey: 'tab.account' },
}

export function QuanTabBar({ state, descriptors, navigation }: QuanTabBarProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { t } = useLocale()
  const { user } = useAuth()
  const canArchive = canManageQuanStatements(user)
  const bottom = Math.max(insets.bottom, 10)

  return (
    <View style={[styles.wrap, { paddingBottom: bottom }]}>
      <View style={styles.bar}>
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index
          const meta = TAB_ICONS[route.name] ?? {
            icon: 'ellipse-outline' as const,
            iconOn: 'ellipse' as const,
            labelKey: route.name,
          }
          const { options } = descriptors[route.key]
          const label = t(meta.labelKey)
          const locked = route.name === 'archive' && !canArchive

          const onPress = () => {
            if (locked) {
              Alert.alert(t('perm.lockedTitle'), t('perm.lockedArchive'))
              return
            }
            let defaultPrevented = false
            if (navigation && typeof navigation.emit === 'function') {
              try {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                })
                defaultPrevented = !!event?.defaultPrevented
              } catch (e) {
                // Ignore emit error on web
              }
            }
            if (!focused && !defaultPrevented) {
              try {
                router.replace(`/(app)/(tabs)/${route.name}` as any)
              } catch (e) {
                if (navigation && typeof navigation.navigate === 'function') {
                  navigation.navigate(route.name, route.params)
                }
              }
            }
          }

          if (route.name === 'expense') {
            return (
              <View key={route.key} style={styles.centerSlot}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={options.title ?? label}
                  onPress={onPress}
                  style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
                >
                  <Ionicons name="add" size={30} color={Colors.white} />
                </Pressable>
                <Text style={styles.fabLabel}>{label}</Text>
              </View>
            )
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused, disabled: locked }}
              onPress={onPress}
              style={[
                styles.item,
                focused && styles.itemFocused,
                locked && styles.itemLocked,
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={focused ? meta.iconOn : meta.icon}
                  size={20}
                  color={locked ? Colors.slate400 : focused ? Colors.brand : Colors.slate500}
                />
                {locked ? (
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={9} color={Colors.white} />
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.label,
                  focused && !locked && styles.labelOn,
                  locked && styles.labelLocked,
                ]}
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
    paddingHorizontal: 4,
    borderRadius: Radius.lg,
    gap: 3,
  },
  itemFocused: {
    backgroundColor: Colors.redSoft,
  },
  itemLocked: {
    opacity: 0.45,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: Colors.slate400,
    borderRadius: 999,
    padding: 2,
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
  labelLocked: {
    color: Colors.slate400,
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
  fabLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand,
    marginTop: 2,
  },
})
