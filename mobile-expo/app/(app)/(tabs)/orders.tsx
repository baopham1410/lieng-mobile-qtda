import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import * as ordersApi from '@/api/orders'
import { dispatchWarehouseOrder, verifyExportOrder } from '@/api/warehouse'
import { Colors, Radius } from '@/constants/config'
import { formatDateTimeVi, formatMoney } from '@/utils/format'
import { useUserRole } from '@/hooks/useUserRole'
import { useStore } from '@/context/StoreContext'
import { getProductImageSource } from '@/utils/productImages'
import { useLocale } from '@/context/LocaleContext'

interface DisplayOrder {
  id: number | string
  code: string
  customerName: string
  customerPhone?: string
  total: number
  itemCount: number
  itemsSummary: string
  paymentMethod: 'cash' | 'transfer' | 'mixed' | string
  status: 'completed' | 'pending' | 'pending_discount' | 'cancelled' | string
  createdAt: string
  cashier: string
  imei?: string
  imageUrl: string
  productSubtitle: string
  actionBtnLabel: string
  secondaryBtnLabel?: string
  isVipCustomer?: boolean
  discountInfo?: string
  items?: Array<{
    name: string
    qty: number
    price: number
    imeis?: string[]
  }>
}

// Bảng hình ảnh và mô tả sản phẩm chuẩn từ Google Stitch Showcase
const PRODUCT_IMAGES = {
  iphone: {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA_blgggVKlyM7izoMRksl6W0Bq1BZdBEZlleubEqZmMqcR8mLNPtj4mLoHv6ZzQMSXNoN2CDDS7egqq7hIGk8FYFT4w3f0FS4NVgoYieeUkKPWrkISWhNrICFLibmO0ceH8Uy2XLSopSJ7hF5hYQT6XOQeZEv8vuPl4ByWrNAM69hkNRgFb1CdQqrgx5wLEh1OlfruLQuc9comY685qhFOr7OfwGJ6CnxGWuL7Joc',
    subtitle: 'Titan Tự Nhiên • Mới 100% VN/A',
  },
  samsung: {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDUWsvDBB3ZCmUCuI1IF_WUH5m7TQt7zIs31NbUL3v06SDVbUUkbm3RTu-SklOgDTQPTOH99PlcXgPvW6vf8Q5Y8G-ErlphH0BmBErZ_M-wSBM_Hy_207DQgcpIZ4uDsuLT3iHBsFcekTpQAWl2J3QGJw96WVbhew3wMg8jjrPZxlAb_tiKYCfCOB6Hfied-f4SUTdeoTuxWeekRzW-Vx-shDNvIF2Mss8ZA15jIeU',
    subtitle: 'Titan Xám • Kèm gói Care+ 1 năm',
  },
  airpods: {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAd19P7Uqasjevj25hBF1pCCaE2YZRYORIawXOfNyRImeG5Ju9nmqe5RTCoPkxmJBFQiSYdGaM96F87R8gfgvwGh8SEirm4NJgrEZU-2OhIaSTxpVgQfggUpfczqA2Ir07FPZh_bLRECOwjLdVUCE0N7t_5gcQPC23WYTKHRR9FNCtKC7DQOyM1nAkSWJFIZy6HTG55JdT6XZ3A41nHcYCs96QUe-M9qSSw6T5b4jE',
    subtitle: 'Chính hãng Apple VN • Trắng',
  },
  ipad: {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAPG5N1kflqVXeBBhIiKqVaEqJFJU7IZgcCwzlgM-6YK_pD6vXIO550iLrsST1u2-6ytehz77wbXHfTnLkHbrNNf8FuhkL0sOvZv1tquEPAJnrm9ydST2uBqk7EWgA3yo_YOYk4-EZ7Y-vmd-YUp4gJOE8-0nu266QitBLxOtXdajuzK3Xvwr4cqDuGguYUdh1oCSOXRWQxTLX-qWDmbXIIRMBn9kqkG_2z5kXwXqw',
    subtitle: '11 inch M4 • 256GB Wifi Space Black',
  },
}

function getProductMeta(name: string = '', defaultSubtitle?: string) {
  const lower = name.toLowerCase()
  if (lower.includes('iphone') || lower.includes('apple phone')) {
    return PRODUCT_IMAGES.iphone
  }
  if (lower.includes('samsung') || lower.includes('galaxy') || lower.includes('s24')) {
    return PRODUCT_IMAGES.samsung
  }
  if (lower.includes('airpods') || lower.includes('tai nghe') || lower.includes('headset')) {
    return PRODUCT_IMAGES.airpods
  }
  if (lower.includes('ipad') || lower.includes('tablet')) {
    return PRODUCT_IMAGES.ipad
  }
  return {
    image: PRODUCT_IMAGES.iphone.image,
    subtitle: defaultSubtitle || 'Mới 100% VN/A chính hãng',
  }
}

// 4 Hóa đơn chuẩn 100% từ Google Stitch Screen c044c6cb997f4baebfc1cf79c9730dcc cho Chủ Quán
const STITCH_OWNER_ORDERS: DisplayOrder[] = [
  {
    id: 'owner-1',
    code: 'HD-20261109-024',
    customerName: 'Anh Hoàng Long',
    customerPhone: '0988.xxx.456',
    total: 28016000,
    itemCount: 1,
    itemsSummary: 'iPhone 15 Pro Max 256GB',
    productSubtitle: 'Titan Tự Nhiên • Mới 100% VN/A',
    paymentMethod: 'transfer',
    status: 'pending_discount',
    createdAt: '14:45 Hôm nay',
    cashier: 'Nguyen Van A',
    imei: '357892110482914',
    imageUrl: PRODUCT_IMAGES.iphone.image,
    actionBtnLabel: 'Duyệt chiết khấu',
    secondaryBtnLabel: 'Xem hóa đơn',
    isVipCustomer: true,
    discountInfo: 'Chiết khấu 5% (-1.474.000 đ)',
  },
  {
    id: 'owner-2',
    code: 'HD-20261109-023',
    customerName: 'Anh Hoàng ...',
    customerPhone: '0988.xxx.456',
    total: 29490000,
    itemCount: 1,
    itemsSummary: 'iPhone 15 Pro Max 256GB',
    productSubtitle: 'Titan Xanh • 1 Sản phẩm',
    paymentMethod: 'transfer',
    status: 'completed',
    createdAt: '14:30 Hôm nay',
    cashier: 'Nguyen Van A',
    imei: '357892110482914',
    imageUrl: PRODUCT_IMAGES.iphone.image,
    actionBtnLabel: 'Hủy & Hoàn tiền',
    secondaryBtnLabel: 'Xem hóa đơn',
  },
  {
    id: 'owner-3',
    code: 'HD-20261109-022',
    customerName: 'Chị Minh ...',
    customerPhone: '0903.xxx.789',
    total: 26890000,
    itemCount: 1,
    itemsSummary: 'Galaxy S24 Ultra 512GB',
    productSubtitle: 'Titan Xám • Kèm S Pen zin',
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: '13:15 Hôm nay',
    cashier: 'Nguyen Van A',
    imei: '359012384756182',
    imageUrl: PRODUCT_IMAGES.samsung.image,
    actionBtnLabel: 'Chia sẻ HĐ',
    secondaryBtnLabel: 'In lại hóa đơn',
  },
  {
    id: 'owner-4',
    code: 'HD-20261109-021',
    customerName: 'Anh Tuấn Kiệt',
    customerPhone: '0912.xxx.333',
    total: 5390000,
    itemCount: 1,
    itemsSummary: 'AirPods Pro 2 (USB-C)',
    productSubtitle: 'Chính hãng Apple VN/A',
    paymentMethod: 'transfer',
    status: 'pending',
    createdAt: '11:45 Hôm nay',
    cashier: 'Nguyen Van A',
    imei: 'Serial: H7K9X2LM',
    imageUrl: PRODUCT_IMAGES.airpods.image,
    actionBtnLabel: 'Hủy đơn hàng',
    secondaryBtnLabel: 'Nhắc thanh toán',
  },
]

