import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import { useUserRole } from '@/hooks/useUserRole'
import { useStore } from '@/context/StoreContext'
import { formatMoney } from '@/utils/format'
import { fetchProfileSummary } from '@/api/reports'

export default function AccountScreen() {
  const insets = useSafeAreaInsets()
  const { user, logout } = useAuth()
  const { locale, setLocale, t } = useLocale()
  const { vault, recordVaultExpense, settleVault } = useStore()
  const [syncing, setSyncing] = useState(false)
  const [avatarErr, setAvatarErr] = useState(false)
  const [profileStats, setProfileStats] = useState<any>(null)

  useEffect(() => {
    fetchProfileSummary()
      .then((res) => {
        if (res && res.stats) {
          setProfileStats(res.stats)
        }
      })
      .catch(() => {})
  }, [])

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
      Alert.alert(
        'Đồng bộ thành công',
        'Máy in Epson TM-T82 và máy chủ trung tâm POS hoạt động ổn định (ping 18ms).'
      )
    }, 600)
  }

  const {
    isStoreOwner,
    roleTitle,
    employeeName,
    employeeEmail,
    employeePhone,
  } = useUserRole()
  const userInitial = employeeName.trim().charAt(0).toUpperCase()

  const avatarUri =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ8pu5nndv5S-voRv7hLvPsJJGYBQ_GA01b4Z28dCOhfH9B-Gk5E5V8gNnxeC0wt22GBsmlWR1j-rMWOjpjOSHbBWOk4wXwBpCegT3VqIoYnX7XD5CVJovrO6Y1d3LHiplp42TIFpdbVlnfbnrGzJaGl8qJWB_N2bIUAUB7xF7n-zy02AYYhvkNHFkacdk9YiQ4NCQiAgE4Wac2sESx6Mtf8uPyO3TV_fRPxYMmVU'

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header chuẩn Google Stitch Mobile ── */}
      <View style={styles.topHeader}>
        <View style={styles.brandGroup}>
          <View style={styles.brandIconBox}>
            <Ionicons name="storefront" size={18} color="#FFFFFF" />
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>Liêng Mobile</Text>
              <View
                style={[
                  styles.posBadge,
                  isStoreOwner ? styles.ownerBadgeBg : styles.staffBadgeBg,
                ]}
              >
                <Text
                  style={[
                    styles.posBadgeText,
                    isStoreOwner ? styles.ownerBadgeText : styles.staffBadgeText,
                  ]}
                >
                  {roleTitle}
                </Text>
              </View>
            </View>
            <View style={styles.brandSubRow}>
              <Ionicons name="storefront" size={11} color="#58413F" />
              <Text style={styles.brandSubtitle}>
                {isStoreOwner
                  ? 'Chi nhánh Cầu Giấy • Quản lý'
                  : 'Chi nhánh Cầu Giấy • Tôi'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            style={styles.iconCircleBtn}
            accessibilityRole="button"
            accessibilityLabel="Thông báo"
          >
            <Ionicons name="notifications-outline" size={20} color="#191C1E" />
            <View style={styles.unreadDot} />
          </Pressable>
          <View style={styles.avatarBtn}>
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 95 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Thẻ Hồ Sơ Người Dùng ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              {!avatarErr ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImg}
                  onError={() => setAvatarErr(true)}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{userInitial}</Text>
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={11} color="#7A0C10" />
              </View>
            </View>

            <View style={styles.profileInfoCol}>
              <View style={styles.nameActionRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.userName}>{employeeName}</Text>
                  {isStoreOwner && (
                    <Ionicons name="checkmark-circle" size={15} color="#DC2626" />
                  )}
                </View>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => Alert.alert('Thông tin', 'Chỉnh sửa thông tin tài khoản cá nhân.')}
                >
                  <Ionicons name="create-outline" size={13} color="#58413F" />
                  <Text style={styles.editText}>Sửa</Text>
                </Pressable>
              </View>

              <Text style={styles.userEmail}>{employeeEmail}</Text>

              <View style={styles.phoneRow}>
                <Ionicons name="call" size={12} color="#7A0C10" />
                <Text style={styles.userPhone}>{employeePhone}</Text>
              </View>
            </View>
          </View>

          {/* Cấp bậc */}
          <View style={[styles.rankBadgeBox, isStoreOwner && styles.rankBadgeBoxOwner]}>
            <View style={styles.rankIconBox}>
              <Ionicons
                name={isStoreOwner ? 'shield-checkmark' : 'shield-checkmark-outline'}
                size={15}
                color="#7A0C10"
              />
            </View>
            <View style={styles.rankTextBox}>
              <Text style={styles.rankTitle}>
                {isStoreOwner ? 'CẤP BẬC TỔNG QUẢN' : 'CẤP BẬC CHUYÊN MÔN'}
              </Text>
              <Text style={styles.rankValue}>
                {isStoreOwner
                  ? 'Chủ quán / Quản lý Điều hành Flagship #01 (Toàn quyền)'
                  : 'Nhân viên Bán hàng & Tư vấn POS (Flagship Level 2)'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. Thẻ Ca Làm Việc (Chủ quán vs Nhân viên) ── */}
        {isStoreOwner ? (
          <>
            {/* SỔ QUỸ & CHỐT KÉT SHOWROOM (IMAGE 5) */}
            <View style={styles.ownerVaultCard}>
              <View style={styles.ownerVaultHeader}>
                <View style={styles.ownerVaultHeaderLeft}>
                  <View style={styles.ownerVaultIconBox}>
                    <Ionicons name="wallet-outline" size={18} color="#7A0C10" />
                  </View>
                  <View>
                    <Text style={styles.ownerVaultTitle}>SỔ QUỸ & CHỐT KÉT SHOWROOM</Text>
                    <Text style={styles.ownerVaultTime}>08:00 — 16:30 (Hôm nay)</Text>
                  </View>
                </View>
                <View style={styles.ownerVaultStatusPill}>
                  <View style={styles.pulseLiveDot} />
                  <Text style={styles.ownerVaultStatusText}>Đang mở két</Text>
                </View>
              </View>

              {/* Các dòng biến động tiền */}
              <View style={styles.ownerVaultRowsList}>
                <View style={styles.ownerVaultRowItem}>
                  <View style={styles.ownerVaultRowLabelGroup}>
                    <Ionicons name="swap-horizontal-outline" size={13} color="#6B7280" />
                    <Text style={styles.ownerVaultRowLabel}>
                      Tiền mặt đầu ca (tiền lẻ trả lại)
                    </Text>
                  </View>
                  <Text style={styles.ownerVaultRowValDark}>10.000.000 đ</Text>
                </View>

                <View style={styles.ownerVaultRowItem}>
                  <View style={styles.ownerVaultRowLabelGroup}>
                    <Ionicons name="arrow-down-circle-outline" size={13} color="#16A34A" />
                    <Text style={styles.ownerVaultRowLabel}>
                      Thu tiền mặt bán hàng trong ca
                    </Text>
                  </View>
                  <Text style={styles.ownerVaultRowValGreen}>+{formatMoney(vault.cashSales)}</Text>
                </View>

                <View style={styles.ownerVaultRowItem}>
                  <View style={styles.ownerVaultRowLabelGroup}>
                    <Ionicons name="arrow-up-circle-outline" size={13} color="#DC2626" />
                    <Text style={styles.ownerVaultRowLabel}>
                      Chi phí vận hành quán tại quầy
                    </Text>
                  </View>
                  <Text style={styles.ownerVaultRowValRed}>-{formatMoney(vault.operationalExpenses)}</Text>
                </View>
              </View>

              {/* Khung lớn: TIỀN MẶT THỰC TẾ TRONG KÉT */}
              <View style={styles.ownerActualVaultBox}>
                <View>
                  <Text style={styles.ownerActualVaultLabel}>
                    TIỀN MẶT THỰC TẾ TRONG KÉT
                  </Text>
                  <Text style={styles.ownerActualVaultAmount}>{formatMoney(vault.actualCashInVault)}</Text>
                </View>
                <Pressable
                  style={styles.ownerVaultLockBtn}
                  onPress={() => Alert.alert('Két tiền mặt', 'Két showroom đang được bảo mật điện tử.')}
                >
                  <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* Tiến độ doanh số ca đạt chỉ tiêu */}
              <View style={styles.ownerTargetProgressSection}>
                <View style={styles.ownerTargetProgressHeader}>
                  <Text style={styles.ownerTargetProgressLabel}>
                    Tiến độ doanh số ca đạt chỉ tiêu
                  </Text>
                  <Text style={styles.ownerTargetProgressValue}>
                    {vault.targetProgress}% ({Math.round(vault.targetRevenue / 1000000)}M Target)
                  </Text>
                </View>
                <View style={styles.ownerProgressBarTrack}>
                  <View style={[styles.ownerProgressBarFill, { width: `${vault.targetProgress}%` }]} />
                </View>
              </View>

              {/* 2 nút hành động: Chi tiền quán & Kiểm đếm két */}
              <View style={styles.ownerVaultActionsRow}>
                <Pressable
                  style={styles.ownerVaultActionBtn}
                  onPress={() => {
                    Alert.alert(
                      'Chi tiền quán tại quầy',
                      'Chọn khoản mục chi phí tiền mặt cần xuất:',
                      [
                        {
                          text: 'Nước & Cafe khách VIP (150.000 đ)',
                          onPress: async () => {
                            await recordVaultExpense(150000, 'Nước suối & Cafe tiếp khách VIP')
                            Alert.alert('Thành công', 'Đã ghi nhận chi phí 150.000 đ vào sổ quỹ két.')
                          },
                        },
                        {
                          text: 'Văn phòng phẩm / Giấy in (250.000 đ)',
                          onPress: async () => {
                            await recordVaultExpense(250000, 'Văn phòng phẩm & Giấy in bill')
                            Alert.alert('Thành công', 'Đã ghi nhận chi phí 250.000 đ vào sổ quỹ két.')
                          },
                        },
                        { text: 'Đóng', style: 'cancel' },
                      ],
                    )
                  }}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#7A0C10" />
                  <Text style={styles.ownerVaultActionBtnText}>Chi tiền quán</Text>
                </Pressable>

                <Pressable
                  style={styles.ownerVaultActionBtn}
                  onPress={() =>
                    Alert.alert(
                      'Kiểm đếm két',
                      `Đã kiểm đếm két: Tiền mặt thực tế ${formatMoney(vault.actualCashInVault)} khớp 100% sao kê hệ thống.`,
                    )
                  }
                >
                  <Ionicons name="calculator-outline" size={16} color="#191C1E" />
                  <Text style={styles.ownerVaultActionBtnText}>Kiểm đếm két</Text>
                </Pressable>
              </View>
            </View>

            {/* Chi tiết Flagship Store Độc Lập Cho Chủ Quán */}
            <View style={styles.storeCardStandalone}>
              <View style={styles.storeDetailsBox}>
                <View style={styles.storeIconBox}>
                  <Ionicons name="storefront" size={18} color="#7A0C10" />
                </View>
                <View style={styles.storeInfoCol}>
                  <View style={styles.storeTitleRow}>
                    <Text style={styles.storeCardTitle}>Liêng Mobile - Flagship #01</Text>
                  </View>
                  <Text style={styles.storeAddress}>
                    123 Điện Biên Phủ, Phường Võ Thị Sáu, Quận 3, TP.HCM
                  </Text>
                  <View style={styles.managerLine}>
                    <Ionicons name="person-circle-outline" size={13} color="#7A0C10" />
                    <Text style={styles.managerLabel}>Quản lý điều hành: </Text>
                    <Text style={styles.managerName}>Trần Quốc Bảo</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.shiftCard}>
            {/* Header phiên trực */}
            <View style={styles.shiftHeaderLine}>
              <View style={styles.shiftHeaderLeft}>
                <View style={styles.shiftIconBox}>
                  <Ionicons name="briefcase" size={17} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.shiftTagText}>PHIÊN TRỰC QUẦY</Text>
                  <Text style={styles.shiftMainTitle}>Ca chính: Bán lẻ & Quầy POS</Text>
                </View>
              </View>
              <View style={styles.shiftStatusPill}>
                <View style={styles.pulseLiveDot} />
                <Text style={styles.shiftStatusText}>Đang trong ca</Text>
              </View>
            </View>

            {/* Khung giờ */}
            <View style={styles.shiftTimeBox}>
              <View style={styles.shiftTimeLeft}>
                <Ionicons name="time-outline" size={15} color="#58413F" />
                <Text style={styles.shiftTimeLabel}>Khung giờ:</Text>
              </View>
              <Text style={styles.shiftTimeValue}>08:00 — 16:30 (Hôm nay)</Text>
            </View>

            {/* Doanh số đã chốt & Progress Bar */}
            {(() => {
              const rev = profileStats?.revenueToday ?? 42500000;
              const target = 50000000;
              const pct = Math.min(100, Math.round((rev / target) * 100));
              const formattedRev = new Intl.NumberFormat('vi-VN').format(rev);
              const formattedTarget = new Intl.NumberFormat('vi-VN').format(target);
              return (
                <View style={styles.targetSection}>
                  <View style={styles.targetHeaderLine}>
                    <Text style={styles.targetLabel}>DOANH SỐ ĐÃ CHỐT</Text>
                    <Text style={styles.targetPercent}>{pct}% chỉ tiêu</Text>
                  </View>

                  <View style={styles.targetValueLine}>
                    <Text style={styles.targetAmountVal}>
                      {formattedRev} <Text style={styles.targetCurrency}>đ</Text>
                    </Text>
                    <Text style={styles.targetHint}>Mục tiêu: {formattedTarget} đ</Text>
                  </View>

                  {/* Progress Bar Liêng Red */}
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })()}

            {/* Phân cách */}
            <View style={styles.cardDivider} />

            {/* Chi tiết Flagship Store */}
            <View style={styles.storeDetailsBox}>
              <View style={styles.storeIconBox}>
                <Ionicons name="storefront" size={18} color="#7A0C10" />
              </View>
              <View style={styles.storeInfoCol}>
                <View style={styles.storeTitleRow}>
                  <Text style={styles.storeCardTitle}>Liêng Mobile - Flagship #01</Text>
                  <View style={styles.q3Badge}>
                    <Text style={styles.q3BadgeText}>Q.3</Text>
                  </View>
                </View>
                <Text style={styles.storeAddress}>
                  123 Điện Biên Phủ, Phường Võ Thị Sáu, Quận 3, TP.HCM
                </Text>

                <View style={styles.managerLine}>
                  <Ionicons name="headset" size={13} color="#7A0C10" />
                  <Text style={styles.managerLabel}>Quản lý ca trực: </Text>
                  <Text style={styles.managerName}>Trần Quốc Bảo</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── 3. Thẻ Cài đặt & Nghiệp vụ POS ── */}
        <View style={styles.settingsCard}>
          <View style={styles.settingsHeaderLine}>
            <Text style={styles.settingsTitle}>Cài đặt & Nghiệp vụ POS</Text>
            <Text style={styles.systemVersionText}>Hệ thống v2.6</Text>
          </View>

          {/* Mục 1: Bộ chuyển đổi ngôn ngữ */}
          <View style={styles.settingItemBox}>
            <View style={styles.settingItemTop}>
              <View style={styles.settingItemLeftGroup}>
                <Ionicons name="language" size={18} color="#7A0C10" />
                <Text style={styles.settingItemTitle}>Ngôn ngữ hiển thị</Text>
              </View>
              <Text style={styles.settingItemSubtext}>Song ngữ Việt - Lào</Text>
            </View>

            <View style={styles.langSegmentBox}>
              <Pressable
                style={[styles.langSegmentTab, locale === 'vi' && styles.langSegmentTabActive]}
                onPress={() => setLocale('vi')}
              >
                {locale === 'vi' && <View style={styles.activeDot} />}
                <Text
                  style={[
                    styles.langSegmentText,
                    locale === 'vi' && styles.langSegmentTextActive,
                  ]}
                >
                  Tiếng Việt (Chuẩn)
                </Text>
              </Pressable>

              <Pressable
                style={[styles.langSegmentTab, locale === 'lo' && styles.langSegmentTabActive]}
                onPress={() => setLocale('lo')}
              >
                {locale === 'lo' && <View style={styles.activeDot} />}
                <Text
                  style={[
                    styles.langSegmentText,
                    locale === 'lo' && styles.langSegmentTextActive,
                  ]}
                >
                  ພາສາລາວ (Lao)
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Mục 2: Tiện ích "Quán Nhỏ" VIP Care */}
          <Pressable
            style={styles.settingItemBox}
            onPress={() =>
              Alert.alert(
                'Tiện ích Quán Nhỏ',
                'Thực đơn trà và cà phê pha máy phục vụ khách hàng trải nghiệm tại Flagship #01.'
              )
            }
          >
            <View style={styles.vipRow}>
              <View style={styles.vipLeft}>
                <View style={styles.coffeeIconBox}>
                  <Ionicons name="cafe" size={20} color="#63001E" />
                </View>
                <View style={styles.vipTextCol}>
                  <View style={styles.vipTitleRow}>
                    <Text style={styles.settingItemTitle}>Tiện ích "Quán Nhỏ"</Text>
                    <View style={styles.vipBadge}>
                      <Text style={styles.vipBadgeText}>VIP Care</Text>
                    </View>
                  </View>
                  <Text style={styles.vipSubtext} numberOfLines={1}>
                    Gọi trà, cà phê phục vụ khách tại bàn trải nghiệm máy
                  </Text>
                </View>
              </View>
              <View style={styles.vipRight}>
                <Text style={styles.menuLinkText}>Menu</Text>
                <Ionicons name="chevron-forward" size={14} color="#58413F" />
              </View>
            </View>
          </Pressable>

          {/* Mục 3: Cấu hình máy in hóa đơn POS */}
          <View style={styles.settingItemBox}>
            <View style={styles.printerRow}>
              <View style={styles.printerLeft}>
                <View style={styles.grayIconBox}>
                  <Ionicons name="print" size={18} color="#58413F" />
                </View>
                <View style={styles.printerTextCol}>
                  <Text style={styles.settingItemTitle}>Máy in bill hóa đơn POS</Text>
                  <Text style={styles.printerSubtext}>Epson TM-T82 (Cổng LAN/Bluetooth)</Text>
                </View>
              </View>
              <View style={styles.printerRight}>
                <View style={styles.readyPill}>
                  <View style={styles.readyDot} />
                  <Text style={styles.readyText}>Sẵn sàng</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.syncBtn, pressed && { opacity: 0.7 }]}
                  onPress={handleSync}
                >
                  <Ionicons
                    name="sync"
                    size={15}
                    color="#58413F"
                    style={syncing ? { transform: [{ rotate: '45deg' }] } : undefined}
                  />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Mục 4: Máy chủ POS Trung tâm */}
          <View style={styles.settingItemBox}>
            <View style={styles.serverRow}>
              <View style={styles.serverLeft}>
                <View style={styles.grayIconBox}>
                  <Ionicons name="server" size={18} color="#58413F" />
                </View>
                <View style={styles.serverTextCol}>
                  <Text style={styles.settingItemTitle}>Máy chủ POS Trung tâm</Text>
                  <Text style={styles.serverSubtext}>Đồng bộ đám mây thời gian thực</Text>
                </View>
              </View>
              <View style={styles.serverRight}>
                <View style={styles.serverPingRow}>
                  <Ionicons name="wifi" size={13} color="#7A0C10" />
                  <Text style={styles.serverPingVal}>18 ms</Text>
                </View>
                <Text style={styles.serverStatusSub}>Bình thường</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 4. Nút Đăng Xuất & Footer ── */}
        <View style={styles.logoutSection}>
          {isStoreOwner && (
            <Pressable
              style={styles.confirmSettleBtn}
              onPress={async () => {
                await settleVault('Chốt két ca trực 08:00 - 16:30 hoàn tất.')
                Alert.alert(
                  'Xác nhận chốt két thành công 🎉',
                  `Đã lưu kho sao kê thành công!\nSố tiền bàn giao: ${formatMoney(vault.actualCashInVault)}\nTự động đồng bộ máy chủ & in 02 liên bàn giao ca (Liên 1 Kế toán, Liên 2 Bàn giao ca).`,
                )
              }}
            >
              <View style={styles.confirmSettleLeft}>
                <Ionicons name="refresh-circle-outline" size={24} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.confirmSettleTitle}>
                    XÁC NHẬN CHỐT KÉT & LƯU KHO SAO KÊ
                  </Text>
                  <Text style={styles.confirmSettleSubtitle}>
                    Tự động đồng bộ máy chủ & in 02 liên bàn giao ca
                  </Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              isStoreOwner ? styles.logoutOwnerOutlineBtn : styles.logoutBtn,
              pressed && { opacity: 0.88 },
            ]}
            onPress={handleLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={isStoreOwner ? '#7A0C10' : '#FFFFFF'}
            />
            <Text
              style={
                isStoreOwner
                  ? styles.logoutOwnerOutlineBtnText
                  : styles.logoutBtnText
              }
            >
              {isStoreOwner
                ? 'ĐĂNG XUẤT TÀI KHOẢN CHỦ QUÁN'
                : 'ĐĂNG XUẤT TÀI KHOẢN POS'}
            </Text>
          </Pressable>

          <View style={styles.footerInfoBox}>
            <View style={styles.footerLine1}>
              <Ionicons name="terminal-outline" size={13} color="#58413F" />
              <Text style={styles.footerVersionText}>
                Liêng Mobile Retail POS v2.6.4 • Build 20261109
              </Text>
            </View>
            <Text style={styles.footerCopyrightText}>
              Bản quyền thiết kế & vận hành thuộc Liêng Mobile Inc.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },

  // ── Top Header ──
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
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#7A0C10',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconImg: {
    width: 34,
    height: 34,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A0C10',
    letterSpacing: -0.3,
  },
  posBadge: {
    backgroundColor: '#FFD9DC',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  posBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#63001E',
  },
  brandSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#58413F',
    fontWeight: '500',
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
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#B32446',
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#550005',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    padding: 16,
    gap: 14,
  },

  // ── 1. Thẻ Hồ sơ Nhân Viên ──
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
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
  avatarImg: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#ECEEF0',
  },
  avatarFallback: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#7A0C10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD9DC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfoCol: {
    flex: 1,
    gap: 2,
  },
  nameActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191C1E',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F2F4F6',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  editText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#58413F',
  },
  userEmail: {
    fontSize: 12,
    color: '#58413F',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#191C1E',
    fontWeight: '600',
  },
  rankBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF0F2',
    borderWidth: 1,
    borderColor: '#FFDAD6',
    borderRadius: 12,
    padding: 10,
  },
  rankIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD9DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankTextBox: {
    flex: 1,
    gap: 1,
  },
  rankTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#7A0C10',
    letterSpacing: 0.5,
  },
  rankValue: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#191C1E',
  },

  // ── 2. Thẻ Ca Làm Việc & Chi Nhánh ──
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 12,
  },
  shiftHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  shiftIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#7A0C10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#58413F',
    letterSpacing: 0.5,
  },
  shiftMainTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  shiftStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F2F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  pulseLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#B32446',
  },
  shiftStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B32446',
  },
  shiftTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  shiftTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  shiftTimeLabel: {
    fontSize: 12,
    color: '#58413F',
  },
  shiftTimeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A0C10',
  },

  targetSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    padding: 12,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#7A0C10',
  },
  targetValueLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  targetAmountVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#7A0C10',
  },
  targetCurrency: {
    fontSize: 13,
    fontWeight: '400',
    color: '#58413F',
  },
  targetHint: {
    fontSize: 11.5,
    color: '#58413F',
  },
  progressBarTrack: {
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E6E8EA',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#7A0C10',
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#ECEEF0',
    marginVertical: 2,
  },

  storeDetailsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  storeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFDAD6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  storeInfoCol: {
    flex: 1,
    gap: 2,
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  q3Badge: {
    backgroundColor: '#ECEEF0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  q3BadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#58413F',
  },
  storeAddress: {
    fontSize: 11.5,
    color: '#58413F',
    lineHeight: 16,
  },
  managerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  managerLabel: {
    fontSize: 11.5,
    color: '#58413F',
  },
  managerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191C1E',
  },

  // ── 3. Cài đặt & Nghiệp vụ POS ──
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 12,
  },
  settingsHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 2,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  systemVersionText: {
    fontSize: 11.5,
    color: '#58413F',
    fontWeight: '500',
  },

  settingItemBox: {
    backgroundColor: '#F7F9FB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 10,
  },
  settingItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingItemLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  settingItemSubtext: {
    fontSize: 11,
    color: '#58413F',
  },

  langSegmentBox: {
    flexDirection: 'row',
    backgroundColor: '#E0E3E5',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  langSegmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
  },
  langSegmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7A0C10',
  },
  langSegmentText: {
    fontSize: 12,
    color: '#58413F',
    fontWeight: '500',
  },
  langSegmentTextActive: {
    color: '#7A0C10',
    fontWeight: '700',
  },

  vipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  coffeeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFD9DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipTextCol: {
    flex: 1,
    gap: 1,
  },
  vipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vipBadge: {
    backgroundColor: '#7A0C10',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  vipBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  vipSubtext: {
    fontSize: 11,
    color: '#58413F',
  },
  vipRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  menuLinkText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#58413F',
  },

  printerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  printerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  grayIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E6E8EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerTextCol: {
    flex: 1,
    gap: 1,
  },
  printerSubtext: {
    fontSize: 11,
    color: '#58413F',
  },
  printerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD9DC',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FE5E7A',
  },
  readyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#63001E',
  },
  syncBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E6E8EA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  serverTextCol: {
    flex: 1,
    gap: 1,
  },
  serverSubtext: {
    fontSize: 11,
    color: '#58413F',
  },
  serverRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  serverPingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serverPingVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7A0C10',
  },
  serverStatusSub: {
    fontSize: 10.5,
    color: '#58413F',
  },

  // ── 4. Nút Đăng Xuất & Footer ──
  logoutSection: {
    gap: 14,
    marginTop: 4,
    alignItems: 'center',
  },
  logoutBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7A0C10',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#7A0C10',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  footerInfoBox: {
    alignItems: 'center',
    gap: 3,
  },
  footerLine1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerVersionText: {
    fontSize: 11,
    color: '#58413F',
    fontWeight: '600',
  },
  footerCopyrightText: {
    fontSize: 10,
    color: '#8C716E',
  },

  // Role Badges
  staffBadgeBg: {
    backgroundColor: '#FFECEF',
  },
  staffBadgeText: {
    color: Colors.primaryContainer,
  },
  ownerBadgeBg: {
    backgroundColor: '#FFD9DD',
  },
  ownerBadgeText: {
    color: '#991B1B',
  },
  rankBadgeBoxOwner: {
    backgroundColor: '#FFF5F6',
    borderColor: '#FECDD3',
  },

  // Sổ quỹ & Chốt két Showroom (Image 5)
  ownerVaultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 12,
  },
  ownerVaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerVaultHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ownerVaultIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#FFECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerVaultTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#7A0C10',
    letterSpacing: 0.3,
  },
  ownerVaultTime: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  ownerVaultStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ownerVaultStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },
  ownerVaultRowsList: {
    gap: 8,
    paddingVertical: 4,
  },
  ownerVaultRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerVaultRowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ownerVaultRowLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  ownerVaultRowValDark: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  ownerVaultRowValGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  ownerVaultRowValRed: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Highlight Box: TIỀN MẶT THỰC TẾ TRONG KÉT
  ownerActualVaultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5F6',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    borderRadius: Radius.lg,
    padding: 14,
  },
  ownerActualVaultLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#881337',
    letterSpacing: 0.3,
  },
  ownerActualVaultAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#7A0C10',
    marginTop: 2,
  },
  ownerVaultLockBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: '#7A0C10',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Progress Bar Target
  ownerTargetProgressSection: {
    gap: 5,
  },
  ownerTargetProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerTargetProgressLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  ownerTargetProgressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A0C10',
  },
  ownerProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  ownerProgressBarFill: {
    height: '100%',
    backgroundColor: '#7A0C10',
    borderRadius: 3,
  },

  // Vault Actions (Chi tiền quán & Kiểm đếm két)
  ownerVaultActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  ownerVaultActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: Radius.md,
    paddingVertical: 10,
  },
  ownerVaultActionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#191C1E',
  },

  // Standalone Store Card
  storeCardStandalone: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },

  // Chốt két & Logout buttons
  confirmSettleBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7A0C10',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  confirmSettleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  confirmSettleTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  confirmSettleSubtitle: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  logoutOwnerOutlineBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingVertical: 13,
  },
  logoutOwnerOutlineBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#7A0C10',
    letterSpacing: 0.3,
  },
})
