import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import * as ordersApi from '@/api/orders'
import { fetchDashboardReport } from '@/api/reports'
import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/context/StoreContext'
import { useLocale } from '@/context/LocaleContext'
import { useUserRole } from '@/hooks/useUserRole'
import { formatDateTimeVi, formatMoney } from '@/utils/format'

interface RecentOrder {
  id: number | string
  code: string
  customerName: string
  total: number
  itemCount: number
  summary: string
  createdAt: string
  status: 'completed' | 'pending' | 'cancelled' | 'tradein'
  cashier: string
}

// Dữ liệu mẫu nhân viên bán hàng
const STAFF_RECENT_ORDERS: RecentOrder[] = [
  {
    id: 1,
    code: 'HD-20261109-023',
    customerName: 'Anh Hoàng Long',
    total: 29490000,
    itemCount: 1,
    summary: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
    createdAt: '14:32',
    status: 'completed',
    cashier: 'Nguyễn Văn A',
  },
  {
    id: 2,
    code: 'HD-20261109-022',
    customerName: 'Chị Minh Thư',
    total: 26890000,
    itemCount: 1,
    summary: 'Samsung Galaxy S24 Ultra 512GB Xám Titan',
    createdAt: '13:10',
    status: 'completed',
    cashier: 'Nguyễn Văn A',
  },
  {
    id: 3,
    code: 'HD-20261109-021',
    customerName: 'Anh Tuấn Kiệt',
    total: 5390000,
    itemCount: 1,
    summary: 'AirPods Pro 2 USB-C (VN/A)',
    createdAt: '11:45',
    status: 'pending',
    cashier: 'Nguyễn Văn A',
  },
  {
    id: 4,
    code: 'HD-20261109-020',
    customerName: 'Chị Lan Anh',
    total: 850000,
    itemCount: 2,
    summary: 'Củ sạc 20W + Kính Kingbull',
    createdAt: '10:20',
    status: 'completed',
    cashier: 'Nguyễn Văn A',
  },
]

