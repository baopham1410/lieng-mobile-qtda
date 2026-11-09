import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Card, Chip, Eyebrow, Muted, PrimaryButton, ScreenTitle } from '@/components/ui'
import { API_BASE_URL, Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'

export default function AccountScreen() {
  const insets = useSafeAreaInsets()
  const { user, logout } = useAuth()
  const { locale, setLocale, t } = useLocale()

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await logout()
      } finally {
        router.replace('/login')
      }
    }

    if (Platform.OS === 'web') {
      await doLogout()
    } else {
      Alert.alert(t('common.logout'), t('account.logoutConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.logout'),
          style: 'destructive',
          onPress: doLogout,
        },
      ])
    }
  }

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U'
  const roleName = user?.roleDisplayName || user?.roleName || t('account.roleFallback')

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
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
              {!!user?.phone && (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={13} color={Colors.slate400} />
                  <Text style={styles.userPhone}>{user.phone}</Text>
                </View>
              )}
              <View style={styles.roleTag}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.brand} />
                <Text style={styles.roleText}>{roleName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.appBadgeRow}>
            <View style={styles.badgeCol}>
              <Text style={styles.appBadgeLabel}>{t('account.appLabel')}</Text>
              <Text style={styles.appBadgeValue}>v1.0.0 (Expo Mobile)</Text>
            </View>
            <View style={styles.badgeColRight}>
              <Text style={styles.appBadgeLabel}>Hệ thống</Text>
              <Text style={styles.appBadgeValue}>Lieng Mobile POS</Text>
            </View>
          </View>
        </Card>

        {/* Language Selection */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="language-outline" size={18} color={Colors.brand} />
            <Text style={styles.sectionTitle}>{t('common.language')}</Text>
          </View>
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

        {/* Feature Roadmap - Thẩm định máy */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="construct-outline" size={18} color={Colors.amber900} />
            <Text style={styles.sectionTitle}>Tính năng mở rộng (Roadmap)</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/appraisal')}
            style={({ pressed }) => [styles.appraisalLink, pressed && { opacity: 0.75 }]}
          >
            <View style={styles.appraisalLeft}>
              <View style={styles.appraisalIconWrap}>
                <Ionicons name="phone-portrait-outline" size={18} color={Colors.amber900} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.appraisalName}>Thẩm định máy cũ (AutoGrade)</Text>
                  <View style={styles.devTag}>
                    <Text style={styles.devTagText}>Đang phát triển</Text>
                  </View>
                </View>
                <Text style={styles.appraisalDesc}>
                  Định giá máy cũ thu đổi khách mang đến quầy (#125)
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.slate400} />
          </Pressable>
        </Card>

        {/* Lối tắt vào Module Quán nhỏ cũ (Dành riêng cho Quán) */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="storefront-outline" size={18} color={Colors.greenDeep} />
            <Text style={styles.sectionTitle}>Module phụ: Quán nhỏ</Text>
          </View>
          <Text style={styles.legacyDesc}>
            Dành riêng cho nhân viên quầy giải khát / tạp hóa phụ trợ của cửa hàng.
          </Text>
          <View style={styles.legacyBtnRow}>
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/quay')}
              style={styles.legacySubBtn}
            >
              <Ionicons name="receipt-outline" size={15} color={Colors.brand} />
              <Text style={styles.legacySubBtnText}>Mở Quầy nhỏ</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/statement')}
              style={styles.legacySubBtn}
            >
              <Ionicons name="stats-chart-outline" size={15} color={Colors.brand} />
              <Text style={styles.legacySubBtnText}>Sao kê quán</Text>
            </Pressable>
          </View>
        </Card>

        {/* Network & API Endpoint Info */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="server-outline" size={16} color={Colors.slate} />
            <Text style={styles.sectionTitle}>Thông tin máy chủ</Text>
          </View>
          <View style={styles.serverInfoBox}>
            <Text style={styles.serverInfoLabel}>API Base URL:</Text>
            <Text style={styles.serverInfoVal} numberOfLines={1}>
              {API_BASE_URL}
            </Text>
          </View>
        </Card>

        {/* Permissions */}
        {!!user?.permissions && user.permissions.length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="key-outline" size={18} color={Colors.amber700} />
              <Text style={styles.sectionTitle}>{t('account.perms')}</Text>
            </View>
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
            icon="log-out-outline"
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
    padding: Space.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderColor: Colors.border,
    borderWidth: 1,
    shadowColor: Colors.brand,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.brand,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.white,
  },
  userName: {
    fontSize: 19,
    fontWeight: '900',
    color: Colors.ink,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.slate,
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  userPhone: {
    fontSize: 12,
    color: Colors.slate400,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.amber100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.brand,
  },
  appBadgeRow: {
    marginTop: Space.md,
    paddingTop: Space.md,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeCol: {},
  badgeColRight: {
    alignItems: 'flex-end',
  },
  appBadgeLabel: {
    fontSize: 11,
    color: Colors.slate400,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  appBadgeValue: {
    fontSize: 12,
    color: Colors.ink,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionCard: {
    padding: Space.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Space.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.ink,
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
    color: Colors.slate600,
    fontWeight: '700',
  },
  logoutWrap: {
    marginTop: Space.sm,
  },
  appraisalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.panelWarm,
    borderWidth: 1,
    borderColor: Colors.amber200,
    borderRadius: Radius.lg,
    padding: Space.md,
  },
  appraisalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  appraisalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.amber100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appraisalName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
  },
  appraisalDesc: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  devTag: {
    backgroundColor: Colors.amber100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.amber300,
  },
  devTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.amber900,
  },
  legacyDesc: {
    fontSize: 11,
    color: Colors.slate,
    marginBottom: 8,
    lineHeight: 16,
  },
  legacyBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  legacySubBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.panelWarm,
    borderWidth: 1,
    borderColor: Colors.amber200,
    borderRadius: Radius.md,
    paddingVertical: 9,
  },
  legacySubBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.brand,
  },
  serverInfoBox: {
    backgroundColor: Colors.canvas,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serverInfoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate400,
    textTransform: 'uppercase',
  },
  serverInfoVal: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.slate700,
    marginTop: 2,
  },
})