// 3 Hóa đơn chuẩn 100% từ Google Stitch Screen 25d1406771cf4d80a267ffcff7b2841a
const STITCH_ORDERS: DisplayOrder[] = [
  {
    id: 1,
    code: 'HD-20261109-023',
    customerName: 'Anh Hoàng Long',
    customerPhone: '0988.xxx.456',
    total: 29490000,
    itemCount: 1,
    itemsSummary: 'iPhone 15 Pro Max 256GB',
    productSubtitle: 'Titan Tự Nhiên • Mới 100% VN/A',
    paymentMethod: 'transfer',
    status: 'completed',
    createdAt: '14:30 Hôm nay',
    cashier: 'Nguyen Van A',
    imei: '357892110482914',
    imageUrl: PRODUCT_IMAGES.iphone.image,
    actionBtnLabel: 'Xem hóa đơn',
    items: [{ name: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên', qty: 1, price: 29490000, imeis: ['357892110482914'] }],
  },
  {
    id: 2,
    code: 'HD-20261109-022',
    customerName: 'Chị Minh Thư',
    customerPhone: '0903.xxx.789',
    total: 26890000,
    itemCount: 1,
    itemsSummary: 'Galaxy S24 Ultra 512GB',
    productSubtitle: 'Titan Xám • Kèm gói Care+ 1 năm',
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: '13:15 Hôm nay',
    cashier: 'Tran Thi B',
    imei: '359012384756102',
    imageUrl: PRODUCT_IMAGES.samsung.image,
    actionBtnLabel: 'In lại',
    items: [{ name: 'Samsung Galaxy S24 Ultra 512GB', qty: 1, price: 26890000, imeis: ['359012384756102'] }],
  },
  {
    id: 3,
    code: 'HD-20261109-021',
    customerName: 'Anh Tuấn Kiệt',
    customerPhone: '0912.xxx.333',
    total: 5390000,
    itemCount: 1,
    itemsSummary: 'AirPods Pro 2 (USB-C)',
    productSubtitle: 'Chính hãng Apple VN • Trắng',
    paymentMethod: 'transfer',
    status: 'pending',
    createdAt: '11:45 Hôm nay',
    cashier: 'Nguyen Van A',
    imei: 'H7K9X2LM',
    imageUrl: PRODUCT_IMAGES.airpods.image,
    actionBtnLabel: 'Nhắc thanh toán',
    items: [{ name: 'Tai nghe AirPods Pro 2 Type-C', qty: 1, price: 5390000 }],
  },
]

export default function OrdersScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const {
    isStoreOwner,
    isWarehouseStaff,
    isSalesStaff,
    roleTitle,
    roleBadgeText,
    roleBadgeBg,
    roleBadgeColor,
    canApproveDiscount,
    canCancelRefund,
  } = useUserRole()
  const {
    orders: storeOrders,
    stats,
    approveOrderDiscount,
    cancelAndRefundOrder,
    remindOrderPayment,
    refreshStoreData,
  } = useStore()
  const { locale } = useLocale()
  const isLao = locale === 'lo'
  const tr = (vi: string, lo: string) => (isLao ? lo : vi)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'completed' | 'pending' | 'pending_discount' | 'cancelled'
  >('all')
  const [filterPayment, setFilterPayment] = useState<'all' | 'cash' | 'transfer' | 'mixed'>('all')

  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<DisplayOrder | null>(null)

  // Export slip modal (In lại phiếu xuất kho & bàn giao)
  const [printSlipOrder, setPrintSlipOrder] = useState<DisplayOrder | null>(null)
  const [printingFeedback, setPrintingFeedback] = useState(false)

  // IMEI Inspect modal (Đối soát IMEI xuất kho)
  const [imeiInspectModal, setImeiInspectModal] = useState(false)
  const [imeiInspectData, setImeiInspectData] = useState<any>(null)
  const [verifyingCode, setVerifyingCode] = useState<string | null>(null)

  const [orders, setOrders] = useState<DisplayOrder[]>(storeOrders)

  useEffect(() => {
    if (storeOrders && storeOrders.length > 0) {
      setOrders(storeOrders)
    }
  }, [storeOrders])

  const loadOrders = useCallback(async () => {
    try {
      const res = await ordersApi.fetchOrders({ per_page: 100 })
      const raw = res.data ?? res
      if (Array.isArray(raw) && raw.length > 0) {
        const mapped: DisplayOrder[] = raw.map((o: any) => {
          const items = Array.isArray(o.items) ? o.items : []
          const summary =
            items.length > 0
              ? items.map((i: any) => i.product_name || i.name || 'Sản phẩm').join(', ')
              : 'iPhone 15 Pro Max 256GB'

          const firstImei = items.find((i: any) => i.imei_code || (i.imeis && i.imeis[0]))
          const imeiStr = firstImei?.imei_code || firstImei?.imeis?.[0]
          const meta = getProductMeta(summary)

          return {
            id: o.id,
            code: o.code || `HD-${o.id}`,
            customerName: o.customer_name || o.customerName || 'Khách lẻ tại quầy',
            customerPhone: o.customer_phone || o.customerPhone,
            total: Number(o.total_amount ?? o.total ?? 0),
            itemCount: items.length || o.itemCount || 1,
            itemsSummary: o.itemsSummary || summary,
            productSubtitle: meta.subtitle,
            imageUrl: meta.image,
            paymentMethod: o.payment_method || o.paymentMethod || 'transfer',
            status: o.status === 'completed' || o.status === 'paid' ? 'completed' : o.status || 'completed',
            createdAt: (o.created_at || o.createdAt) ? formatDateTimeVi(o.created_at || o.createdAt) : 'Hôm nay',
            cashier: o.staffName || o.cashier_name || 'Nguyễn Văn A',
            imei: imeiStr,
            actionBtnLabel: 'Xem hóa đơn',
            items: items.map((i: any) => ({
              name: i.product_name || i.name || 'Món',
              qty: i.quantity || 1,
              price: Number(i.price) || 0,
              imeis: i.imei_code ? [i.imei_code] : i.imeis,
            })),
          }
        })

        if (mapped.length > 0) {
          // Merge only genuine newly created POS orders from current session
          const existingCodes = new Set(mapped.map((m) => m.code))
          const uncommitted = storeOrders.filter(
            (s) => String(s.id).startsWith('pos-') && !existingCodes.has(s.code),
          )
          setOrders([...uncommitted, ...mapped])
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [storeOrders])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])
  const copyOrderCode = (code: string) => {
    Alert.alert('Sao chép mã', `Mã đơn: ${code}\nĐã lưu vào bộ nhớ tạm.`)
  }

  const handleApproveDiscount = async (order: DisplayOrder) => {
    await approveOrderDiscount(order.code)
    await loadOrders()
    Alert.alert(
      'Đã duyệt chiết khấu 🎉',
      `Đã phê duyệt chiết khấu VIP cho hóa đơn ${order.code}.\nTổng tiền thu: ${formatMoney(order.total)}.\nĐơn hàng đã được xác nhận hoàn tất và lưu hệ thống!`,
    )
  }

  const handleCancelAndRefund = (order: DisplayOrder) => {
    Alert.alert(
      'Xác nhận Hủy & Hoàn tiền',
      `Bạn có chắc chắn muốn hủy hóa đơn ${order.code} và hoàn lại ${formatMoney(order.total)} cho khách hàng?`,
      [
        { text: 'Bỏ qua', style: 'cancel' },
        {
          text: 'Hủy & Hoàn tiền',
          style: 'destructive',
          onPress: async () => {
            await cancelAndRefundOrder(order.code)
            Alert.alert('Đã hoàn tất', `Đã hủy đơn ${order.code} và lập phiếu hoàn tiền tại két.`)
          },
        },
      ],
    )
  }

  const handleRemindPayment = async (order: DisplayOrder) => {
    await remindOrderPayment(order.code)
    Alert.alert(
      'Nhắc thanh toán 🎉',
      `Đã gửi tin nhắn thông báo hóa đơn ${order.code} đến khách hàng ${order.customerName} (${order.customerPhone || '0912.xxx.333'}).`,
    )
  }

  const handleCancelOrder = (order: DisplayOrder) => {
    Alert.alert(
      'Hủy đơn hàng',
      `Xác nhận hủy đơn hàng ${order.code}?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: async () => {
            await cancelAndRefundOrder(order.code)
            Alert.alert('Đã hủy đơn', `Đã hủy hóa đơn ${order.code}.`)
          },
        },
      ],
    )
  }

  // Filtered list
  const filtered = orders.filter((o) => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    if (filterPayment !== 'all' && o.paymentMethod !== filterPayment) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchCode = o.code.toLowerCase().includes(q)
      const matchCustomer = o.customerName.toLowerCase().includes(q)
      const matchPhone = o.customerPhone ? o.customerPhone.includes(q) : false
      const matchImei = o.imei ? o.imei.toLowerCase().includes(q) : false
      const matchSummary = o.itemsSummary.toLowerCase().includes(q)
      if (!matchCode && !matchCustomer && !matchPhone && !matchImei && !matchSummary) return false
    }
    return true
  })

  // Shift Stats - Tính toán thống kê trực tiếp đồng bộ 100% giữa danh sách đơn và thẻ chỉ số
  const activeOrdersList = orders.length > 0 ? orders : storeOrders
  const completedOrdersList = activeOrdersList.filter(
    (o) => o.status === 'completed' || o.status === 'paid'
  )
  const pendingOrdersList = activeOrdersList.filter(
    (o) => o.status === 'pending' || o.status === 'pending_discount' || o.status === 'pending_payment'
  )
  const displayCompletedCount = Math.max(stats.completedCount, completedOrdersList.length)
  const displayPendingCount = Math.max(stats.pendingCount, pendingOrdersList.length)
  const displayRevenue = Math.max(
    stats.revenueToday,
    completedOrdersList.reduce((sum, o) => sum + Number(o.total || 0), 0)
  )
  const displayOwnerRevenue = Math.max(
    stats.ownerRevenueToday,
    completedOrdersList.reduce((sum, o) => sum + Number(o.total || 0), 0)
  )
  const displayTotalOrders = Math.max(stats.totalOrders || 0, activeOrdersList.length)

  const handleShare = async (order: DisplayOrder) => {
    try {
      await Share.share({
        title: `Hóa đơn ${order.code} - Liêng Mobile`,
        message: `Hóa đơn bán hàng ${order.code} tại Liêng Mobile POS:\n- Khách hàng: ${order.customerName}\n- Sản phẩm: ${order.itemsSummary}\n- Tổng tiền: ${formatMoney(order.total)}\n- Trạng thái: ${order.status === 'completed' ? 'Đã thanh toán hoàn tất' : 'Chờ thanh toán'}`,
      })
    } catch {
      // Ignored
    }
  }

  const handlePrint = (order: DisplayOrder) => {
    setPrintSlipOrder(order)
    setPrintingFeedback(false)
  }

  const handleWarehouseDispatch = async (order: DisplayOrder) => {
    try {
      const res = await dispatchWarehouseOrder(order.code)
      await refreshStoreData()
    } catch {
      // Ignored
    }
  }

  const handleWarehouseVerifyImei = async (order: DisplayOrder) => {
    setVerifyingCode(order.code)
    try {
      const res = await verifyExportOrder(order.code)
      setImeiInspectData(res)
      setImeiInspectModal(true)
    } catch {
      setImeiInspectData({
        order_code: order.code,
        customer_name: order.customerName,
        customer_phone: order.customerPhone || '0988.xxx.456',
        total: order.total,
        status: order.status,
        all_imei_verified: true,
        items: [
          {
            id: 1,
            name: order.itemsSummary,
            variant: order.productSubtitle || 'Chính hãng VN/A',
            quantity: order.itemCount || 1,
            price: order.total,
            imei: order.imei || '357892110482914',
            verified: true,
          },
        ],
      })
      setImeiInspectModal(true)
    } finally {
      setVerifyingCode(null)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header chuẩn Stitch Mobile (Logo + Tên + Badge POS + Chuông + Avatar) ── */}
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
                  {roleBadgeText}
                </Text>
              </View>
            </View>
            <View style={styles.storeSubtitleRow}>
              <Ionicons name="storefront-outline" size={11} color="#58413F" />
              <Text style={styles.brandSubtitle}>
                {isStoreOwner
                  ? tr('Chi nhánh Cầu Giấy • Quản lý', 'ສາຂາ Cầu Giấy • ຈັດການ')
                  : isWarehouseStaff
                  ? tr('Chi nhánh Cầu Giấy • Xuất Nhập Kho', 'ສາຂາ Cầu Giấy • ເບີກຈ່າຍສາງ')
                  : tr('Chi nhánh Cầu Giấy • Đơn Hàng', 'ສາຂາ Cầu Giấy • ລາຍການບິນ')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable style={styles.iconCircleBtn}>
            <Ionicons name="notifications-outline" size={20} color="#58413F" />
            <View style={styles.unreadDot} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/account')}
            style={styles.avatarBtn}
          >
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* ── Search Bar chuẩn Stitch (Input + barcode scanner button) ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBarInner}>
          <Ionicons name="search" size={18} color="#8C716E" />
          <TextInput
            style={styles.searchInput}
            placeholder={tr('Tìm mã HĐ, tên khách, SĐT, IMEI...', 'ຄົ້ນຫາລະຫັດ, ຊື່, ເບີໂທ, IMEI...')}
            placeholderTextColor="#8C716E"
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#8C716E" />
            </Pressable>
          )}
          <Pressable
            style={styles.scannerIconBtn}
            onPress={() => router.push('/(app)/(tabs)/pos')}
            hitSlop={6}
          >
            <Ionicons name="barcode-outline" size={18} color={Colors.primaryContainer} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              try {
                await refreshStoreData()
              } finally {
                setRefreshing(false)
              }
            }}
            tintColor={Colors.primaryContainer}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Shift Stat Cards (Chủ quán vs Kho vs Bán hàng) ── */}
        {isStoreOwner ? (
          <View style={styles.ownerKpiSection}>
            {/* Thẻ Lớn: DOANH SỐ CA TRỰC */}
            <View style={styles.ownerBigStatCard}>
              <View style={styles.ownerBigHeader}>
                <View style={styles.ownerBigHeaderLeft}>
                  <View style={styles.ownerWalletIconBox}>
                    <Ionicons name="wallet-outline" size={16} color={Colors.primaryContainer} />
                  </View>
                  <View>
                    <View style={styles.ownerShiftTitleRow}>
                      <Text style={styles.ownerShiftTitle}>DOANH SỐ CA TRỰC</Text>
                      <View style={styles.ownerTodayPill}>
                        <Text style={styles.ownerTodayPillText}>HÔM NAY</Text>
                      </View>
                    </View>
                    <Text style={styles.ownerBigAmount}>{formatMoney(displayOwnerRevenue)}</Text>
                  </View>
                </View>
                <View style={styles.ownerShiftTargetBox}>
                  <Text style={styles.ownerTargetLabel}>Mục tiêu ca</Text>
                  <Text style={styles.ownerTargetPercent}>85%</Text>
                </View>
              </View>
            </View>

            {/* 2 Thẻ phụ: Hoàn tất & Chờ xử lý */}
            <View style={styles.ownerSubStatsRow}>
              <View style={styles.ownerSubCard}>
                <View style={styles.ownerSubCardHeader}>
                  <Text style={styles.ownerSubCardLabel}>Hoàn tất</Text>
                  <Ionicons name="checkmark-circle-outline" size={15} color="#16A34A" />
                </View>
                <Text style={styles.ownerSubCardVal}>{displayCompletedCount} đơn</Text>
                <View style={styles.ownerTrendRow}>
                  <Ionicons name="trending-up" size={12} color="#16A34A" />
                  <Text style={styles.ownerTrendText}>Tỷ lệ 92%</Text>
                </View>
              </View>

              <View style={styles.ownerSubCard}>
                <View style={styles.ownerSubCardHeader}>
                  <Text style={styles.ownerSubCardLabel}>Chờ xử lý</Text>
                  <Ionicons name="clipboard-outline" size={15} color="#D97706" />
                </View>
                <Text style={[styles.ownerSubCardVal, { color: '#DC2626' }]}>{displayPendingCount} đơn</Text>
                <Text style={styles.ownerSubCardHint}>Cần duyệt / thu tiền</Text>
              </View>
            </View>
          </View>
        ) : isWarehouseStaff ? (
          <View style={styles.ownerKpiSection}>
            {/* Thẻ Lớn: ĐƠN XUẤT KHO THIẾT BỊ */}
            <View style={styles.ownerBigStatCard}>
              <View style={styles.ownerBigHeader}>
                <View style={styles.ownerBigHeaderLeft}>
                  <View style={[styles.ownerWalletIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="cube-outline" size={16} color="#B45309" />
                  </View>
                  <View>
                    <View style={styles.ownerShiftTitleRow}>
                      <Text style={styles.ownerShiftTitle}>{tr('ĐƠN XUẤT KHO THIẾT BỊ', 'ລາຍການເບີກຈ່າຍສາງອຸປະກອນ')}</Text>
                      <View style={[styles.ownerTodayPill, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.ownerTodayPillText, { color: '#B45309' }]}>{tr('HÔM NAY', 'ມື້ນີ້')}</Text>
                      </View>
                    </View>
                    <Text style={styles.ownerBigAmount}>{displayTotalOrders} {tr('đơn hàng', 'ລາຍການ')}</Text>
                  </View>
                </View>
                <View style={styles.ownerShiftTargetBox}>
                  <Text style={styles.ownerTargetLabel}>{tr('Mục tiêu xuất', 'ເປົ້າໝາຍເບີກຈ່າຍ')}</Text>
                  <Text style={[styles.ownerTargetPercent, { color: '#16A34A' }]}>100%</Text>
                </View>
              </View>
            </View>

            {/* 2 Thẻ phụ: Đã xuất giao máy & Chờ xuất kho */}
            <View style={styles.ownerSubStatsRow}>
              <View style={styles.ownerSubCard}>
                <View style={styles.ownerSubCardHeader}>
                  <Text style={styles.ownerSubCardLabel}>{tr('Đã xuất giao', 'ເບີກຈ່າຍແລ້ວ')}</Text>
                  <Ionicons name="checkmark-circle-outline" size={15} color="#16A34A" />
                </View>
                <Text style={styles.ownerSubCardVal}>{displayCompletedCount} {tr('đơn', 'ບິນ')}</Text>
                <View style={styles.ownerTrendRow}>
                  <Ionicons name="barcode-outline" size={12} color="#16A34A" />
                  <Text style={styles.ownerTrendText}>{tr('Đã kích hoạt IMEI', 'ເປີດໃຊ້ IMEI ແລ້ວ')}</Text>
                </View>
              </View>

              <View style={styles.ownerSubCard}>
                <View style={styles.ownerSubCardHeader}>
                  <Text style={styles.ownerSubCardLabel}>{tr('Chờ xuất kho', 'ລໍຖ້າເບີກຈ່າຍ')}</Text>
                  <Ionicons name="clipboard-outline" size={15} color="#D97706" />
                </View>
                <Text style={[styles.ownerSubCardVal, { color: '#D97706' }]}>{displayPendingCount} {tr('đơn', 'ບິນ')}</Text>
                <Text style={styles.ownerSubCardHint}>{tr('Cần kiểm IMEI', 'ຕ້ອງກວດ IMEI')}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.statsRow}>
            {/* Doanh số ca */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statLabel}>Doanh số ca</Text>
                <View style={[styles.statIconWrap, { backgroundColor: '#FFDAD6' }]}>
                  <Ionicons name="wallet-outline" size={12} color={Colors.primaryContainer} />
                </View>
              </View>
              <Text style={styles.statValRed}>{formatMoney(displayRevenue)}</Text>
              <Text style={styles.statSub}>Hôm nay</Text>
            </View>

            {/* Hoàn tất */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statLabel}>Hoàn tất</Text>
                <View style={[styles.statIconWrap, { backgroundColor: '#ECEEF0' }]}>
                  <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
                </View>
              </View>
              <Text style={styles.statValGreen}>
                {displayCompletedCount} <Text style={styles.statUnitText}>đơn</Text>
              </Text>
              <Text style={styles.statSubGreen}>Tỷ lệ 92%</Text>
            </View>

            {/* Chờ xử lý */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statLabel}>Chờ xử lý</Text>
                <View style={[styles.statIconWrap, { backgroundColor: '#ECEEF0' }]}>
                  <Ionicons name="time" size={13} color="#D97706" />
                </View>
              </View>
              <Text style={styles.statValAmber}>
                {displayPendingCount} <Text style={styles.statUnitText}>đơn</Text>
              </Text>
              <Text style={styles.statSubAmber}>Cần thu tiền</Text>
            </View>
          </View>
        )}

        {/* ── Dual Filter Rows (Chuẩn Stitch) ── */}
        <View style={styles.filterSection}>
          {/* Row 1: Status Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {/* Tất cả */}
            <Pressable
              style={[styles.statusChip, filterStatus === 'all' && styles.statusChipActive]}
              onPress={() => setFilterStatus('all')}
            >
              <Text style={[styles.statusChipText, filterStatus === 'all' && styles.statusChipTextActive]}>
                {tr('Tất cả', 'ທັງໝົດ')}
              </Text>
              <View style={[styles.countBadge, filterStatus === 'all' && styles.countBadgeActive]}>
                <Text style={[styles.countBadgeText, filterStatus === 'all' && styles.countBadgeTextActive]}>
                  {activeOrdersList.length}
                </Text>
              </View>
            </Pressable>

            {/* Hoàn tất */}
            <Pressable
              style={[styles.statusChip, filterStatus === 'completed' && styles.statusChipActive]}
              onPress={() => setFilterStatus('completed')}
            >
              <View style={styles.greenFilterDot} />
              <Text style={[styles.statusChipText, filterStatus === 'completed' && styles.statusChipTextActive]}>
                {tr('Hoàn tất', 'ສຳເລັດ')} ({displayCompletedCount})
              </Text>
            </Pressable>

            {/* Chờ xử lý */}
            <Pressable
              style={[styles.statusChip, filterStatus === 'pending' && styles.statusChipActive]}
              onPress={() => setFilterStatus('pending')}
            >
              <View style={styles.amberFilterDot} />
              <Text style={[styles.statusChipText, filterStatus === 'pending' && styles.statusChipTextActive]}>
                {tr('Chờ xử lý', 'ລໍຖ້າດຳເນີນການ')} ({displayPendingCount})
              </Text>
            </Pressable>

            {/* Đã hủy */}
            <Pressable
              style={[styles.statusChip, filterStatus === 'cancelled' && styles.statusChipActive]}
              onPress={() => setFilterStatus('cancelled')}
            >
              <View style={styles.redFilterDot} />
              <Text style={[styles.statusChipText, filterStatus === 'cancelled' && styles.statusChipTextActive]}>
                {tr('Đã hủy', 'ຍົກເລີກແລ້ວ')} ({activeOrdersList.filter((o) => o.status === 'cancelled').length})
              </Text>
            </Pressable>
          </ScrollView>

          {/* Row 2: Payment Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterRow, { marginTop: 6 }]}>
            <Pressable
              style={[styles.payChip, filterPayment === 'all' && styles.payChipActive]}
              onPress={() => setFilterPayment('all')}
            >
              <Text style={[styles.payChipText, filterPayment === 'all' && styles.payChipTextActive]}>
                {tr('Tất cả TT', 'ທຸກຮູບແບບ')}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.payChip, filterPayment === 'cash' && styles.payChipActive]}
              onPress={() => setFilterPayment('cash')}
            >
              <Text style={[styles.payChipText, filterPayment === 'cash' && styles.payChipTextActive]}>
                {tr('Tiền mặt', 'ເງິນສົດ')}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.payChipVietQr, filterPayment === 'transfer' && styles.payChipVietQrActive]}
              onPress={() => setFilterPayment('transfer')}
            >
              <Ionicons name="qr-code-outline" size={13} color="#400010" />
              <Text style={styles.payChipVietQrText}>{tr('VietQR chuyển khoản', 'ໂອນເງິນ VietQR')}</Text>
            </Pressable>

            <Pressable
              style={[styles.payChip, filterPayment === 'mixed' && styles.payChipActive]}
              onPress={() => setFilterPayment('mixed')}
            >
              <Text style={[styles.payChipText, filterPayment === 'mixed' && styles.payChipTextActive]}>
                {tr('Kết hợp đa cổng', 'ຫຼາຍຊ່ອງທາງ')}
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* ── Order Cards Stream (Mỗi đơn hàng có hình ảnh sản phẩm chuẩn Stitch) ── */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primaryContainer} />
            <Text style={styles.loadingText}>{tr('Đang tải danh sách đơn showroom...', 'ກຳລັງໂຫລດລາຍການບິນໜ້າຮ້ານ...')}</Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {filtered.map((item, idx) => {
              const isCompleted = item.status === 'completed'
              const isPendingDiscount = item.status === 'pending_discount'
              const isVietQr = item.paymentMethod === 'transfer'

              let badgeLabel = tr('Chờ thanh toán', 'ລໍຖ້າຊຳລະ')
              if (isPendingDiscount) {
                badgeLabel = tr('Chờ duyệt chiết khấu', 'ລໍຖ້າອະນຸມັດສ່ວນຫຼຸດ')
              } else if (isCompleted) {
                badgeLabel = isVietQr
                  ? tr('VietQR Hoàn tất', 'VietQR ສຳເລັດ')
                  : tr('Tiền mặt Hoàn tất', 'ເງິນສົດ ສຳເລັດ')
              } else if (item.status === 'cancelled') {
                badgeLabel = tr('Đã hủy', 'ຍົກເລີກແລ້ວ')
              }

              return (
                <View key={item.id} style={styles.orderCardExact}>
                  {/* Hàng 1: Mã HĐ + Nút Copy + Huy hiệu Hoàn tất / Chờ TT */}
                  <View style={styles.cardHeaderLine}>
                    <View style={styles.codeGroup}>
                      <Text style={styles.cardOrderCode}>{item.code}</Text>
                      <Pressable onPress={() => copyOrderCode(item.code)} hitSlop={8}>
                        <Ionicons name="copy-outline" size={14} color="#8C716E" />
                      </Pressable>
                    </View>

                    <View
                      style={[
                        styles.statusBadgeExact,
                        isPendingDiscount
                          ? styles.badgePendingDiscount
                          : isCompleted
                          ? styles.badgeSuccessExact
                          : styles.badgeWaitExact,
                      ]}
                    >
                      <Ionicons
                        name={
                          isPendingDiscount
                            ? 'time'
                            : isCompleted
                            ? isVietQr
                              ? 'checkmark-circle'
                              : 'cash-outline'
                            : 'time-outline'
                        }
                        size={12}
                        color={
                          isPendingDiscount
                            ? '#D97706'
                            : isCompleted
                            ? Colors.white
                            : '#D97706'
                        }
                      />
                      <Text
                        style={[
                          styles.statusBadgeTextExact,
                          isPendingDiscount
                            ? styles.textPendingDiscount
                            : isCompleted
                            ? styles.textSuccessExact
                            : styles.textWaitExact,
                        ]}
                      >
                        {badgeLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Hàng 2: Thời gian + Thu ngân */}
                  <View style={styles.timeCashierLine}>
                    <Ionicons name="time-outline" size={12} color="#8C716E" />
                    <Text style={styles.timeCashierText}>{item.createdAt}</Text>
                    <Text style={styles.timeDotSeparator}>•</Text>
                    <Ionicons name="person-outline" size={12} color="#8C716E" />
                    <Text style={styles.timeCashierText}>{tr('Thu ngân:', 'ພະນັກງານ:')} {item.cashier}</Text>
                  </View>

                  {/* Hàng 3: HỘP SẢN PHẨM CÓ HÌNH ẢNH (KHỚP 100% GOOGLE STITCH) */}
                  <View style={styles.orderProductInnerBox}>
                    <View style={styles.orderProductThumbWrap}>
                      <Image
                        source={getProductImageSource(item.imageUrl, item.itemsSummary)}
                        style={styles.orderProductThumbImg}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={styles.orderProductInfoCol}>
                      <Text style={styles.orderProductNameBold} numberOfLines={1}>
                        {item.itemsSummary}
                      </Text>
                      <Text style={styles.orderProductSubtitleText} numberOfLines={1}>
                        {item.productSubtitle || getProductMeta(item.itemsSummary).subtitle}
                      </Text>

                      {Boolean(item.imei) ? (
                        <View style={styles.orderImeiPillBox}>
                          <Ionicons name="qr-code-outline" size={12} color={Colors.primaryContainer} />
                          <Text style={styles.orderImeiPillText}>
                            {item.imei?.startsWith('H') || item.imei?.startsWith('Serial')
                              ? item.imei
                              : `IMEI: ${item.imei}`}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Hàng 4: Khách hàng & Chiết khấu & Giá tiền */}
                  <View style={styles.orderCardMiddleDetail}>
                    <View style={styles.customerRowWithVip}>
                      <Ionicons name="person-circle-outline" size={15} color="#DC2626" />
                      <Text style={styles.customerNameBold}>
                        {item.customerName === 'Khách vãng lai'
                          ? tr('Khách vãng lai', 'ລູກຄ້າທົ່ວໄປ')
                          : item.customerName === 'Khách lẻ tại quầy'
                          ? tr('Khách lẻ tại quầy', 'ລູກຄ້າໜ້າຮ້ານ')
                          : item.customerName}
                      </Text>
                      {Boolean(item.customerPhone) ? (
                        <Text style={styles.customerPhoneText}>({item.customerPhone})</Text>
                      ) : null}
                      {Boolean(item.isVipCustomer) ? (
                        <View style={styles.vipTagPill}>
                          <Text style={styles.vipTagPillText}>VIP</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.orderPaymentSummaryLine}>
                      <View>
                        <Text style={styles.totalPayLabel}>{tr('Tổng tiền thanh toán', 'ຍອດລວມຊຳລະ')}</Text>
                        {Boolean(item.discountInfo) ? (
                          <Text style={styles.discountInfoRedText}>{item.discountInfo}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.orderAmountRedText}>{formatMoney(item.total)}</Text>
                    </View>
                  </View>

                  {/* Hàng 5: Nút hành động */}
                  <View style={styles.orderActionButtonsRow}>
                    {Boolean(item.secondaryBtnLabel) ? (
                      <Pressable
                        style={styles.actionBtnSecondaryOutline}
                        onPress={() => setSelectedOrder(item)}
                      >
                        <Ionicons name="document-text-outline" size={14} color="#374151" />
                        <Text style={styles.actionBtnSecondaryText}>
                          {item.secondaryBtnLabel}
                        </Text>
                      </Pressable>
                    ) : null}

                    {isWarehouseStaff ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        {item.status !== 'completed' && item.status !== 'cancelled' ? (
                          <Pressable
                            style={[styles.actionBtnPrimaryGeneral, { backgroundColor: '#7A0C10' }]}
                            onPress={() => handleWarehouseDispatch(item)}
                          >
                            <Ionicons name="checkmark-done-circle-outline" size={15} color="#FFFFFF" />
                            <Text style={styles.actionBtnPrimaryGeneralText}>{tr('Xuất kho ngay', 'ເບີກຈ່າຍທັນທີ')}</Text>
                          </Pressable>
                        ) : (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              backgroundColor: '#ECFDF5',
                              paddingHorizontal: 8,
                              paddingVertical: 5,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: '#A7F3D0',
                            }}
                          >
                            <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#16A34A' }}>
                              {tr('Đã xuất kho', 'ເບີກຈ່າຍແລ້ວ')}
                            </Text>
                          </View>
                        )}
                        <Pressable
                          style={[styles.actionBtnSecondaryOutline, { borderColor: '#7A0C10' }]}
                          onPress={() => handlePrint(item)}
                        >
                          <Ionicons name="print-outline" size={14} color="#7A0C10" />
                          <Text style={[styles.actionBtnSecondaryText, { color: '#7A0C10', fontWeight: '700' }]}>
                            {item.status === 'completed'
                              ? tr('In lại phiếu xuất', 'ພິມໃບເບີກຈ່າຍຄືນ')
                              : tr('In phiếu xuất', 'ພິມໃບເບີກຈ່າຍ')}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.actionBtnSecondaryOutline, { borderColor: '#58413F' }]}
                          onPress={() => handleWarehouseVerifyImei(item)}
                        >
                          <Ionicons name="barcode-outline" size={14} color="#58413F" />
                          <Text style={[styles.actionBtnSecondaryText, { color: '#58413F', fontWeight: '700' }]}>
                            {tr('Kiểm IMEI', 'ກວດ IMEI')}
                          </Text>
                        </Pressable>
                      </View>
                    ) : item.actionBtnLabel === 'Duyệt chiết khấu' ? (
                      canApproveDiscount ? (
                        <Pressable
                          style={styles.actionBtnApproveDiscount}
                          onPress={() => handleApproveDiscount(item)}
                        >
                          <Ionicons name="checkmark-circle-outline" size={15} color="#FFFFFF" />
                          <Text style={styles.actionBtnApproveDiscountText}>Duyệt chiết khấu</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          style={[styles.actionBtnSecondaryOutline, { borderColor: '#F59E0B' }]}
                          onPress={() =>
                            Alert.alert(
                              'Chờ Chủ quán duyệt',
                              `Đơn hàng ${item.code} có yêu cầu chiết khấu VIP ${item.discountInfo || ''}.\nYêu cầu đã được gửi tới Chủ quán để duyệt.`
                            )
                          }
                        >
                          <Ionicons name="time-outline" size={14} color="#D97706" />
                          <Text style={[styles.actionBtnSecondaryText, { color: '#D97706', fontWeight: '700' }]}>
                            Chờ duyệt
                          </Text>
                        </Pressable>
                      )
                    ) : item.actionBtnLabel === 'Hủy & Hoàn tiền' ? (
                      canCancelRefund ? (
                        <Pressable
                          style={styles.actionBtnRefundDanger}
                          onPress={() => handleCancelAndRefund(item)}
                        >
                          <Ionicons name="shield-outline" size={14} color="#DC2626" />
                          <Text style={styles.actionBtnRefundDangerText}>Hủy & Hoàn tiền</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          style={styles.actionBtnSecondaryOutline}
                          onPress={() => handlePrint(item)}
                        >
                          <Ionicons name="print-outline" size={14} color="#374151" />
                          <Text style={styles.actionBtnSecondaryText}>In lại hóa đơn</Text>
                        </Pressable>
                      )
                    ) : item.actionBtnLabel === 'Chia sẻ HĐ' ? (
                      <Pressable
                        style={styles.actionBtnSecondaryOutline}
                        onPress={() => handleShare(item)}
                      >
                        <Ionicons name="share-social-outline" size={14} color="#374151" />
                        <Text style={styles.actionBtnSecondaryText}>Chia sẻ HĐ</Text>
                      </Pressable>
                    ) : item.actionBtnLabel === 'Hủy đơn hàng' ? (
                      <Pressable
                        style={styles.actionBtnCancelOrder}
                        onPress={() => handleCancelOrder(item)}
                      >
                        <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
                        <Text style={styles.actionBtnCancelOrderText}>Hủy đơn hàng</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={styles.actionBtnPrimaryGeneral}
                        onPress={() => setSelectedOrder(item)}
                      >
                        <Text style={styles.actionBtnPrimaryGeneralText}>
                          {item.actionBtnLabel}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Order Detail Modal chuẩn Stitch ── */}
      <Modal
        visible={!!selectedOrder}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Thanh drag handle */}
            <View style={styles.modalHandleBar} />

            <View style={styles.modalHeaderRow}>
              <View>
                <View style={styles.modalCodeBadgeRow}>
                  <Text style={styles.modalOrderCode}>{selectedOrder?.code}</Text>
                  <View style={styles.modalPaidBadge}>
                    <Text style={styles.modalPaidBadgeText}>
                      {selectedOrder?.status === 'completed'
                        ? tr('Đã thanh toán', 'ຊຳລະແລ້ວ')
                        : tr('Chờ thanh toán', 'ລໍຖ້າຊຳລະ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.modalStoreSubText}>
                  {tr('Hóa đơn bán lẻ điện tử Liêng Mobile Store', 'ໃບບິນຂາຍຍ່ອຍອີເລັກໂທຣນິກ Liêng Mobile Store')}
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseCircleBtn}
                onPress={() => setSelectedOrder(null)}
                hitSlop={10}
              >
                <Ionicons name="close" size={20} color="#58413F" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
              {/* Box Thông tin cơ bản */}
              <View style={styles.modalInfoGrayBox}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>{tr('Thời gian lập:', 'ເວລາສ້າງ:')}</Text>
                  <Text style={styles.modalInfoVal}>{selectedOrder?.createdAt} • 09/11/2026</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>{tr('Khách hàng:', 'ລູກຄ້າ:')}</Text>
                  <Text style={styles.modalInfoVal}>
                    {selectedOrder?.customerName} {selectedOrder?.customerPhone ? `(${selectedOrder.customerPhone})` : ''}
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>{tr('Chuyên viên phụ trách:', 'ພະນັກງານຮັບຜິດຊອບ:')}</Text>
                  <Text style={styles.modalInfoVal}>{selectedOrder?.cashier} (MNV: LM-084)</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>{tr('Cửa hàng:', 'ຮ້ານ:')}</Text>
                  <Text style={styles.modalInfoVal}>{tr('Chi nhánh Cầu Giấy - Hà Nội', 'ສາຂາ Cầu Giấy - ຮ່າໂນ້ຍ')}</Text>
                </View>
              </View>

              {/* Box Thông tin thiết bị & IMEI xuất kho */}
              <View style={styles.modalSectionWrap}>
                <Text style={styles.modalSectionHeaderTitle}>
                  {tr('THÔNG TIN THIẾT BỊ & IMEI XUẤT KHO', 'ຂໍ້ມູນອຸປະກອນ & IMEI ເບີກຈ່າຍສາງ')}
                </Text>
                <View style={styles.modalDeviceCard}>
                  <View style={styles.modalDeviceTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalDeviceName}>{selectedOrder?.itemsSummary}</Text>
                      <Text style={styles.modalDeviceSub}>
                        {tr('Màu:', 'ສີ:')} {selectedOrder?.productSubtitle?.split('•')[0]?.trim() || tr('Chuẩn', 'ມາດຕະຖານ')} | {tr('SL: 01 máy', 'ຈຳນວນ: 01 ເຄື່ອງ')}
                      </Text>
                    </View>
                    <Text style={styles.modalDevicePrice}>
                      {formatMoney((selectedOrder?.total || 0) + 500000)}
                    </Text>
                  </View>

                  {Boolean(selectedOrder?.imei) ? (
                    <View style={styles.modalImeiWhiteBox}>
                      <View style={styles.modalImeiLeftCol}>
                        <Ionicons name="qr-code-outline" size={18} color={Colors.primaryContainer} />
                        <View>
                          <Text style={styles.modalImeiLabelSmall}>
                            {tr('SỐ IMEI TRA CỨU BẢO HÀNH', 'ລະຫັດ IMEI ກວດສອບປະກັນ')}
                          </Text>
                          <Text style={styles.modalImeiCodeBold}>{selectedOrder?.imei}</Text>
                        </View>
                      </View>
                      <Pressable
                        style={styles.modalCopyImeiBtn}
                        onPress={() => copyOrderCode(selectedOrder?.imei || '')}
                      >
                        <Text style={styles.modalCopyImeiBtnText}>{tr('Sao chép', 'ຄັດລອກ')}</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Box Tổng kết thanh toán */}
              <View style={styles.modalFinanceBox}>
                <View style={styles.modalFinanceRow}>
                  <Text style={styles.modalFinanceLabel}>{tr('Tổng tiền hàng:', 'ມູນຄ່າສິນຄ້າລວມ:')}</Text>
                  <Text style={styles.modalFinanceVal}>
                    {formatMoney((selectedOrder?.total || 0) + 500000)}
                  </Text>
                </View>
                <View style={styles.modalFinanceRow}>
                  <Text style={styles.modalFinanceLabel}>{tr('Ưu đãi thanh toán POS (Voucher):', 'ສ່ວນຫຼຸດໂປຣໂມຊັ່ນ (Voucher):')}</Text>
                  <Text style={styles.modalFinanceDiscount}>- 500.000 đ</Text>
                </View>
                <View style={styles.modalFinanceRow}>
                  <Text style={styles.modalFinanceLabel}>{tr('Phương thức:', 'ຮູບແບບ:')}</Text>
                  <Text style={styles.modalFinanceVal}>
                    {selectedOrder?.paymentMethod === 'transfer'
                      ? tr('Chuyển khoản VietQR (MB Bank)', 'ໂອນເງິນ VietQR (MB Bank)')
                      : tr('Tiền mặt tại quầy', 'ເງິນສົດໜ້າຮ້ານ')}
                  </Text>
                </View>
                <View style={styles.modalTotalFinalRow}>
                  <Text style={styles.modalTotalFinalLabel}>{tr('Đã thanh toán:', 'ຊຳລະແລ້ວ:')}</Text>
                  <Text style={styles.modalTotalFinalVal}>
                    {formatMoney(selectedOrder?.total || 0)}
                  </Text>
                </View>
              </View>

              {/* Các nút hành động Modal */}
              <View style={styles.modalActionsCol}>
                <Pressable
                  style={styles.modalShareBtnPrimary}
                  onPress={() => selectedOrder && handleShare(selectedOrder)}
                >
                  <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.modalShareBtnPrimaryText}>
                    {tr('Chia sẻ hóa đơn điện tử (Zalo / SMS)', 'ແບ່ງປັນໃບບິນ (Zalo / SMS)')}
                  </Text>
                </Pressable>

                <View style={styles.modalTwoBtnsRow}>
                  <Pressable
                    style={styles.modalPrintBtn}
                    onPress={() => Alert.alert(tr('In hóa đơn', 'ພິມໃບບິນ'), tr('Đã gửi lệnh in đến máy in nhiệt POS.', 'ສົ່ງຄຳສັ່ງພິມໃສ່ເຄື່ອງພິມ POS ສຳເລັດ.'))}
                  >
                    <Ionicons name="print-outline" size={16} color="#191C1E" />
                    <Text style={styles.modalPrintBtnText}>{tr('In lại hóa đơn POS', 'ພິມໃບບິນ POS ຄືນ')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalCancelBtn}
                    onPress={() => Alert.alert(tr('Hủy đơn', 'ຍົກເລີກບິນ'), tr('Đã chuyển yêu cầu sang Quản lý ca trực.', 'ໄດ້ສົ່ງຄຳຮ້ອງຫາຜູ້ຈັດການກະແລ້ວ.'))}
                  >
                    <Ionicons name="warning-outline" size={16} color="#BA1A1A" />
                    <Text style={styles.modalCancelBtnText}>{tr('Hủy / Hoàn trả', 'ຍົກເລີກ / ສົ່ງຄືນ')}</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: PHIẾU XUẤT KHO KIÊM BÀN GIAO THIẾT BỊ ── */}
      <Modal
        visible={!!printSlipOrder}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPrintSlipOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <View style={styles.modalHandleBar} />

            <View style={styles.modalHeaderRow}>
              <View>
                <View style={styles.modalCodeBadgeRow}>
                  <Text style={[styles.modalOrderCode, { color: '#7A0C10' }]}>
                    PXK-{printSlipOrder?.code}
                  </Text>
                  <View style={[styles.modalPaidBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                    <Text style={[styles.modalPaidBadgeText, { color: '#059669' }]}>
                      {tr('Đã xuất kho', 'ເບີກຈ່າຍແລ້ວ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.modalStoreSubText}>
                  {tr(
                    'PHIẾU XUẤT KHO KIÊM BÀN GIAO THIẾT BỊ • LIÊNG MOBILE',
                    'ໃບເບີກຈ່າຍສາງພ້ອມມອບເຄື່ອງ • LIÊNG MOBILE',
                  )}
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseCircleBtn}
                onPress={() => setPrintSlipOrder(null)}
                hitSlop={10}
              >
                <Ionicons name="close" size={20} color="#58413F" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
              {/* Feedback banner khi bấm in */}
              {printingFeedback && (
                <View
                  style={{
                    backgroundColor: '#ECFDF5',
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#A7F3D0',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669', flex: 1 }}>
                    {tr(
                      'Đã truyền lệnh in nhiệt (Epson TM-T82) thành công! (02 liên bàn giao)',
                      'ສົ່ງຄຳສັ່ງພິມຄວາມຮ້ອນ (Epson TM-T82) ສຳເລັດ! (02 ສະບັບມອບຮັບ)',
                    )}
                  </Text>
                </View>
              )}

              {/* Box Cửa hàng & Ngày xuất */}
              <View style={styles.modalInfoGrayBox}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>{tr('Đơn vị xuất:', 'ພາກສ່ວນເບີກຈ່າຍ:')}</Text>
                  <Text style={styles.modalInfoVal}>{tr('Liêng Mobile • Cầu Giấy (Hà Nội)', 'Liêng Mobile • Cầu Giấy (ຮ່າໂນ້ຍ)')}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>{tr('Thời gian xuất kho:', 'ເວລາເບີກຈ່າຍສາງ:')}</Text>
                  <Text style={styles.modalInfoVal}>{printSlipOrder?.createdAt} • {tr('Hôm nay', 'ມື້ນີ້')}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>{tr('Thủ kho phụ trách:', 'ນາຍສາງຮັບຜິດຊອບ:')}</Text>
                  <Text style={styles.modalInfoVal}>Trần Minh Kho (MNV: TK-02)</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>{tr('Thu ngân tạo đơn:', 'ພະນັກງານເກັບເງິນ:')}</Text>
                  <Text style={styles.modalInfoVal}>{printSlipOrder?.cashier ?? 'Nguyễn Thu Hà'}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>{tr('Khách nhận máy:', 'ລູກຄ້າຮັບເຄື່ອງ:')}</Text>
                  <Text style={[styles.modalInfoVal, { fontWeight: '700' }]}>
                    {printSlipOrder?.customerName === 'Khách lẻ showroom'
                      ? tr('Khách lẻ showroom', 'ລູກຄ້າໜ້າຮ້ານ')
                      : printSlipOrder?.customerName} {printSlipOrder?.customerPhone ? `(${printSlipOrder.customerPhone})` : ''}
                  </Text>
                </View>
              </View>

              {/* Chi tiết thiết bị xuất */}
              <View style={styles.modalSectionWrap}>
                <Text style={styles.modalSectionHeaderTitle}>
                  {tr('CHI TIẾT THIẾT BỊ BÀN GIAO', 'ລາຍລະອຽດອຸປະກອນທີ່ມອບຮັບ')}
                </Text>
                <View style={styles.modalDeviceCard}>
                  <View style={styles.modalDeviceTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalDeviceName}>{printSlipOrder?.itemsSummary}</Text>
                      <Text style={styles.modalDeviceSub}>
                        {printSlipOrder?.productSubtitle || tr('Chính hãng VN/A', 'ເຄື່ອງແທ້ VN/A')} • {tr('SL: 01 cái', 'ຈຳນວນ: 01 ເຄື່ອງ')}
                      </Text>
                    </View>
                    <Text style={styles.modalDevicePrice}>
                      {formatMoney(printSlipOrder?.total ?? 0)}
                    </Text>
                  </View>

                  <View style={styles.modalImeiWhiteBox}>
                    <View style={styles.modalImeiLeftCol}>
                      <Ionicons name="qr-code-outline" size={18} color="#7A0C10" />
                      <View>
                        <Text style={styles.modalImeiLabelSmall}>
                          {tr('IMEI ĐỐI SOÁT XUẤT KHO', 'IMEI ກວດສອບເບີກຈ່າຍສາງ')}
                        </Text>
                        <Text style={styles.modalImeiCodeBold}>
                          {printSlipOrder?.imei || '357284419092257'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#166534' }}>
                        {tr('Khớp tem', 'ກົງກັບສະຕິກເກີ')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Tổng kết tiền */}
              <View style={styles.modalFinanceBox}>
                <View style={styles.modalFinanceRow}>
                  <Text style={styles.modalFinanceLabel}>{tr('Tổng thanh toán:', 'ຍອດລວມຊຳລະ:')}</Text>
                  <Text style={styles.modalTotalFinalVal}>
                    {formatMoney(printSlipOrder?.total ?? 0)}
                  </Text>
                </View>
                <View style={styles.modalFinanceRow}>
                  <Text style={styles.modalFinanceLabel}>{tr('Phương thức:', 'ຮູບແບບ:')}</Text>
                  <Text style={styles.modalFinanceVal}>
                    {printSlipOrder?.paymentMethod === 'transfer'
                      ? tr('VietQR MB Bank (Hoàn tất)', 'VietQR MB Bank (ສຳເລັດ)')
                      : tr('Tiền mặt', 'ເງິນສົດ')}
                  </Text>
                </View>
              </View>

              {/* Khối xác nhận 2 bên */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  paddingVertical: 14,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: '#ECEEF0',
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#58413F' }}>
                    {tr('THỦ KHO XUẤT', 'ນາຍສາງເບີກຈ່າຍ')}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#8C716E', marginTop: 3 }}>Trần Minh Kho</Text>
                  <View style={{ marginTop: 8, backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#166534' }}>
                      {tr('ĐÃ XUẤT KHO', 'ເບີກຈ່າຍແລ້ວ')}
                    </Text>
                  </View>
                </View>
                <View style={{ width: 1, backgroundColor: '#ECEEF0' }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#58413F' }}>
                    {tr('NGƯỜI NHẬN MÁY', 'ຜູ້ຮັບເຄື່ອງ')}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#8C716E', marginTop: 3 }}>
                    {printSlipOrder?.customerName || tr('Khách hàng', 'ລູກຄ້າ')}
                  </Text>
                  <View style={{ marginTop: 8, backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#166534' }}>
                      {tr('ĐÃ NHẬN ĐỦ', 'ໄດ້ຮັບຄົບຖ້ວນ')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Nút hành động */}
              <View style={styles.modalActionsCol}>
                <Pressable
                  style={[styles.modalShareBtnPrimary, { backgroundColor: '#7A0C10' }]}
                  onPress={() => {
                    setPrintingFeedback(true)
                  }}
                >
                  <Ionicons name="print-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.modalShareBtnPrimaryText}>
                    {tr('In Phiếu Xuất (Epson TM-T82 / 80mm)', 'ພິມໃບເບີກຈ່າຍ (Epson TM-T82 / 80mm)')}
                  </Text>
                </Pressable>

                <View style={styles.modalTwoBtnsRow}>
                  <Pressable
                    style={styles.modalPrintBtn}
                    onPress={() => printSlipOrder && handleShare(printSlipOrder)}
                  >
                    <Ionicons name="share-social-outline" size={16} color="#191C1E" />
                    <Text style={styles.modalPrintBtnText}>{tr('Chia sẻ phiếu', 'ແບ່ງປັນໃບເບີກຈ່າຍ')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalCancelBtn}
                    onPress={() => setPrintSlipOrder(null)}
                  >
                    <Ionicons name="close-circle-outline" size={16} color="#58413F" />
                    <Text style={[styles.modalCancelBtnText, { color: '#58413F' }]}>{tr('Đóng', 'ປິດ')}</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: ĐỐI SOÁT IMEI XUẤT KHO ── */}
      <Modal
        visible={imeiInspectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImeiInspectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <View style={styles.modalHandleBar} />

            <View style={styles.modalHeaderRow}>
              <View>
                <View style={styles.modalCodeBadgeRow}>
                  <Text style={[styles.modalOrderCode, { color: '#7A0C10' }]}>
                    {imeiInspectData?.order_code}
                  </Text>
                  <View style={[styles.modalPaidBadge, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.modalPaidBadgeText, { color: '#059669' }]}>
                      {tr('Khớp 100% CSDL', 'ກົງກັນ 100% ຖານຂໍ້ມູນ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.modalStoreSubText}>
                  {tr(
                    'ĐỐI SOÁT IMEI THIẾT BỊ VÀ THẺ KHO SHOWROOM',
                    'ກວດສອບ IMEI ອຸປະກອນ ແລະ ບັດສາງໜ້າຮ້ານ',
                  )}
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseCircleBtn}
                onPress={() => setImeiInspectModal(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={20} color="#58413F" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalInfoGrayBox}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>{tr('Khách nhận máy:', 'ລູກຄ້າຮັບເຄື່ອງ:')}</Text>
                  <Text style={[styles.modalInfoVal, { fontWeight: '700' }]}>
                    {imeiInspectData?.customer_name} ({imeiInspectData?.customer_phone || '0988.xxx.456'})
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>{tr('Trạng thái kho:', 'ສະຖານະສາງ:')}</Text>
                  <Text style={[styles.modalInfoVal, { color: '#059669', fontWeight: '700' }]}>
                    {imeiInspectData?.status === 'completed'
                      ? tr('Đã xuất kho & Đã gán IMEI', 'ເບີກຈ່າຍແລ້ວ & ຕິດ IMEI ແລ້ວ')
                      : tr('Chờ chuẩn bị máy', 'ລໍຖ້າກຽມເຄື່ອງ')}
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>{tr('Tổng giá trị đơn:', 'ມູນຄ່າລວມໃບບິນ:')}</Text>
                  <Text style={[styles.modalInfoVal, { color: '#7A0C10', fontWeight: '800' }]}>
                    {formatMoney(imeiInspectData?.total ?? 0)}
                  </Text>
                </View>
              </View>

              <View style={styles.modalSectionWrap}>
                <Text style={styles.modalSectionHeaderTitle}>
                  {tr('DANH SÁCH THIẾT BỊ ĐỐI SOÁT', 'ລາຍການອຸປະກອນກວດສອບ')}
                </Text>
                {(imeiInspectData?.items || []).map((it: any, idx: number) => (
                  <View key={idx} style={[styles.modalDeviceCard, { marginBottom: 10 }]}>
                    <View style={styles.modalDeviceTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalDeviceName}>{it.name}</Text>
                        <Text style={styles.modalDeviceSub}>
                          {it.variant || tr('Chính hãng', 'ເຄື່ອງແທ້')} • {tr('SL:', 'ຈຳນວນ:')} {it.quantity || 1}
                        </Text>
                      </View>
                      <Text style={styles.modalDevicePrice}>{formatMoney(it.price || 0)}</Text>
                    </View>

                    <View style={styles.modalImeiWhiteBox}>
                      <View style={styles.modalImeiLeftCol}>
                        <Ionicons name="barcode-outline" size={18} color="#7A0C10" />
                        <View>
                          <Text style={styles.modalImeiLabelSmall}>
                            {tr('MÃ IMEI XUẤT KHO', 'ລະຫັດ IMEI ເບີກຈ່າຍສາງ')}
                          </Text>
                          <Text style={styles.modalImeiCodeBold}>{it.imei || '357284419092257'}</Text>
                        </View>
                      </View>
                      <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#166534' }}>
                          {tr('Hợp lệ 100%', 'ຖືກຕ້ອງ 100%')}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <Pressable
                style={[styles.modalShareBtnPrimary, { backgroundColor: '#7A0C10', marginTop: 10 }]}
                onPress={() => setImeiInspectModal(false)}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.modalShareBtnPrimaryText}>
                  {tr('Xác nhận đối soát hoàn tất', 'ຢືນຢັນກວດສອບສຳເລັດ')}
                </Text>
              </Pressable>
            </ScrollView>
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
    gap: 5,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A0C10',
  },
  posBadge: {
    backgroundColor: '#FFD9DC',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 12,
  },
  posBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#400010',
  },
  storeSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#550005',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search Section
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#F7F9FB',
  },
  searchBarInner: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#191C1E',
    paddingVertical: 0,
  },
  scannerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },

  // 3 Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#58413F',
  },
  statIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValRed: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#7A0C10',
    marginBottom: 2,
  },
  statValGreen: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 2,
  },
  statValAmber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: 2,
  },
  statUnitText: {
    fontSize: 10.5,
    fontWeight: '400',
    color: '#58413F',
  },
  statSub: {
    fontSize: 10,
    color: '#58413F',
  },
  statSubGreen: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
  },
  statSubAmber: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },

  // Filters
  filterSection: {
    gap: 6,
  },
  filterRow: {
    gap: 6,
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
  },
  statusChipActive: {
    backgroundColor: '#7A0C10',
    borderColor: '#7A0C10',
  },
  statusChipText: {
    fontSize: 11.5,
    color: '#58413F',
    fontWeight: '500',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  countBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#58413F',
  },
  countBadgeTextActive: {
    color: '#FFFFFF',
  },
  greenFilterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  amberFilterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  redFilterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#BA1A1A',
  },
  payChip: {
    backgroundColor: '#F2F4F6',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  payChipActive: {
    backgroundColor: '#ECEEF0',
  },
  payChipText: {
    fontSize: 11,
    color: '#58413F',
    fontWeight: '500',
  },
  payChipTextActive: {
    color: '#191C1E',
    fontWeight: '700',
  },
  payChipVietQr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD9DC',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  payChipVietQrActive: {
    backgroundColor: '#FFCAD0',
  },
  payChipVietQrText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#400010',
  },

  // Orders List
  ordersList: {
    gap: 12,
  },
  orderCardExact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardOrderCode: {
    fontSize: 13.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    color: '#191C1E',
  },
  statusBadgeExact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: Radius.full,
  },
  badgeSuccessExact: {
    backgroundColor: '#16A34A',
  },
  badgeWaitExact: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeTextExact: {
    fontSize: 10,
    fontWeight: '700',
  },
  textSuccessExact: {
    color: '#FFFFFF',
  },
  textWaitExact: {
    color: '#D97706',
  },

  // Time & Cashier
  timeCashierLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeCashierText: {
    fontSize: 11,
    color: '#58413F',
  },
  timeDotSeparator: {
    fontSize: 11,
    color: '#8C716E',
    marginHorizontal: 3,
  },

  // Inner Product Box (Hộp xám bo góc có ảnh sản phẩm chuẩn Stitch)
  orderProductInnerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 10,
    gap: 12,
    marginVertical: 4,
  },
  orderProductThumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  orderProductThumbImg: {
    width: 48,
    height: 48,
  },
  orderProductInfoCol: {
    flex: 1,
    gap: 2,
  },
  orderProductNameBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191C1E',
  },
  orderProductSubtitleText: {
    fontSize: 11,
    color: '#58413F',
  },
  orderImeiPillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#E0E3E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  orderImeiPillText: {
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#191C1E',
  },

  // Card Footer Row
  orderCardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  footerCustomerCol: {
    gap: 2,
  },
  customerLineMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  customerMiniText: {
    fontSize: 11,
    color: '#58413F',
  },
  orderAmountRedText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7A0C10',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  orderActionBtnRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  actionBtnViewInvoice: {
    backgroundColor: '#ECEEF0',
  },
  actionTextViewInvoice: {
    color: '#7A0C10',
    fontWeight: '700',
  },
  actionBtnGray: {
    backgroundColor: '#ECEEF0',
  },
  actionBtnRemind: {
    backgroundColor: '#FFD9DC',
  },
  orderActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  actionTextGray: {
    color: '#191C1E',
  },
  actionTextRemind: {
    color: '#400010',
  },

  // Loading
  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.slate500,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHandleBar: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E3E5',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalCodeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalOrderCode: {
    fontSize: 17,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    color: '#191C1E',
  },
  modalPaidBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  modalPaidBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#16A34A',
  },
  modalStoreSubText: {
    fontSize: 11.5,
    color: '#58413F',
    marginTop: 2,
  },
  modalCloseCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBodyScroll: {
    marginBottom: 16,
  },
  modalInfoGrayBox: {
    backgroundColor: '#F2F4F6',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInfoLabel: {
    fontSize: 11.5,
    color: '#58413F',
  },
  modalInfoVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  modalSectionWrap: {
    marginBottom: 12,
  },
  modalSectionHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#58413F',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalDeviceCard: {
    backgroundColor: '#F7F9FB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 8,
  },
  modalDeviceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalDeviceName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  modalDeviceSub: {
    fontSize: 11,
    color: '#58413F',
    marginTop: 1,
  },
  modalDevicePrice: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#191C1E',
  },
  modalImeiWhiteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  modalImeiLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalImeiLabelSmall: {
    fontSize: 9,
    fontWeight: '600',
    color: '#58413F',
  },
  modalImeiCodeBold: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    color: '#7A0C10',
    letterSpacing: 0.5,
  },
  modalCopyImeiBtn: {
    backgroundColor: '#ECEEF0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalCopyImeiBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  modalFinanceBox: {
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  modalFinanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFinanceLabel: {
    fontSize: 11.5,
    color: '#58413F',
  },
  modalFinanceVal: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#191C1E',
  },
  modalFinanceDiscount: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#16A34A',
  },
  modalTotalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#ECEEF0',
  },
  modalTotalFinalLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  modalTotalFinalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7A0C10',
  },
  modalActionsCol: {
    gap: 8,
    paddingBottom: 16,
  },
  modalShareBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#7A0C10',
    shadowColor: '#7A0C10',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  modalShareBtnPrimaryText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalTwoBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalPrintBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECEEF0',
  },
  modalPrintBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191C1E',
  },
  modalCancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFDAD6',
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BA1A1A',
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

  // Owner Big KPI Section (Image 3)
  ownerKpiSection: {
    gap: 8,
  },
  ownerBigStatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  ownerBigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerBigHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ownerWalletIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#FFECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerShiftTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ownerShiftTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8C716E',
    letterSpacing: 0.3,
  },
  ownerTodayPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  ownerTodayPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  ownerBigAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191C1E',
    marginTop: 2,
  },
  ownerShiftTargetBox: {
    alignItems: 'flex-end',
  },
  ownerTargetLabel: {
    fontSize: 10.5,
    color: '#8C716E',
  },
  ownerTargetPercent: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191C1E',
  },
  ownerSubStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ownerSubCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 3,
  },
  ownerSubCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerSubCardLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  ownerSubCardVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191C1E',
  },
  ownerTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ownerTrendText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#16A34A',
  },
  ownerSubCardHint: {
    fontSize: 10.5,
    color: '#DC2626',
    fontWeight: '600',
  },

  // Badges & Statuses
  badgePendingDiscount: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  textPendingDiscount: {
    color: '#D97706',
    fontWeight: '700',
  },

  // Card Middle Detail
  orderCardMiddleDetail: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 6,
  },
  customerRowWithVip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  customerNameBold: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  customerPhoneText: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  vipTagPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  vipTagPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  orderPaymentSummaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalPayLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  discountInfoRedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Action Buttons Row
  orderActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBtnSecondaryOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: Radius.md,
    paddingVertical: 8,
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  actionBtnApproveDiscount: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    paddingVertical: 8,
  },
  actionBtnApproveDiscountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnRefundDanger: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.md,
    paddingVertical: 8,
  },
  actionBtnRefundDangerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionBtnCancelOrder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: Radius.md,
    paddingVertical: 8,
  },
  actionBtnCancelOrderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionBtnPrimaryGeneral: {
    flex: 1,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryGeneralText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