// Dữ liệu mẫu toàn showroom cho Chủ quán chuẩn Google Stitch Screen e3af6d7a4df34e0f8206b3417d7a8d94
const OWNER_RECENT_ORDERS: RecentOrder[] = [
  {
    id: 1,
    code: 'HD-20261109-024',
    customerName: 'Anh Hoàng Nam • Ck ngân hàng Vietcombank',
    total: 25490000,
    itemCount: 1,
    summary: 'iPhone 15 Pro 128GB Blue',
    createdAt: '14:42',
    status: 'completed',
    cashier: 'Nguyễn Văn A',
  },
  {
    id: 2,
    code: 'HD-20261109-023',
    customerName: 'Chị Thảo My • Quẹt thẻ POS',
    total: 29990000,
    itemCount: 1,
    summary: 'Galaxy S24 Ultra 512GB',
    createdAt: '14:15',
    status: 'completed',
    cashier: 'Nguyễn Văn A',
  },
  {
    id: 3,
    code: 'HD-20261109-022',
    customerName: 'Nguyễn Đức • Tiền mặt két',
    total: 5490000,
    itemCount: 1,
    summary: 'AirPods Pro 2 Type-C',
    createdAt: '13:50',
    status: 'completed',
    cashier: 'Nguyễn Văn A',
  },
  {
    id: 4,
    code: 'TC-2026-045',
    customerName: 'Khách đổi máy • Đã test KT',
    total: 9200000,
    itemCount: 1,
    summary: 'iPhone 13 128GB Pink',
    createdAt: '13:10',
    status: 'tradein',
    cashier: 'KT #04',
  },
]

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const { locale } = useLocale()
  const isLao = locale === 'lo'
  const tr = (vi: string, lo: string) => (isLao ? lo : vi)
  const {
    isStoreOwner,
    isWarehouseStaff,
    isSalesStaff,
    employeeName,
    roleTitle,
    roleBadgeText,
    roleBadgeBg,
    roleBadgeColor,
    canApproveDiscount,
  } = useUserRole()
  const {
    stats,
    pendingApprovals,
    recentOrders: storeRecentOrders,
    approveOwnerRequest,
    rejectOwnerRequest,
    refreshStoreData,
  } = useStore()
  const [refreshing, setRefreshing] = useState(false)
  const [staffStats, setStaffStats] = useState({
    revenueToday: 128450000,
    growthPercent: '+18.2%',
    ordersToday: 22,
    imeiInStock: 142,
    servicesPending: 3,
  })
  const [staffRecentOrders, setRecentOrders] = useState<RecentOrder[]>(STAFF_RECENT_ORDERS)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshStoreData()
      const [res, report] = await Promise.all([
        ordersApi.fetchOrders({ per_page: 5 }).catch(() => null),
        fetchDashboardReport().catch(() => null),
      ])

      if (report) {
        setStaffStats((prev) => ({
          ...prev,
          revenueToday: Number(report.today_revenue) || prev.revenueToday,
          ordersToday: Number(report.today_orders) || prev.ordersToday,
          imeiInStock: Number(report.imei_in_stock) ?? prev.imeiInStock,
          servicesPending: Number(report.services_pending) ?? prev.servicesPending,
          growthPercent: report.revenue_cost_chart?.monthly?.summary?.growth
            ? `+${report.revenue_cost_chart.monthly.summary.growth}%`
            : prev.growthPercent,
        }))
      }

      const raw = res?.data ?? res
      if (Array.isArray(raw) && raw.length > 0) {
        const mapped: RecentOrder[] = raw.slice(0, 4).map((o: any) => ({
          id: o.id,
          code: o.code || `HD-${o.id}`,
          customerName: o.customer_name || o.customerName || 'Khách lẻ tại quầy',
          total: Number(o.total_amount ?? o.total ?? 0),
          itemCount: o.items ? o.items.length : (o.itemCount || 1),
          summary: o.itemsSummary || (o.items
            ? o.items.map((i: any) => i.product_name || i.name).join(', ')
            : 'Đơn bán lẻ showroom'),
          createdAt: (o.created_at || o.createdAt) ? formatDateTimeVi(o.created_at || o.createdAt) : 'Hôm nay',
          status: o.status === 'completed' || o.status === 'paid' ? 'completed' : 'pending',
          cashier: o.staffName || user?.name || 'Nguyễn Văn A',
        }))
        setRecentOrders(mapped)
      }
    } catch {
      // Fallback Stitch dữ liệu chuẩn showroom
    } finally {
      setRefreshing(false)
    }
  }, [refreshStoreData, user?.name])

  useEffect(() => {
    onRefresh()
  }, [onRefresh])

  const handleApproveDiscount = async (id: string) => {
    await approveOwnerRequest(id)
    Alert.alert(
      'Đã duyệt chiết khấu 🎉',
      'Đã chấp thuận chiết khấu VIP. Yêu cầu đã được lưu trạng thái và hoàn tất!',
    )
  }

  const handleRejectDiscount = async (id: string) => {
    await rejectOwnerRequest(id)
    Alert.alert('Từ chối', 'Đã từ chối áp dụng chiết khấu đặc biệt này.')
  }

  const handleApproveTradein = async (id: string) => {
    await approveOwnerRequest(id)
    Alert.alert(
      'Đã duyệt giá thu máy 🎉',
      'Đã phê duyệt định giá Trade-in bù thành công và lưu vào hệ thống.',
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header chuẩn Stitch Mobile ── */}
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
                  : tr('Chi nhánh Cầu Giấy • Bán Hàng', 'ສາຂາ Cầu Giấy • ພະແນກຂາຍ')}
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
            <Ionicons name="notifications-outline" size={20} color={Colors.onSurface} />
            <View style={styles.unreadDot} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/account')}
            style={styles.avatarBtn}
            accessibilityRole="button"
            accessibilityLabel={tr('Tài khoản', 'ໂປຣໄຟລ໌')}
          >
            <Ionicons name="person-circle-outline" size={26} color={Colors.primaryContainer} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryContainer}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting & Trạng thái ca trực ── */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greetingText}>
              {tr('Xin chào,', 'ສະບາຍດີ,')} {isStoreOwner ? 'Tran Quoc B...' : employeeName} 👋
            </Text>
            <View style={styles.storeBadgeRow}>
              <Ionicons name="business-outline" size={13} color={Colors.onSurfaceVariant} />
              <Text style={styles.storeBadgeText}>
                {isStoreOwner
                  ? 'Liêng Mobile • Flagship #01 (Q.3)'
                  : isWarehouseStaff
                  ? tr('Liêng Mobile • Trung tâm Kho Flagship', 'Liêng Mobile • ສູນສາງ Flagship')
                  : 'Liêng Mobile • Flagship #01'}
              </Text>
            </View>
          </View>
          <View style={styles.shiftActivePill}>
            <View style={styles.pulseLiveDot} />
            <Text style={styles.shiftActiveText}>
              {isStoreOwner
                ? tr('Đang trực ca', 'ກຳລັງຢູ່ໃນກະ')
                : isWarehouseStaff
                ? tr('Đang trực kho', 'ກຳລັງປະຈຳການ')
                : tr('Trong ca trực', 'ກຳລັງຢູ່ໃນກະ')}
            </Text>
          </View>
        </View>

        {/* ── Hero Crimson Banner ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlowCorner} />
          <View style={styles.flagshipPill}>
            <Ionicons
              name={isStoreOwner ? 'shield-checkmark' : isWarehouseStaff ? 'cube' : 'sparkles'}
              size={12}
              color="#FF8076"
            />
            <Text style={styles.flagshipPillText}>
              {isStoreOwner
                ? tr('QUẢN TRỊ SHOWROOM', 'ຄຸ້ມຄອງໜ້າຮ້ານ')
                : isWarehouseStaff
                ? tr('QUẢN LÝ KHO & THIẾT BỊ', 'ຄຸ້ມຄອງສາງ & ອຸປະກອນ')
                : tr('BÁN LẺ SHOWROOM', 'ຂາຍຍ່ອຍໜ້າຮ້ານ')}
            </Text>
          </View>
          <Text style={styles.heroTitle}>
            {isStoreOwner
              ? tr('Quản trị vận hành Showroom & Quầy POS', 'ຄຸ້ມຄອງດຳເນີນງານໜ້າຮ້ານ & ເຄົາເຕີ້ POS')
              : isWarehouseStaff
              ? tr('Trung tâm Quản lý Kho & Thiết bị IMEI', 'ສູນຄຸ້ມຄອງສາງ & ອຸປະກອນ IMEI')
              : tr('Quản lý bán lẻ & Quầy POS', 'ຄຸ້ມຄອງຂາຍຍ່ອຍ & ເຄົາເຕີ້ POS')}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isStoreOwner
              ? tr('Hệ thống điều hành chuẩn hóa tốc độ cao, quản lý IMEI & thanh toán VietQR đa cổng.', 'ລະບົບດຳເນີນງານມາດຕະຖານຄວາມໄວສູງ, ຄຸ້ມຄອງ IMEI & ຊຳລະ VietQR.')
              : isWarehouseStaff
              ? tr(`Hệ thống kiểm đếm tồn kho, quản lý ${stats.imeiInStock} thiết bị sẵn sàng và đối soát xuất kho bảo hành.`, `ລະບົບກວດນັບສາງ, ຄຸ້ມຄອງ ${stats.imeiInStock} ອຸປະກອນພ້ອມຈ່າຍ ແລະ ກວດສອບສາງປະກັນ.`)
              : tr('Hệ thống điều hành chuẩn hóa tốc độ cao, quản lý IMEI & thanh toán VietQR đa cổng.', 'ລະບົບດຳເນີນງານມາດຕະຖານຄວາມໄວສູງ, ຄຸ້ມຄອງ IMEI & ຊຳລະ VietQR.')}
          </Text>
          <Pressable
            onPress={() =>
              router.push(isWarehouseStaff ? '/(app)/(tabs)/services' : '/(app)/(tabs)/pos')
            }
            style={({ pressed }) => [styles.heroCtaBtn, pressed && { opacity: 0.9 }]}
          >
            <Ionicons
              name={
                isStoreOwner
                  ? 'cart-outline'
                  : isWarehouseStaff
                  ? 'cube-outline'
                  : 'cart-outline'
              }
              size={18}
              color={Colors.primaryContainer}
            />
            <Text style={styles.heroCtaText}>
              {isStoreOwner
                ? tr('+ Bán hàng quầy', '+ ຂາຍໜ້າເຄົາເຕີ້')
                : isWarehouseStaff
                ? tr('Kiểm kê kho ngay', 'ກວດນັບສາງດ່ວນ')
                : tr('+ Bán lẻ ngay', '+ ຂາຍຍ່ອຍດ່ວນ')}
            </Text>
          </Pressable>
        </View>

        {/* ── Chỉ số 4 KPI Cards (Chủ quán vs Kho vs Bán hàng) ── */}
        <View style={styles.kpiGrid}>
          {isStoreOwner ? (
            <>
              {/* 1. Doanh số hôm nay */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>DOANH SỐ HÔM NAY</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#FFECEF' }]}>
                    <Ionicons name="wallet-outline" size={16} color={Colors.primaryContainer} />
                  </View>
                </View>
                <Text style={styles.kpiValueLarge}>
                  {formatMoney(stats.ownerRevenueToday)}
                </Text>
                <View style={styles.kpiFooterTrend}>
                  <Ionicons name="trending-up" size={13} color={Colors.green} />
                  <Text style={styles.kpiTrendGreen}>{stats.ownerGrowth}</Text>
                </View>
              </View>

              {/* 2. Tiền mặt tại két */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>TIỀN MẶT TẠI KÉT</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialIcons name="point-of-sale" size={16} color="#374151" />
                  </View>
                </View>
                <Text style={styles.kpiValueLarge}>
                  {formatMoney(stats.ownerCashInVault)}
                </Text>
                <View style={styles.kpiFooterTrend}>
                  <Ionicons name="shield-checkmark" size={12} color="#D97706" />
                  <Text style={[styles.kpiHintText, { color: '#D97706', fontWeight: '600' }]}>
                    Sẵn sàng giao ca
                  </Text>
                </View>
              </View>

              {/* 3. Đơn toàn shop */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>ĐƠN TOÀN SHOP</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="phone-portrait-outline" size={16} color="#DC2626" />
                  </View>
                </View>
                <Text style={styles.kpiValueLarge}>{stats.ownerOrdersCount} đơn</Text>
                <View style={styles.kpiFooterTrend}>
                  <Text style={styles.kpiHintText}>100% hoàn tất</Text>
                </View>
              </View>

              {/* 4. Chờ duyệt */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>CHỜ DUYỆT</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="clipboard-outline" size={16} color="#DC2626" />
                  </View>
                </View>
                <Text style={[styles.kpiValueLarge, { color: '#DC2626' }]}>
                  0{stats.ownerPendingCount} phiếu
                </Text>
                <View style={styles.kpiFooterTrend}>
                  <Text style={[styles.kpiHintText, { color: '#DC2626', fontWeight: '600' }]}>
                    Cần xử lý ngay
                  </Text>
                </View>
              </View>
            </>
          ) : isWarehouseStaff ? (
            <>
              {/* Nhân viên kho */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>{tr('TỒN KHO KHẢ DỤNG', 'ສາງທີ່ພ້ອມໃຊ້')}</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: Colors.blueSoft }]}>
                    <Ionicons name="cube-outline" size={16} color={Colors.blueDeep} />
                  </View>
                </View>
                <Text style={styles.kpiValueLarge}>{stats.imeiInStock} {tr('máy', 'ເຄື່ອງ')}</Text>
                <View style={styles.kpiFooterTrend}>
                  <Ionicons name="checkmark-circle" size={13} color={Colors.green} />
                  <Text style={styles.kpiTrendGreen}>{tr('Sẵn sàng tại showroom', 'ພ້ອມຈ່າຍທີ່ໜ້າຮ້ານ')}</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>{tr('ĐÃ XUẤT BÁN', 'ເບີກຈ່າຍແລ້ວ')}</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: Colors.greenSoft }]}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={Colors.green} />
                  </View>
                </View>
                <Text style={styles.kpiValueLarge}>{stats.completedCount} {tr('máy', 'ເຄື່ອງ')}</Text>
                <View style={styles.kpiFooterTrend}>
                  <Ionicons name="shield-checkmark" size={13} color={Colors.green} />
                  <Text style={styles.kpiHintText}>{tr('Đã kích hoạt IMEI', 'ເປີດໃຊ້ IMEI ແລ້ວ')}</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>{tr('TIẾP NHẬN BẢO HÀNH', 'ຮັບປະກັນສ້ອມແປງ')}</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: Colors.amber100 }]}>
                    <Ionicons name="build-outline" size={16} color={Colors.amber800} />
                  </View>
                </View>
                <Text style={styles.kpiValueLarge}>{stats.servicesPending} {tr('máy', 'ເຄື່ອງ')}</Text>
                <View style={styles.kpiFooterTrend}>
                  <Ionicons name="alert-circle-outline" size={13} color={Colors.amber700} />
                  <Text style={[styles.kpiHintText, { color: Colors.amber800 }]}>
                    {tr('Chờ kỹ thuật xử lý', 'ລໍຖ້າຊ່າງກວດສອບ')}
                  </Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>{tr('TỶ LỆ KHỚP KHO', 'ອັດຕາກົງກັນສາງ')}</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="qr-code-outline" size={16} color="#374151" />
                  </View>
                </View>
                <Text style={styles.kpiValueLarge}>100%</Text>
                <View style={styles.kpiFooterTrend}>
                  <Ionicons name="shield-checkmark" size={12} color="#16A34A" />
                  <Text style={[styles.kpiHintText, { color: '#16A34A', fontWeight: '600' }]}>
                    {tr('142/142 Barcode khớp', '142/142 ບາໂຄ້ດກົງກັນ')}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Nhân viên bán hàng */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>Doanh thu hôm nay</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#FFECEF' }]}>
                    <Ionicons name="wallet-outline" size={16} color={Colors.primaryContainer} />
                  </View>
                </View>
                <Text style={styles.kpiValueLarge}>{formatMoney(stats.revenueToday)}</Text>
                <View style={styles.kpiFooterTrend}>
                  <Ionicons name="trending-up" size={13} color={Colors.green} />
                  <Text style={styles.kpiTrendGreen}>{stats.growthPercent} so với hôm qua</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>Đơn thành công</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: Colors.greenSoft }]}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={Colors.green} />
                  </View>
                </View>
                <Text style={styles.kpiValueLarge}>{stats.completedCount} đơn</Text>
                <View style={styles.kpiFooterTrend}>
                  <Ionicons name="time-outline" size={13} color={Colors.onSurfaceVariant} />
                  <Text style={styles.kpiHintText}>100% đúng hạn ca trực</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>Tồn kho khả dụng</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: Colors.blueSoft }]}>
                    <Ionicons name="phone-portrait-outline" size={16} color={Colors.blueDeep} />
                  </View>
                </View>
                <Text style={styles.kpiValueLarge}>{stats.imeiInStock} máy</Text>
                <View style={styles.kpiFooterTrend}>
                  <Ionicons name="cube-outline" size={13} color={Colors.onSurfaceVariant} />
                  <Text style={styles.kpiHintText}>Sẵn sàng tại showroom</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>Tiếp nhận dịch vụ</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: Colors.amber100 }]}>
                    <Ionicons name="build-outline" size={16} color={Colors.amber800} />
                  </View>
                </View>
                <Text style={styles.kpiValueLarge}>{stats.servicesPending} máy</Text>
                <View style={styles.kpiFooterTrend}>
                  <Ionicons name="alert-circle-outline" size={13} color={Colors.amber700} />
                  <Text style={[styles.kpiHintText, { color: Colors.amber800 }]}>
                    Chờ kỹ thuật xử lý
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── Khối Đặc Quyền: Yêu cầu cần Chủ quán duyệt (Chỉ hiển thị cho Chủ quán) ── */}
        {isStoreOwner && (
          <View style={styles.ownerApprovalSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWithDot}>
                <View style={styles.ownerAmberDot} />
                <Text style={styles.sectionTitle}>Yêu cầu cần Chủ quán duyệt</Text>
              </View>
              <View style={styles.pendingBadgePill}>
                <Text style={styles.pendingBadgePillText}>{pendingApprovals.length} chờ</Text>
              </View>
            </View>

            {pendingApprovals.length === 0 ? (
              <View style={[styles.approvalCard, { alignItems: 'center', paddingVertical: 24 }]}>
                <Ionicons name="checkmark-done-circle" size={42} color="#16A34A" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#16A34A', marginTop: 8 }}>
                  Tất cả yêu cầu đã được duyệt!
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 3, textAlign: 'center' }}>
                  Không còn phiếu chiết khấu hay Trade-in nào đang chờ xử lý.
                </Text>
              </View>
            ) : (
              pendingApprovals.map((item) => {
                const isDiscount = item.type === 'discount'
                return (
                  <View key={item.id} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <View style={styles.approvalTagRow}>
                        <View style={isDiscount ? styles.approvalBadgePink : styles.approvalBadgeGray}>
                          <Text style={isDiscount ? styles.approvalBadgePinkText : styles.approvalBadgeGrayText}>
                            {item.badge}
                          </Text>
                        </View>
                        <Text style={styles.approvalTimeText}>{item.time}</Text>
                      </View>
                      <View style={styles.approvalAmountBox}>
                        <Text style={isDiscount ? styles.approvalAmountNegative : styles.approvalAmountDark}>
                          {item.amountText}
                        </Text>
                        <Text style={styles.approvalAmountSub}>{item.amountSub}</Text>
                      </View>
                    </View>
                    <Text style={styles.approvalDeviceText}>{item.device}</Text>
                    <Text style={styles.approvalStaffText}>{item.staffText}</Text>

                    {isDiscount ? (
                      <View style={styles.approvalActionRow}>
                        <Pressable
                          onPress={() => handleRejectDiscount(item.id)}
                          style={styles.approvalRejectBtn}
                        >
                          <Text style={styles.approvalRejectBtnText}>Từ chối</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleApproveDiscount(item.id)}
                          style={styles.approvalAcceptBtn}
                        >
                          <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                          <Text style={styles.approvalAcceptBtnText}>Duyệt ngay</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => handleApproveTradein(item.id)}
                        style={styles.approvalFullBtn}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primaryContainer} />
                        <Text style={styles.approvalFullBtnText}>Duyệt giá bù {item.amountText}</Text>
                      </Pressable>
                    )}
                  </View>
                )
              })
            )}
          </View>
        )}

        {/* ── Thao tác nhanh (Chủ quán vs Kho vs Bán hàng) ── */}
        <View style={styles.quickActionRow}>
          {isStoreOwner ? (
            <>
              {/* Chủ quán: Bán hàng POS */}
              <Pressable
                onPress={() => router.push('/(app)/(tabs)/pos')}
                style={styles.quickActionBtn}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#FFD9DD' }]}>
                  <MaterialIcons name="point-of-sale" size={22} color={Colors.primaryContainer} />
                </View>
                <Text style={styles.actionBtnLabel}>Bán hàng POS</Text>
              </Pressable>

              {/* Chủ quán: Sổ quỹ két */}
              <Pressable
                onPress={() => router.push('/(app)/(tabs)/account')}
                style={styles.quickActionBtn}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#F2F4F6' }]}>
                  <Ionicons name="wallet-outline" size={20} color="#374151" />
                </View>
                <Text style={styles.actionBtnLabel}>Sổ quỹ két</Text>
              </Pressable>

              {/* Chủ quán: Tra IMEI */}
              <Pressable
                onPress={() => router.push('/(app)/(tabs)/services')}
                style={styles.quickActionBtn}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#F2F4F6' }]}>
                  <Ionicons name="qr-code-outline" size={20} color="#374151" />
                </View>
                <Text style={styles.actionBtnLabel}>Tra IMEI</Text>
              </Pressable>

              {/* Chủ quán: Kiểm kê kho */}
              <Pressable
                onPress={() =>
                  Alert.alert(
                    'Kiểm kê kho',
                    `Hệ thống kho đang đồng bộ ${stats.imeiInStock} thiết bị tại Showroom.`,
                  )
                }
                style={styles.quickActionBtn}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#F2F4F6' }]}>
                  <Ionicons name="cube-outline" size={20} color="#374151" />
                </View>
                <Text style={styles.actionBtnLabel}>Kiểm kê kho</Text>
              </Pressable>
            </>
          ) : isWarehouseStaff ? (
            <>
              {/* Nhân viên kho */}
              <Pressable
                onPress={() =>
                  Alert.alert(
                    tr('Kiểm kê kho', 'ກວດນັບສາງ'),
                    tr(
                      `Tổng tồn kho hiện tại: ${stats.imeiInStock} thiết bị sẵn sàng tại showroom.`,
                      `ຍອດສິນຄ້າໃນສາງປັດຈຸບັນ: ${stats.imeiInStock} ເຄື່ອງພ້ອມຈ່າຍທີ່ໜ້າຮ້ານ.`,
                    ),
                  )
                }
                style={styles.quickActionBtn}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="cube-outline" size={22} color="#B45309" />
                </View>
                <Text style={styles.actionBtnLabel}>{tr('Kiểm kê kho', 'ກວດນັບສາງ')}</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(app)/(tabs)/services')}
                style={styles.quickActionBtn}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#0284C7' }]}>
                  <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionBtnLabel}>{tr('Tra IMEI', 'ກວດ IMEI')}</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(app)/(tabs)/services')}
                style={styles.quickActionBtn}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#7C3AED' }]}>
                  <Ionicons name="speedometer-outline" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionBtnLabel}>{tr('Thẩm định máy', 'ປະເມີນສະພາບເຄື່ອງ')}</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(app)/(tabs)/services')}
                style={styles.quickActionBtn}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#047857' }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionBtnLabel}>{tr('Tiếp nhận BH', 'ຮັບປະກັນ')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* Nhân viên bán hàng */}
              <Pressable
                onPress={() => router.push('/(app)/(tabs)/pos')}
                style={styles.quickActionBtn}
              >
                <View style={[styles.actionCircle, { backgroundColor: Colors.primaryContainer }]}>
                  <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.actionBtnLabel}>Bán lẻ POS</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(app)/(tabs)/services')}
                style={styles.quickActionBtn}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#0284C7' }]}>
                  <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionBtnLabel}>Tra IMEI</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(app)/(tabs)/services')}
                style={styles.quickActionBtn}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#B45309' }]}>
                  <Ionicons name="repeat-outline" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.actionBtnLabel}>Thu cũ đổi mới</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(app)/(tabs)/services')}
                style={styles.quickActionBtn}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#047857' }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionBtnLabel}>Tiếp nhận BH</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* ── Đơn hàng gần đây toàn shop ── */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithDot}>
            <Text style={styles.sectionTitle}>
              {isStoreOwner
                ? tr('Đơn hàng gần đây toàn shop', 'ລາຍການໃບບິນຫຼ້າສຸດທົ່ວຮ້ານ')
                : tr('Đơn hàng gần đây trong ca', 'ລາຍການໃບບິນຫຼ້າສຸດໃນກະ')}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/orders')}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>
              {isStoreOwner
                ? `${tr('Xem tất cả', 'ເບິ່ງທັງໝົດ')} (${stats.ownerOrdersCount})`
                : tr('Xem tất cả', 'ເບິ່ງທັງໝົດ')}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={Colors.primaryContainer} />
          </Pressable>
        </View>

        <View style={styles.ordersList}>
          {storeRecentOrders.slice(0, 5).map((order) => {
            const isCompleted = order.status === 'completed'
            const isTradein = order.status === 'tradein'
            const isPending = order.status === 'pending' || order.status === 'pending_discount'

            let iconName: any = 'phone-portrait-outline'
            let iconColor: string = Colors.primaryContainer
            if (isTradein) {
              iconName = 'repeat-outline'
              iconColor = '#DC2626'
            } else if (order.itemsSummary?.toLowerCase().includes('airpods')) {
              iconName = 'headset-outline'
              iconColor = '#D97706'
            }

            return (
              <Pressable
                key={order.id}
                onPress={() => router.push('/(app)/(tabs)/orders')}
                style={({ pressed }) => [styles.orderItemCardExact, pressed && { opacity: 0.88 }]}
              >
                <View style={styles.orderDeviceIconBox}>
                  <Ionicons name={iconName} size={22} color={iconColor} />
                </View>

                <View style={styles.orderItemMiddle}>
                  <Text style={styles.orderItemCodeText}>{order.code}</Text>
                  <Text style={styles.orderItemDeviceText} numberOfLines={1}>
                    {order.itemsSummary}
                  </Text>
                  <Text style={styles.orderItemCustomerText} numberOfLines={1}>
                    {order.customerName === 'Khách vãng lai'
                      ? tr('Khách vãng lai', 'ລູກຄ້າທົ່ວໄປ')
                      : order.customerName}
                  </Text>
                </View>

                <View style={styles.orderItemRight}>
                  <Text
                    style={[
                      styles.orderItemPriceText,
                      isTradein && { color: '#16A34A' },
                    ]}
                  >
                    {isTradein ? `+${formatMoney(order.total)}` : formatMoney(order.total)}
                  </Text>
                  <View
                    style={[
                      styles.orderItemStatusPill,
                      isCompleted
                        ? styles.pillCompleted
                        : isTradein
                        ? styles.pillTradein
                        : styles.pillPending,
                    ]}
                  >
                    {isCompleted ? (
                      <>
                        <Ionicons name="checkmark" size={11} color="#059669" />
                        <Text style={styles.pillTextCompleted}>{tr('Hoàn tất', 'ສຳເລັດ')}</Text>
                      </>
                    ) : isTradein ? (
                      <Text style={styles.pillTextTradein}>{tr('Thu máy cũ', 'ຮັບຊື້ເຄື່ອງເກົ່າ')}</Text>
                    ) : (
                      <>
                        <Ionicons name="time-outline" size={11} color="#D97706" />
                        <Text style={styles.pillTextPending}>{tr('Chờ xử lý', 'ລໍຖ້າດຳເນີນການ')}</Text>
                      </>
                    )}
                  </View>
                </View>
              </Pressable>
            )
          })}
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 16,
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
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191C1E',
  },
  posBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  posBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
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
  brandSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#58413F',
    fontWeight: '500',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Greeting Row ──
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingLeft: {
    gap: 3,
  },
  greetingText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191C1E',
  },
  storeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storeBadgeText: {
    fontSize: 12,
    color: '#58413F',
  },
  shiftActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pulseLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  shiftActiveText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
  },

  // ── Hero Banner ──
  heroCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.xl,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowCorner: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  flagshipPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginBottom: 8,
  },
  flagshipPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFD9DD',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.82)',
    lineHeight: 17,
    marginBottom: 14,
  },
  heroCtaBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },

  // ── 4 KPI Cards ──
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 4,
  },
  kpiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8C716E',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  kpiIconWrap: {
    width: 26,
    height: 26,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValueLarge: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#191C1E',
    marginTop: 2,
  },
  kpiFooterTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  kpiTrendGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  kpiHintText: {
    fontSize: 10.5,
    color: '#8C716E',
  },

  // ── Owner Approval Section ──
  ownerApprovalSection: {
    gap: 10,
  },
  ownerAmberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  pendingBadgePill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  pendingBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  approvalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 8,
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  approvalTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approvalBadgePink: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  approvalBadgePinkText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  approvalBadgeGray: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  approvalBadgeGrayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#374151',
  },
  approvalTimeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  approvalAmountBox: {
    alignItems: 'flex-end',
  },
  approvalAmountNegative: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  approvalAmountDark: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191C1E',
  },
  approvalAmountSub: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  approvalDeviceText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  approvalStaffText: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  approvalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  approvalRejectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalRejectBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  approvalAcceptBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
  },
  approvalAcceptBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  approvalFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primaryContainer,
    backgroundColor: '#FFF5F6',
    marginTop: 4,
  },
  approvalFullBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  approvalStatusSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: Radius.md,
  },
  approvalStatusSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  approvalStatusRejected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: Radius.md,
  },
  approvalStatusRejectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },

  // ── Quick Actions ──
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  quickActionBtn: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#191C1E',
  },

  // ── Section Headers ──
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#191C1E',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },

  // ── Orders List ──
  ordersList: {
    gap: 9,
  },
  orderItemCardExact: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDeviceIconBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderItemMiddle: {
    flex: 1,
    paddingHorizontal: 10,
    gap: 2,
  },
  orderItemCodeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#8C716E',
    letterSpacing: 0.2,
  },
  orderItemDeviceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  orderItemCustomerText: {
    fontSize: 11,
    color: '#58413F',
  },
  orderItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderItemPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryContainer,
  },
  orderItemStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  pillCompleted: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pillTradein: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  pillPending: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pillTextCompleted: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
  },
  pillTextTradein: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#7C3AED',
  },
  pillTextPending: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#D97706',
  },
})
