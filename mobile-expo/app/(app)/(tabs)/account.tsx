import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Card, Chip, Eyebrow, Muted, PrimaryButton, ScreenTitle } from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'

export default function AccountScreen() {
  const insets = useSafeAreaInsets()
  const { user, logout } = useAuth()
  const { locale, setLocale, t } = useLocale()

  const handleLogout = () => {
    Alert.alert(t('common.logout'), t('account.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.logout'),
        style: 'destructive',
        onPress: () => logout(),
      },
    ])
  }

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U'
  const roleName = user?.roleDisplayName || user?.roleName || t('account.roleFallback')

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xl }]}>
        <View style={styles.header}>
          <Eyebrow>{t('account.eyebrow')}</Eyebrow>
          <ScreenTitle>{t('account.title')}</ScreenTitle>
          <Muted>{t('account.hint')}</Muted>
        </View>

        {/* Profile Card */}
        <Card style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name ?? '—'}</Text>
              <Text style={styles.userEmail}>{user?.email ?? '—'}</Text>
              {!!user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
              <View style={styles.roleTag}>
                <Text style={styles.roleText}>{roleName}</Text>
              </View>
            </View>
          </View>
          <View style={styles.appBadgeRow}>
            <Text style={styles.appBadgeLabel}>{t('account.appLabel')}</Text>
            <Text style={styles.appBadgeValue}>v1.0.0 (Expo)</Text>
          </View>
        </Card>

        {/* Language Selection */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('common.language')}</Text>
          <View style={styles.langRow}>
            <Chip
              label={t('common.vietnamese')}
              active={locale === 'vi'}
              onPress={() => setLocale('vi')}
            />
            <Chip
              label={t('common.lao')}
              active={locale === 'lo'}
              onPress={() => setLocale('lo')}
            />
          </View>
        </Card>

        {/* Permissions */}
        {!!user?.permissions && user.permissions.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('account.perms')}</Text>
            <View style={styles.permsWrap}>
              {user.permissions.map((p) => (
                <View key={p} style={styles.permChip}>
                  <Text style={styles.permText}>{p}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Logout */}
        <View style={styles.logoutWrap}>
          <PrimaryButton
            label={t('common.logout')}
            tone="red"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  content: {
    padding: Space.lg,
    gap: Space.md,
  },
  header: {
    marginBottom: Space.xs,
  },
  userCard: {
    padding: Space.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.white,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.ink,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.slate,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: Colors.slate400,
    marginTop: 2,
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.amber100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand,
  },
  appBadgeRow: {
    marginTop: Space.md,
    paddingTop: Space.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appBadgeLabel: {
    fontSize: 12,
    color: Colors.slate,
    fontWeight: '600',
  },
  appBadgeValue: {
    fontSize: 12,
    color: Colors.slate400,
    fontWeight: '700',
  },
  sectionCard: {
    padding: Space.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: Space.sm,
  },
  langRow: {
    flexDirection: 'row',
    gap: Space.sm,
  },
  permsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.xs,
  },
  permChip: {
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  permText: {
    fontSize: 11,
    color: Colors.slate,
    fontWeight: '600',
  },
  logoutWrap: {
    marginTop: Space.md,
  },
})
