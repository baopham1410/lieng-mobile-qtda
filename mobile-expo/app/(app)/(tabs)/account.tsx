import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

  // ── Modals cho Chủ quán ──
  // 1. Chi tiền quán
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [expenseTitle, setExpenseTitle] = useState('Nước suối & Cafe tiếp khách VIP')
  const [expenseAmount, setExpenseAmount] = useState('150000')
  const [expenseRecipient, setExpenseRecipient] = useState('Nguyễn Văn A (Nhân viên quầy)')
  const [expenseSubmitting, setExpenseSubmitting] = useState(false)

  // 2. Kiểm đếm két
  const [auditModalOpen, setAuditModalOpen] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({
    '500k': 0,
    '200k': 0,
    '100k': 0,
    '50k': 0,
    '20k': 0,
    '10k': 0,
  })
  const [auditVerified, setAuditVerified] = useState(false)

  // 3. Chốt két showroom & Lưu kho sao kê
  const [settleModalOpen, setSettleModalOpen] = useState(false)
  const [settling, setSettling] = useState(false)
  const [settleSuccess, setSettleSuccess] = useState(false)

  const denominationMap: Record<string, number> = {
    '500k': 500000,
    '200k': 200000,
    '100k': 100000,
    '50k': 50000,
    '20k': 20000,
    '10k': 10000,
  }

  const auditTotalCounted = Object.keys(counts).reduce((sum, key) => {
    return sum + (counts[key] || 0) * (denominationMap[key] || 0)
  }, 0)

  const handleAutoMatchAudit = () => {
    let remaining = vault.actualCashInVault
    const newCounts: Record<string, number> = {
      '500k': 0,
      '200k': 0,
      '100k': 0,
      '50k': 0,
      '20k': 0,
      '10k': 0,
    }
    const denoms = [
      { key: '500k', val: 500000 },
      { key: '200k', val: 200000 },
      { key: '100k', val: 100000 },
      { key: '50k', val: 50000 },
      { key: '20k', val: 20000 },
      { key: '10k', val: 10000 },
    ]
    for (const d of denoms) {
      if (remaining >= d.val) {
        const c = Math.floor(remaining / d.val)
        newCounts[d.key] = c
        remaining -= c * d.val
      }
    }
    setCounts(newCounts)
    setAuditVerified(true)
  }

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
    isWarehouseStaff,
    isSalesStaff,
    roleTitle,
    roleBadgeText,
    roleBadgeBg,
    roleBadgeColor,
    employeeName,
    employeeEmail,
    employeePhone,
  } = useUserRole()
  const { stats } = useStore()
  const isLao = locale === 'lo'
  const tr = (viText: string, loText: string) => (isLao ? loText : viText)

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
                  { backgroundColor: roleBadgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.posBadgeText,
                    { color: roleBadgeColor },
                  ]}
                >
                  {isWarehouseStaff
                    ? tr('THỦ KHO', 'ນາຍສາງ')
                    : isStoreOwner
                    ? tr('CHỦ QUÁN', 'ເຈົ້າຂອງຮ້ານ')
                    : tr('BÁN HÀNG', 'ພະນັກງານຂາຍ')}
                </Text>
              </View>
            </View>
            <View style={styles.brandSubRow}>
              <Ionicons name="storefront" size={11} color="#58413F" />
              <Text style={styles.brandSubtitle}>
                {isStoreOwner
                  ? tr('Chi nhánh Cầu Giấy • Quản lý', 'ສາຂາ Cầu Giấy • ຜູ້ຈັດການ')
                  : isWarehouseStaff
                  ? tr('Chi nhánh Cầu Giấy • Kho Vận', 'ສາຂາ Cầu Giấy • ພະແນກສາງ')
                  : tr('Chi nhánh Cầu Giấy • Tôi', 'ສາຂາ Cầu Giấy • ໂປຣໄຟລ໌')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            style={styles.iconCircleBtn}
            accessibilityRole="button"
            accessibilityLabel={tr('Thông báo', 'ແຈ້ງເຕືອນ')}
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
                  onPress={() => Alert.alert(tr('Thông tin', 'ຂໍ້ມູນ'), tr('Chỉnh sửa thông tin tài khoản cá nhân.', 'ແກ້ໄຂຂໍ້ມູນບັນຊີສ່ວນຕົວ.'))}
                >
                  <Ionicons name="create-outline" size={13} color="#58413F" />
                  <Text style={styles.editText}>{tr('Sửa', 'ແກ້ໄຂ')}</Text>
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
                name={isStoreOwner ? 'shield-checkmark' : isWarehouseStaff ? 'cube' : 'shield-checkmark-outline'}
                size={15}
                color="#7A0C10"
              />
            </View>
            <View style={styles.rankTextBox}>
              <Text style={styles.rankTitle}>
                {isStoreOwner
                  ? tr('CẤP BẬC TỔNG QUẢN', 'ລະດັບຜູ້ຈັດການໃຫຍ່')
                  : isWarehouseStaff
                  ? tr('CẤP BẬC QUẢN LÝ KHO', 'ລະດັບການຈັດການສາງ')
                  : tr('CẤP BẬC CHUYÊN MÔN', 'ລະດັບວິຊາສະເພາະ')}
              </Text>
              <Text style={styles.rankValue}>
                {isStoreOwner
                  ? tr('Chủ quán / Quản lý Điều hành Flagship #01 (Toàn quyền)', 'ເຈົ້າຂອງຮ້ານ / ຜູ້ຈັດການບໍລິຫານ Flagship #01 (ສິດເຕັມ)')
                  : isWarehouseStaff
                  ? tr('Thủ kho & Quản lý 142 thiết bị IMEI (Flagship Level 2)', 'ນາຍສາງ & ຄຸ້ມຄອງ 142 ອຸປະກອນ IMEI (Flagship Level 2)')
                  : tr('Nhân viên Bán hàng & Tư vấn POS (Flagship Level 2)', 'ພະນັກງານຂາຍ & ໃຫ້ຄຳປຶກສາ POS (Flagship Level 2)')}
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
                    <Text style={styles.ownerVaultTitle}>{tr('SỔ QUỸ & CHỐT KÉT SHOWROOM', 'ປຶ້ມບັນຊີ & ປິດເຊບໜ້າຮ້ານ')}</Text>
                    <Text style={styles.ownerVaultTime}>{tr('08:00 — 16:30 (Hôm nay)', '08:00 — 16:30 (ມື້ນີ້)')}</Text>
                  </View>
                </View>
                <View style={styles.ownerVaultStatusPill}>
                  <View style={styles.pulseLiveDot} />
                  <Text style={styles.ownerVaultStatusText}>
                    {vault.isSettled ? tr('Đã chốt két', 'ປິດເຊບແລ້ວ') : tr('Đang mở két', 'ກຳລັງເປີດເຊບ')}
                  </Text>
                </View>
              </View>

              {/* Các dòng biến động tiền */}
              <View style={styles.ownerVaultRowsList}>
                <View style={styles.ownerVaultRowItem}>
                  <View style={styles.ownerVaultRowLabelGroup}>
                    <Ionicons name="swap-horizontal-outline" size={13} color="#6B7280" />
                    <Text style={styles.ownerVaultRowLabel}>
                      {tr('Tiền mặt đầu ca (tiền lẻ trả lại)', 'ເງິນສົດຕົ້ນກະ (ເງິນທອນ)')}
                    </Text>
                  </View>
                  <Text style={styles.ownerVaultRowValDark}>10.000.000 đ</Text>
                </View>

                <View style={styles.ownerVaultRowItem}>
                  <View style={styles.ownerVaultRowLabelGroup}>
                    <Ionicons name="arrow-down-circle-outline" size={13} color="#16A34A" />
                    <Text style={styles.ownerVaultRowLabel}>
                      {tr('Thu tiền mặt bán hàng trong ca', 'ຮັບເງິນສົດຈາກການຂາຍໃນກະ')}
                    </Text>
                  </View>
                  <Text style={styles.ownerVaultRowValGreen}>+{formatMoney(vault.cashSales)}</Text>
                </View>

                <View style={styles.ownerVaultRowItem}>
                  <View style={styles.ownerVaultRowLabelGroup}>
                    <Ionicons name="arrow-up-circle-outline" size={13} color="#DC2626" />
                    <Text style={styles.ownerVaultRowLabel}>
                      {tr('Chi phí vận hành quán tại quầy', 'ລາຍຈ່າຍດຳເນີນງານໜ້າຮ້ານ')}
                    </Text>
                  </View>
                  <Text style={styles.ownerVaultRowValRed}>-{formatMoney(vault.operationalExpenses)}</Text>
                </View>
              </View>

              {/* Khung lớn: TIỀN MẶT THỰC TẾ TRONG KÉT */}
              <View style={styles.ownerActualVaultBox}>
                <View>
                  <Text style={styles.ownerActualVaultLabel}>
                    {tr('TIỀN MẶT THỰC TẾ TRONG KÉT', 'ເງິນສົດຕົວຈິງໃນເຊບ')}
                  </Text>
                  <Text style={styles.ownerActualVaultAmount}>{formatMoney(vault.actualCashInVault)}</Text>
                </View>
                <Pressable
                  style={styles.ownerVaultLockBtn}
                  onPress={() => Alert.alert(tr('Két tiền mặt', 'ເຊບເງິນສົດ'), tr('Két showroom đang được bảo mật điện tử an toàn.', 'ເຊບໜ້າຮ້ານຖືກຮັກສາຄວາມປອດໄພດ້ວຍລະບົບເອເລັກໂຕຣນິກ.'))}
                >
                  <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* Tiến độ doanh số ca đạt chỉ tiêu */}
              <View style={styles.ownerTargetProgressSection}>
                <View style={styles.ownerTargetProgressHeader}>
                  <Text style={styles.ownerTargetProgressLabel}>
                    {tr('Tiến độ doanh số ca đạt chỉ tiêu', 'ຄວາມຄືບໜ້າຍອດຂາຍຕາມເປົ້າໝາຍ')}
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
                  onPress={() => setExpenseModalOpen(true)}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#7A0C10" />
                  <Text style={styles.ownerVaultActionBtnText}>{tr('Chi tiền quán', 'ເບີກຈ່າຍເງິນຮ້ານ')}</Text>
                </Pressable>

                <Pressable
                  style={styles.ownerVaultActionBtn}
                  onPress={() => {
                    handleAutoMatchAudit()
                    setAuditModalOpen(true)
                  }}
                >
                  <Ionicons name="calculator-outline" size={16} color="#191C1E" />
                  <Text style={styles.ownerVaultActionBtnText}>{tr('Kiểm đếm két', 'ກວດນັບເຊບ')}</Text>
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
        ) : isWarehouseStaff ? (
          <View style={styles.shiftCard}>
            {/* Header phiên trực kho - Tránh đè chữ */}
            <View style={styles.shiftHeaderLine}>
              <View style={[styles.shiftHeaderLeft, { flex: 1, minWidth: 0, marginRight: 8 }]}>
                <View style={[styles.shiftIconBox, { backgroundColor: '#B45309', flexShrink: 0 }]}>
                  <Ionicons name="cube" size={17} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.shiftTagText} numberOfLines={1}>
                    {tr('PHIÊN TRỰC KHO VẬN', 'ຜຽນປະຈຳການສາງ')}
                  </Text>
                  <Text style={styles.shiftMainTitle} numberOfLines={1} ellipsizeMode="tail">
                    {tr('Ca chính: Quản lý Kho & IMEI', 'ກະຫຼັກ: ຈັດການສາງ & IMEI')}
                  </Text>
                </View>
              </View>
              <View style={[styles.shiftStatusPill, { backgroundColor: '#FEF3C7', flexShrink: 0 }]}>
                <View style={[styles.pulseLiveDot, { backgroundColor: '#B45309' }]} />
                <Text style={[styles.shiftStatusText, { color: '#B45309' }]}>
                  {tr('Đang trực kho', 'ກຳລັງປະຈຳການ')}
                </Text>
              </View>
            </View>

            {/* Khung giờ */}
            <View style={styles.shiftTimeBox}>
              <View style={styles.shiftTimeLeft}>
                <Ionicons name="time-outline" size={15} color="#58413F" />
                <Text style={styles.shiftTimeLabel}>{tr('Khung giờ:', 'ເວລາເຮັດວຽກ:')}</Text>
              </View>
              <Text style={styles.shiftTimeValue}>
                {tr('08:00 — 16:30 (Hôm nay)', '08:00 — 16:30 (ມື້ນີ້)')}
              </Text>
            </View>

            {/* Thiết bị quản lý */}
            <View style={styles.targetSection}>
              <View style={styles.targetHeaderLine}>
                <Text style={styles.targetLabel}>
                  {tr('THIẾT BỊ TỒN KHO QUẢN LÝ', 'ອຸປະກອນໃນສາງທີ່ຄຸ້ມຄອງ')}
                </Text>
                <Text style={[styles.targetPercent, { color: '#16A34A' }]}>
                  {tr('100% Khớp Barcode', '100% ກົງກັບບາໂຄດ')}
                </Text>
              </View>

              <View style={styles.targetValueLine}>
                <Text style={styles.targetAmountVal}>
                  {stats.imeiInStock} <Text style={styles.targetCurrency}>{tr('máy', 'ເຄື່ອງ')}</Text>
                </Text>
                <Text style={styles.targetHint}>
                  {tr('Sẵn sàng xuất bán showroom', 'ພ້ອມຂາຍຢູ່ໜ້າຮ້ານ')}
                </Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '100%', backgroundColor: '#16A34A' }]} />
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* 2 nút thao tác nhanh kho */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Pressable
                style={[styles.ownerVaultActionBtn, { flex: 1 }]}
                onPress={() =>
                  Alert.alert(
                    tr('Kiểm kê mã vạch', 'ກວດນັບບາໂຄດ'),
                    tr('142/142 thiết bị trong kho đã được quét mã vạch và khớp chính xác thẻ kho.', '142/142 ອຸປະກອນໃນສາງໄດ້ຮັບການສະແກນບາໂຄດຖືກຕ້ອງ 100%.'),
                  )
                }
              >
                <Ionicons name="barcode-outline" size={16} color="#7A0C10" />
                <Text style={styles.ownerVaultActionBtnText}>
                  {tr('Kiểm đếm Barcode', 'ກວດນັບບາໂຄດ')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.ownerVaultActionBtn, { flex: 1 }]}
                onPress={() => router.push('/(app)/(tabs)/orders')}
              >
                <Ionicons name="receipt-outline" size={16} color="#191C1E" />
                <Text style={styles.ownerVaultActionBtnText}>
                  {tr('Phiếu xuất', 'ໃບສັ່ງຈ່າຍ')} ({stats.completedCount})
                </Text>
              </Pressable>
            </View>

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
                  <Text style={styles.managerLabel}>{tr('Quản lý ca trực: ', 'ຜູ້ຈັດການກະ: ')}</Text>
                  <Text style={styles.managerName}>Trần Quốc Bảo</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.shiftCard}>
            {/* Header phiên trực */}
            <View style={styles.shiftHeaderLine}>
              <View style={[styles.shiftHeaderLeft, { flex: 1, minWidth: 0, marginRight: 8 }]}>
                <View style={[styles.shiftIconBox, { flexShrink: 0 }]}>
                  <Ionicons name="briefcase" size={17} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.shiftTagText} numberOfLines={1}>
                    {tr('PHIÊN TRỰC QUẦY', 'ຜຽນປະຈຳເຄົາເຕີ້')}
                  </Text>
                  <Text style={styles.shiftMainTitle} numberOfLines={1} ellipsizeMode="tail">
                    {tr('Ca chính: Bán lẻ & Quầy POS', 'ກະຫຼັກ: ຂາຍຍ່ອຍ & POS')}
                  </Text>
                </View>
              </View>
              <View style={[styles.shiftStatusPill, { flexShrink: 0 }]}>
                <View style={styles.pulseLiveDot} />
                <Text style={styles.shiftStatusText}>
                  {tr('Đang trong ca', 'ກຳລັງຢູ່ໃນກະ')}
                </Text>
              </View>
            </View>

            {/* Khung giờ */}
            <View style={styles.shiftTimeBox}>
              <View style={styles.shiftTimeLeft}>
                <Ionicons name="time-outline" size={15} color="#58413F" />
                <Text style={styles.shiftTimeLabel}>{tr('Khung giờ:', 'ເວລາເຮັດວຽກ:')}</Text>
              </View>
              <Text style={styles.shiftTimeValue}>
                {tr('08:00 — 16:30 (Hôm nay)', '08:00 — 16:30 (ມື້ນີ້)')}
              </Text>
            </View>

            {/* Doanh số đã chốt & Progress Bar */}
            {(() => {
              const rev = stats.revenueToday || 128450000;
              const target = 150000000;
              const pct = Math.min(100, Math.round((rev / target) * 100));
              const formattedRev = formatMoney(rev);
              const formattedTarget = formatMoney(target);
              return (
                <View style={styles.targetSection}>
                  <View style={styles.targetHeaderLine}>
                    <Text style={styles.targetLabel}>DOANH SỐ ĐÃ CHỐT</Text>
                    <Text style={styles.targetPercent}>{pct}% chỉ tiêu</Text>
                  </View>

                  <View style={styles.targetValueLine}>
                    <Text style={styles.targetAmountVal}>{formattedRev}</Text>
                    <Text style={styles.targetHint}>Mục tiêu: {formattedTarget}</Text>
                  </View>

                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })()}

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
            <Text style={styles.settingsTitle}>{tr('Cài đặt & Nghiệp vụ POS', 'ການຕັ້ງຄ່າ & ລະບົບ POS')}</Text>
            <Text style={styles.systemVersionText}>{tr('Hệ thống v2.6', 'ລະບົບ v2.6')}</Text>
          </View>

          {/* Mục 1: Bộ chuyển đổi ngôn ngữ */}
          <View style={styles.settingItemBox}>
            <View style={styles.settingItemTop}>
              <View style={styles.settingItemLeftGroup}>
                <Ionicons name="language" size={18} color="#7A0C10" />
                <Text style={styles.settingItemTitle}>{tr('Ngôn ngữ hiển thị', 'ພາສາສະແດງຜົນ')}</Text>
              </View>
              <Text style={styles.settingItemSubtext}>{tr('Song ngữ Việt - Lào', 'ສອງພາສາ ຫວຽດ - ລາວ')}</Text>
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
                tr('Tiện ích Quán Nhỏ', 'ສິ່ງອຳນວຍຄວາມສະດວກ ຮ້ານນ້ອຍ'),
                tr(
                  'Thực đơn trà và cà phê pha máy phục vụ khách hàng trải nghiệm tại Flagship #01.',
                  'ເມນູຊາ ແລະ ກາເຟ ບໍລິການລູກຄ້າທີ່ມາໃຊ້ບໍລິການທີ່ Flagship #01.'
                )
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
                    <Text style={styles.settingItemTitle}>{tr('Tiện ích "Quán Nhỏ"', 'ສິ່ງອຳນວຍຄວາມສະດວກ "ຮ້ານນ້ອຍ"')}</Text>
                    <View style={styles.vipBadge}>
                      <Text style={styles.vipBadgeText}>VIP Care</Text>
                    </View>
                  </View>
                  <Text style={styles.vipSubtext} numberOfLines={1}>
                    {tr('Gọi trà, cà phê phục vụ khách tại bàn trải nghiệm máy', 'ບໍລິການຊາ, ກາເຟ ສຳລັບລູກຄ້າທີ່ມາໃຊ້ບໍລິການ')}
                  </Text>
                </View>
              </View>
              <View style={styles.vipRight}>
                <Text style={styles.menuLinkText}>{tr('Menu', 'ເມນູ')}</Text>
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
                  <Text style={styles.settingItemTitle}>{tr('Máy in bill hóa đơn POS', 'ເຄື່ອງພິມໃບບິນ POS')}</Text>
                  <Text style={styles.printerSubtext}>Epson TM-T82 (Cổng LAN/Bluetooth)</Text>
                </View>
              </View>
              <View style={styles.printerRight}>
                <View style={styles.readyPill}>
                  <View style={styles.readyDot} />
                  <Text style={styles.readyText}>{tr('Sẵn sàng', 'ພ້ອມໃຊ້ງານ')}</Text>
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
                  <Text style={styles.settingItemTitle}>{tr('Máy chủ POS Trung tâm', 'ເຊີເວີ POS ສູນກາງ')}</Text>
                  <Text style={styles.serverSubtext}>{tr('Đồng bộ đám mây thời gian thực', 'ຊິງຄ໌ຄລາວແບບເວລາຈິງ')}</Text>
                </View>
              </View>
              <View style={styles.serverRight}>
                <View style={styles.serverPingRow}>
                  <Ionicons name="wifi" size={13} color="#7A0C10" />
                  <Text style={styles.serverPingVal}>18 ms</Text>
                </View>
                <Text style={styles.serverStatusSub}>{tr('Bình thường', 'ປົກກະຕິ')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 4. Nút Đăng Xuất & Footer ── */}
        <View style={styles.logoutSection}>
          {isStoreOwner && (
            <Pressable
              style={styles.confirmSettleBtn}
              onPress={() => setSettleModalOpen(true)}
            >
              <View style={styles.confirmSettleLeft}>
                <Ionicons name="refresh-circle-outline" size={24} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.confirmSettleTitle}>
                    {tr('XÁC NHẬN CHỐT KÉT & LƯU KHO SAO KÊ', 'ຢືນຢັນປິດເຊບ & ບັນທຶກສາງ')}
                  </Text>
                  <Text style={styles.confirmSettleSubtitle}>
                    {tr('Tự động đồng bộ máy chủ & in 02 liên bàn giao ca', 'ຊິງຄ໌ອັດຕະໂນມັດ & ພິມ 02 ໃບມອບໂອນກະ')}
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
                ? tr('ĐĂNG XUẤT TÀI KHOẢN CHỦ QUÁN', 'ອອກຈາກລະບົບເຈົ້າຂອງຮ້ານ')
                : tr('ĐĂNG XUẤT TÀI KHOẢN POS', 'ອອກຈາກລະບົບ POS')}
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
              {tr('Bản quyền thiết kế & vận hành thuộc Liêng Mobile Inc.', 'ສະຫງວນລິຂະສິດໂດຍ Liêng Mobile Inc.')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── MODAL 1: CHI TIỀN QUÁN TẠI QUẦY ── */}
      <Modal
        visible={expenseModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setExpenseModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialogCard}>
            <View style={styles.modalDialogHeader}>
              <View style={styles.modalDialogTitleGroup}>
                <View style={[styles.modalDialogIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="cash-outline" size={18} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.modalDialogTitle}>{tr('Phiếu chi quỹ quán tại quầy', 'ໃບເບີກຈ່າຍເງິນສົດຮ້ານ')}</Text>
                  <Text style={styles.modalDialogSubtitle}>{tr('Ghi nhận chi phí trực tiếp vào sổ két', 'ບັນທຶກລາຍຈ່າຍເຂົ້າໃນປຶ້ມເຊບ')}</Text>
                </View>
              </View>
              <Pressable onPress={() => setExpenseModalOpen(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Quick chips lý do chi */}
            <Text style={styles.formInputLabel}>{tr('Lý do chi tiền:', 'ເຫດຜົນການຈ່າຍ:')}</Text>
            <View style={styles.quickChipsWrap}>
              {[
                'Nước & Cafe khách VIP',
                'Giấy in & Văn phòng phẩm',
                'Chi phí kỹ thuật gấp',
                'Tiếp khách & Đối tác',
              ].map((reason) => (
                <Pressable
                  key={reason}
                  style={[styles.quickChipItem, expenseTitle === reason && styles.quickChipItemActive]}
                  onPress={() => setExpenseTitle(reason)}
                >
                  <Text style={[styles.quickChipText, expenseTitle === reason && styles.quickChipTextActive]}>
                    {reason}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.modalTextInput}
              value={expenseTitle}
              onChangeText={setExpenseTitle}
              placeholder={tr('Nhập lý do chi...', 'ປ້ອນເຫດຜົນການຈ່າຍ...')}
            />

            {/* Số tiền chi */}
            <Text style={[styles.formInputLabel, { marginTop: 12 }]}>{tr('Số tiền chi (VNĐ):', 'ຈຳນວນເງິນຈ່າຍ (VNĐ):')}</Text>
            <View style={styles.quickChipsWrap}>
              {['50000', '100000', '150000', '250000', '500000'].map((amt) => (
                <Pressable
                  key={amt}
                  style={[styles.quickChipItem, expenseAmount === amt && styles.quickChipItemActive]}
                  onPress={() => setExpenseAmount(amt)}
                >
                  <Text style={[styles.quickChipText, expenseAmount === amt && styles.quickChipTextActive]}>
                    {formatMoney(Number(amt))}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[styles.modalTextInput, { fontSize: 16, fontWeight: '700', color: '#DC2626' }]}
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              keyboardType="numeric"
              placeholder="0"
            />

            {/* Người nhận */}
            <Text style={[styles.formInputLabel, { marginTop: 12 }]}>{tr('Người nhận tiền / Nhân viên phụ trách:', 'ຜູ້ຮັບເງິນ / ພະນັກງານຮັບຜິດຊອບ:')}</Text>
            <TextInput
              style={styles.modalTextInput}
              value={expenseRecipient}
              onChangeText={setExpenseRecipient}
              placeholder={tr('Nhân viên quầy...', 'ພະນັກງານເຄົາເຕີ້...')}
            />

            {/* Nút hành động */}
            <View style={styles.modalActionsRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setExpenseModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>{tr('Hủy bỏ', 'ຍົກເລີກ')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmitBtn, { backgroundColor: '#DC2626' }]}
                disabled={expenseSubmitting}
                onPress={async () => {
                  const num = Number(expenseAmount.replace(/\./g, '').replace(/,/g, '').trim()) || 0
                  if (num <= 0) {
                    Alert.alert(tr('Lỗi', 'ຂໍ້ຜິດພາດ'), tr('Vui lòng nhập số tiền hợp lệ.', 'ກະລຸນາປ້ອນຈຳນວນເງິນທີ່ຖືກຕ້ອງ.'))
                    return
                  }
                  setExpenseSubmitting(true)
                  try {
                    await recordVaultExpense(num, expenseTitle, expenseRecipient)
                    Alert.alert(
                      tr('Chi quỹ thành công 🎉', 'ເບີກຈ່າຍເງິນສຳເລັດ 🎉'),
                      tr(
                        `Đã xuất quỹ ${formatMoney(num)} cho: ${expenseTitle}.\nTiền mặt két đã được cập nhật tự động.`,
                        `ໄດ້ເບີກຈ່າຍ ${formatMoney(num)} ສຳລັບ: ${expenseTitle}.\nເງິນສົດໃນເຊບຖືກອັບເດດແລ້ວ.`
                      )
                    )
                    setExpenseModalOpen(false)
                  } finally {
                    setExpenseSubmitting(false)
                  }
                }}
              >
                {expenseSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>{tr('Xác nhận chi tiền', 'ຢືນຢັນການຈ່າຍ')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: KIỂM ĐẾM KÉT TIỀN MẶT ── */}
      <Modal
        visible={auditModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setAuditModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialogCard}>
            <View style={styles.modalDialogHeader}>
              <View style={styles.modalDialogTitleGroup}>
                <View style={[styles.modalDialogIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="calculator-outline" size={18} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.modalDialogTitle}>{tr('Kiểm đếm két tiền mặt', 'ກວດນັບເຊບເງິນສົດ')}</Text>
                  <Text style={styles.modalDialogSubtitle}>{tr('Bảng kiểm đếm mệnh giá thực tế theo ca', 'ຕາຕະລາງກວດນັບມູນຄ່າເງິນຕົວຈິງ')}</Text>
                </View>
              </View>
              <Pressable onPress={() => setAuditModalOpen(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Bảng mệnh giá */}
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {[
                { key: '500k', label: '500.000 đ', val: 500000 },
                { key: '200k', label: '200.000 đ', val: 200000 },
                { key: '100k', label: '100.000 đ', val: 100000 },
                { key: '50k', label: '50.000 đ', val: 50000 },
                { key: '20k', label: '20.000 đ', val: 20000 },
                { key: '10k', label: '10.000 đ', val: 10000 },
              ].map((item) => {
                const count = counts[item.key] || 0
                return (
                  <View key={item.key} style={styles.denomRow}>
                    <Text style={styles.denomLabel}>{item.label}</Text>
                    <View style={styles.stepperWrap}>
                      <Pressable
                        style={styles.stepperBtn}
                        onPress={() => setCounts((prev) => ({ ...prev, [item.key]: Math.max(0, (prev[item.key] || 0) - 1) }))}
                      >
                        <Ionicons name="remove" size={13} color="#374151" />
                      </Pressable>
                      <Text style={styles.stepperVal}>{count}</Text>
                      <Pressable
                        style={styles.stepperBtn}
                        onPress={() => setCounts((prev) => ({ ...prev, [item.key]: (prev[item.key] || 0) + 1 }))}
                      >
                        <Ionicons name="add" size={13} color="#374151" />
                      </Pressable>
                    </View>
                    <Text style={styles.denomSubtotal}>{formatMoney(count * item.val)}</Text>
                  </View>
                )
              })}
            </ScrollView>

            {/* Tổng kiểm đếm vs Sổ sách */}
            <View style={styles.auditSummaryCard}>
              <View style={styles.auditSummaryRow}>
                <Text style={styles.auditSummaryLabel}>{tr('Tổng tiền kiểm đếm:', 'ຍອດເງິນກວດນັບ:')}</Text>
                <Text style={styles.auditSummaryValDark}>{formatMoney(auditTotalCounted)}</Text>
              </View>
              <View style={styles.auditSummaryRow}>
                <Text style={styles.auditSummaryLabel}>{tr('Số dư theo sổ quỹ:', 'ຍອດຕາມປຶ້ມບັນຊີ:')}</Text>
                <Text style={styles.auditSummaryValDark}>{formatMoney(vault.actualCashInVault)}</Text>
              </View>
              <View style={[styles.auditSummaryRow, { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 6, marginTop: 4 }]}>
                <Text style={[styles.auditSummaryLabel, { fontWeight: '700' }]}>{tr('Chênh lệch kiểm két:', 'ສ່ວນຕ່າງກວດເຊບ:')}</Text>
                <Text
                  style={[
                    styles.auditSummaryValDark,
                    {
                      color: auditTotalCounted === vault.actualCashInVault ? '#16A34A' : '#DC2626',
                      fontWeight: '800',
                    },
                  ]}
                >
                  {auditTotalCounted === vault.actualCashInVault
                    ? tr('0 đ (Khớp 100%)', '0 ກີບ (ກົງກັນ 100%)')
                    : formatMoney(auditTotalCounted - vault.actualCashInVault)}
                </Text>
              </View>
            </View>

            {/* Nút hành động */}
            <View style={styles.modalActionsRow}>
              <Pressable
                style={[styles.modalCancelBtn, { borderColor: '#D97706' }]}
                onPress={handleAutoMatchAudit}
              >
                <Text style={[styles.modalCancelBtnText, { color: '#D97706' }]}>{tr('Khớp nhanh 100%', 'ກົງກັນດ່ວນ 100%')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmitBtn, { backgroundColor: '#16A34A' }]}
                onPress={() => {
                  Alert.alert(
                    tr('Đã lưu biên bản kiểm đếm 🎉', 'ບັນທຶກໃບກວດນັບສຳເລັດ 🎉'),
                    tr(
                      `Đã xác nhận kiểm đếm: Tổng tiền ${formatMoney(auditTotalCounted)} khớp 100% với số dư két.`,
                      `ໄດ້ຢືນຢັນການກວດນັບ: ຍອດເງິນ ${formatMoney(auditTotalCounted)} ກົງກັນ 100% ກັບເຊບ.`
                    )
                  )
                  setAuditModalOpen(false)
                }}
              >
                <Text style={styles.modalSubmitBtnText}>{tr('Lưu biên bản kiểm két', 'ບັນທຶກໃບກວດເຊບ')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: XÁC NHẬN CHỐT KÉT & LƯU KHO SAO KÊ ── */}
      <Modal
        visible={settleModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setSettleModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialogCard}>
            <View style={styles.modalDialogHeader}>
              <View style={styles.modalDialogTitleGroup}>
                <View style={[styles.modalDialogIconCircle, { backgroundColor: '#FFD9DC' }]}>
                  <Ionicons name="document-text-outline" size={18} color="#7A0C10" />
                </View>
                <View>
                  <Text style={styles.modalDialogTitle}>{tr('Biên bản chốt ca & Lưu kho sao kê', 'ໃບສະຫຼຸບປິດກະ & ບັນທຶກສາງ')}</Text>
                  <Text style={styles.modalDialogSubtitle}>BB-CK-20261113-01 • Liêng Mobile Flagship #01</Text>
                </View>
              </View>
              <Pressable onPress={() => setSettleModalOpen(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Bảng kê số liệu */}
            <View style={styles.auditSummaryCard}>
              <View style={styles.auditSummaryRow}>
                <Text style={styles.auditSummaryLabel}>{tr('Doanh số hôm nay:', 'ຍອດຂາຍມື້ນີ້:')}</Text>
                <Text style={[styles.auditSummaryValDark, { fontWeight: '700' }]}>{formatMoney(stats.ownerRevenueToday)}</Text>
              </View>
              <View style={styles.auditSummaryRow}>
                <Text style={styles.auditSummaryLabel}>{tr('Tiền mặt đầu ca:', 'ເງິນສົດຕົ້ນກະ:')}</Text>
                <Text style={styles.auditSummaryValDark}>10.000.000 đ</Text>
              </View>
              <View style={styles.auditSummaryRow}>
                <Text style={styles.auditSummaryLabel}>{tr('Thu tiền mặt trong ca:', 'ຮັບເງິນສົດໃນກະ:')}</Text>
                <Text style={[styles.auditSummaryValDark, { color: '#16A34A', fontWeight: '700' }]}>+{formatMoney(vault.cashSales)}</Text>
              </View>
              <View style={styles.auditSummaryRow}>
                <Text style={styles.auditSummaryLabel}>{tr('Chi phí quán tại quầy:', 'ລາຍຈ່າຍໜ້າຮ້ານ:')}</Text>
                <Text style={[styles.auditSummaryValDark, { color: '#DC2626', fontWeight: '700' }]}>-{formatMoney(vault.operationalExpenses)}</Text>
              </View>
              <View style={[styles.auditSummaryRow, { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, marginTop: 4 }]}>
                <Text style={[styles.auditSummaryLabel, { fontWeight: '800', color: '#7A0C10' }]}>
                  {tr('TIỀN MẶT BÀN GIAO KÉT:', 'ເງິນສົດມອບໂອນຕົວຈິງ:')}
                </Text>
                <Text style={[styles.auditSummaryValDark, { fontWeight: '900', color: '#7A0C10', fontSize: 16 }]}>
                  {formatMoney(vault.actualCashInVault)}
                </Text>
              </View>
            </View>

            {/* Trạng thái xác minh */}
            <View style={styles.verifiedStampBox}>
              <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
              <Text style={styles.verifiedStampText}>
                {tr('Đã đối soát 100% khớp thẻ kho & máy in bill Epson TM-T82 sẵn sàng.', 'ກວດສອບກົງກັນ 100% ກັບສາງ ແລະ ເຄື່ອງພິມໃບບິນ.')}
              </Text>
            </View>

            {/* Nút hành động */}
            <View style={styles.modalActionsRow}>
              <Pressable
                style={[styles.modalCancelBtn, { borderColor: '#7A0C10' }]}
                onPress={() => {
                  Alert.alert(
                    tr('Máy in Epson TM-T82', 'ເຄື່ອງພິມ Epson TM-T82'),
                    tr('Đã gửi lệnh in 02 liên bàn giao ca (Liên 1 Kế toán, Liên 2 Bàn giao ca).', 'ໄດ້ສົ່ງຄຳສັ່ງພິມ 02 ໃບມອບໂອນກະ.')
                  )
                }}
              >
                <Ionicons name="print-outline" size={15} color="#7A0C10" />
                <Text style={[styles.modalCancelBtnText, { color: '#7A0C10', marginLeft: 4 }]}>{tr('In 02 liên', 'ພິມ 02 ໃບ')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmitBtn, { backgroundColor: '#7A0C10' }]}
                disabled={settling}
                onPress={async () => {
                  setSettling(true)
                  try {
                    await settleVault('Chốt két ca trực 08:00 - 16:30 hoàn tất không chênh lệch.')
                    setSettleModalOpen(false)
                    Alert.alert(
                      tr('Chốt két thành công 🎉', 'ປິດເຊບສຳເລັດ 🎉'),
                      tr(
                        `Đã lưu kho sao kê thành công!\nSố tiền bàn giao két: ${formatMoney(vault.actualCashInVault)}\nTự động in 02 liên bàn giao ca tiếp theo.`,
                        `ໄດ້ບັນທຶກສາງລາຍການສຳເລັດ!\nຍອດເງິນມອບໂອນ: ${formatMoney(vault.actualCashInVault)}.`
                      )
                    )
                  } finally {
                    setSettling(false)
                  }
                }}
              >
                {settling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>{tr('Xác nhận & Lưu kho', 'ຢືນຢັນ & ບັນທຶກ')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

  // ── Modal Styles ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalDialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modalDialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },
  modalDialogTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalDialogIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDialogTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
  },
  modalDialogSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  formInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  quickChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  quickChipItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickChipItemActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  quickChipText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  quickChipTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  modalTextInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#111827',
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalCancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalSubmitBtn: {
    flex: 1.5,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Denominations
  denomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  denomLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
    width: 80,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepperVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    minWidth: 24,
    textAlign: 'center',
  },
  denomSubtotal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
    width: 90,
    textAlign: 'right',
  },
  auditSummaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  auditSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  auditSummaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  auditSummaryValDark: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
  },
  verifiedStampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  verifiedStampText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
    flex: 1,
  },
})
