import { Ionicons } from '@expo/vector-icons'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Colors, Radius } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import { canManageQuanStatements } from '@/utils/permissions'

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

export function QuanTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { t } = useLocale()
  const { user } = useAuth()
  const canArchive = canManageQuanStatements(user)
  const bottom = Math.max(insets.bottom, 10)

  return (
    <View style={[styles.wrap, { paddingBottom: bottom }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
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
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params)
            }
          }

          if (route.name === 'expense') {
            return (
              <View key={route.key} style={styles.centerSlot}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={options.title ?? label}
                  onPress={onPress}
                  style={styles.fab}
                >
                  <Ionicons name="add" size={32} color={Colors.white} />
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
              style={[styles.item, locked && styles.itemLocked]}
            >
              <View>
                <Ionicons
                  name={focused ? meta.iconOn : meta.icon}
                  size={22}
                  color={locked ? Colors.slate400 : focused ? Colors.brand : Colors.tabInactive}
                />
                {locked ? (
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={10} color={Colors.white} />
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.label,
                  focused && !locked && styles.labelOn,
                  locked && styles.labelLocked,
                ]}
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
    marginHorizontal: 16,
    backgroundColor: Colors.panel,
    borderRadius: Radius.xxl,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
    minHeight: 64,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand,
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingBottom: 4,
    minHeight: 48,
  },
  itemLocked: { opacity: 0.72 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.tabInactive,
  },
  labelOn: { color: Colors.brand },
  labelLocked: { color: Colors.slate400 },
  lockBadge: {
    position: 'absolute',
    right: -6,
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSlot: {
    width: 72,
    alignItems: 'center',
    marginTop: -28,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.canvas,
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  fabLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand,
  },
})
