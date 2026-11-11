import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { API_BASE_URL, Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'

export default function AccountScreen() {
  const insets = useSafeAreaInsets()
  const { user, logout } = useAuth()
  const { locale, setLocale, t } = useLocale()
  const [syncing, setSyncing] = useState(false)

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
      Alert.alert(t('common.logout'), 'Bạn có chắc chắn muốn đăng xuất khỏi ca trực POS?', [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.logout'),
          style: 'destructive',
          onPress: doLogout,
        },
      ])
    }
  }

  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      Alert.alert('Đồng bộ thành công', 'Toàn bộ danh mục tồn kho IMEI và hóa đơn ca trực đã được đồng bộ với máy chủ.')
    }, 800)
  }

  const employeeName = user?.name || 'Nguyễn Văn A'
  const employeeEmail = user?.email || 'banhang@liengmobile.com'
  const employeePhone = user?.phone || '0982 345 678'
  const userInitial = employeeName.trim().charAt(0).toUpperCase()

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header chuẩn Stitch Mobile ── */}
      <View style={styles.topHeader}>
        <View style={styles.brandGroup}>
          <View style={styles.brandIconBox}>
            <Ionicons name="storefront" size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.brandTitle}>Liêng Mobile POS</Text>
            <Text style={styles.brandSubtitle}>Chi nhánh Cầu Giấy • Tôi</Text>
          </View>
        </View>
        <View style={styles.headerRightActions}>
          <Pressable style={styles.iconCircleBtn}>
            <Ionicons name="notifications-outline" size={20} color={Colors.onSurface} />
            <View style={styles.unreadDot} />
          </Pressable>
          <View style={styles.avatarBtn}>
            <Ionicons name="person-circle" size={26} color={Colors.primaryContainer} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 95 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Section Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={11} color={Colors.white} />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.nameActionRow}>
                <Text style={styles.userName}>{employeeName}</Text>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => Alert.alert('Thông tin', 'Chức năng cập nhật hồ sơ cá nhân.')}
                >
                  <Ionicons name="create-outline" size={14} color={Colors.primaryContainer} />
                  <Text style={styles.editText}>Sửa</Text>
                </Pressable>
              </View>

              <Text style={styles.userEmail}>{employeeEmail}</Text>

              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={13} color="#8C716E" />
                <Text style={styles.userPhone}>{employeePhone}</Text>
              </View>
            </View>
          </View>

          {/* Pos Rank Badge */}
          <View style={styles.rankBadgeBox}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primaryContainer} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rankTitle}>Cấp bậc chuyên môn</Text>
              <Text style={styles.rankValue}>Nhân viên Bán hàng & Tư vấn POS (Flagship Level 2)</Text>
            </View>
          </View>
        </View>

        {/* ── Shift & Target Section (Phiên trực quầy) ── */}
        <View style={styles.shiftCard}>
          <View style={styles.shiftHeaderLine}>
            <View style={styles.shiftTag}>
              <Ionicons name="ribbon-outline" size={13} color={Colors.primaryContainer} />
              <Text style={styles.shiftTagText}>PHIÊN TRỰC QUẦY</Text>
            </View>
            <View style={styles.shiftStatusPill}>
              <View style={styles.pulseLiveDot} />
              <Text style={styles.shiftStatusText}>Đang trong ca</Text>
            </View>
          </View>

          <Text style={styles.shiftTitle}>Ca chính: Bán lẻ & Quầy POS</Text>

          <View style={styles.shiftTimeRow}>
            <Ionicons name="time-outline" size={14} color="#58413F" />
            <Text style={styles.shiftTimeText}>Khung giờ: 08:00 — 16:30 (Hôm nay)</Text>
          </View>

          {/* Target Progress Bar */}
          <View style={styles.targetSection}>
            <View style={styles.targetHeaderLine}>
              <Text style={styles.targetLabel}>DOANH SỐ ĐÃ CHỐT</Text>
              <Text style={styles.targetPercent}>85% chỉ tiêu</Text>
            </View>

            <Text style={styles.targetAmountVal}>42.500.000 đ</Text>

            {/* Visual Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '85%' }]} />
            </View>

            <Text style={styles.targetHint}>Mục tiêu ca trực: 50.000.000 đ</Text>
          </View>
        </View>

        {/* ── Flagship Store Details ── */}
        <View style={styles.storeCard}>
          <View style={styles.storeHeaderLine}>
            <View style={styles.storeTitleGroup}>
              <Ionicons name="storefront-outline" size={18} color={Colors.primaryContainer} />
              <Text style={styles.storeCardTitle}>Liêng Mobile - Flagship #01</Text>
            </View>
            <View style={styles.q3Badge}>
              <Text style={styles.q3BadgeText}>Q.3</Text>
            </View>
          </View>

          <Text style={styles.storeAddress}>
            123 Điện Biên Phủ, Phường Võ Thị Sáu, Quận 3, TP.HCM
          </Text>

          <View style={styles.managerLine}>
            <Ionicons name="headset-outline" size={14} color="#58413F" />
            <Text style={styles.managerText}>
              Quản lý ca trực: <Text style={{ fontWeight: '700', color: '#191C1E' }}>Trần Quốc Bảo</Text>
            </Text>
          </View>
        </View>

        {/* ── Cài đặt & Nghiệp vụ POS ── */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Cài đặt & Nghiệp vụ POS</Text>

          {/* Language */}
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingItemLabel}>Ngôn ngữ giao diện</Text>
              <Text style={styles.settingItemSub}>Chọn ngôn ngữ POS hiển thị</Text>
            </View>
            <View style={styles.langBtnRow}>
              <Pressable
                style={[styles.langBtn, locale === 'vi' && styles.langBtnActive]}
                onPress={() => setLocale('vi')}
              >
                <Text style={[styles.langBtnText, locale === 'vi' && styles.langBtnTextActive]}>
                  Tiếng Việt
                </Text>
              </Pressable>
              <Pressable
                style={[styles.langBtn, locale === 'lo' && styles.langBtnActive]}
                onPress={() => setLocale('lo')}
              >
                <Text style={[styles.langBtnText, locale === 'lo' && styles.langBtnTextActive]}>
                  ພາສາລາວ
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Sync */}
          <Pressable style={styles.settingActionRow} onPress={handleSync} disabled={syncing}>
            <View style={styles.settingActionLeft}>
              <Ionicons name="sync-outline" size={18} color={Colors.primaryContainer} />
              <View>
                <Text style={styles.settingActionLabel}>Đồng bộ dữ liệu POS</Text>
                <Text style={styles.settingItemSub}>Làm mới kho máy IMEI & bảng giá</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8C716E" />
          </Pressable>

          {/* Server endpoint info */}
          <View style={styles.serverInfoBox}>
            <Text style={styles.serverInfoLabel}>Máy chủ API backend:</Text>
            <Text style={styles.serverInfoVal} numberOfLines={1}>{API_BASE_URL}</Text>
          </View>
        </View>

        {/* ── Đăng xuất tài khoản POS ── */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.88 }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.white} />
          <Text style={styles.logoutBtnText}>ĐĂNG XUẤT TÀI KHOẢN POS</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#58413F',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  nameActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#191C1E',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFECEF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  editText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  userEmail: {
    fontSize: 12,
    color: '#58413F',
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  userPhone: {
    fontSize: 11.5,
    color: '#58413F',
  },
  rankBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F7F9FB',
    borderRadius: Radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  rankTitle: {
    fontSize: 10.5,
    color: '#58413F',
    fontWeight: '500',
  },
  rankValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191C1E',
  },

  // Shift Card
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 8,
  },
  shiftHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shiftTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  shiftStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pulseLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  shiftStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.greenDeep,
  },
  shiftTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  shiftTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shiftTimeText: {
    fontSize: 12,
    color: '#58413F',
  },
  targetSection: {
    marginTop: 6,
    backgroundColor: '#F7F9FB',
    borderRadius: Radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 4,
  },
  targetHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#58413F',
    letterSpacing: 0.5,
  },
  targetPercent: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  targetAmountVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryContainer,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ECEEF0',
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.primaryContainer,
  },
  targetHint: {
    fontSize: 11,
    color: '#58413F',
  },

  // Store Card
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 6,
  },
  storeHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191C1E',
  },
  q3Badge: {
    backgroundColor: '#FFECEF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  q3BadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  storeAddress: {
    fontSize: 11.5,
    color: '#58413F',
    lineHeight: 16,
  },
  managerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  managerText: {
    fontSize: 11.5,
    color: '#58413F',
  },

  // Settings
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 12,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191C1E',
  },
  settingItem: {
    gap: 8,
  },
  settingItemLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#191C1E',
  },
  settingItemSub: {
    fontSize: 11,
    color: '#58413F',
  },
  langBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: '#F2F4F6',
  },
  langBtnActive: {
    backgroundColor: Colors.primaryContainer,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#58413F',
  },
  langBtnTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  settingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingActionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#191C1E',
  },
  serverInfoBox: {
    backgroundColor: '#F7F9FB',
    borderRadius: Radius.sm,
    padding: 8,
    gap: 2,
  },
  serverInfoLabel: {
    fontSize: 10,
    color: '#58413F',
  },
  serverInfoVal: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.primaryContainer,
    fontWeight: '600',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
})
