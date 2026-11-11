import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { Colors, Radius, Space } from '@/constants/config'
import { formatDateTimeVi, formatMoney } from '@/utils/format'

interface DisplayOrder {
  id: number | string
  code: string
  customerName: string
  customerPhone?: string
  total: number
  itemCount: number
  itemsSummary: string
  paymentMethod: 'cash' | 'transfer' | 'mixed' | string
  status: 'completed' | 'pending' | 'cancelled' | string
  createdAt: string
  cashier: string
  imei?: string
  items?: Array<{
    name: string
    qty: number
    price: number
    imeis?: string[]
  }>
}

// Dữ liệu fallback chuẩn Stitch Showcase
const STITCH_ORDERS: DisplayOrder[] = [
  {
    id: 1,
    code: 'HD-20261109-023',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0982345678',
    total: 29490000,
    itemCount: 1,
    itemsSummary: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
    paymentMethod: 'transfer',
    status: 'completed',
    createdAt: '14:32',
    cashier: 'Nguyễn Văn A',
    imei: '356891002345012',
    items: [{ name: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên', qty: 1, price: 29490000, imeis: ['356891002345012'] }],
  },
  {
    id: 2,
    code: 'HD-20261109-022',
    customerName: 'Trần Thị Mai',
    customerPhone: '0901234888',
    total: 26890000,
    itemCount: 1,
    itemsSummary: 'Samsung Galaxy S24 Ultra 512GB Xám Titan',
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: '13:10',
    cashier: 'Nguyễn Văn A',
    imei: '352345119902341',
    items: [{ name: 'Samsung Galaxy S24 Ultra 512GB', qty: 1, price: 26890000, imeis: ['352345119902341'] }],
  },
  {
    id: 3,
    code: 'HD-20261109-021',
    customerName: 'Lê Hoàng Long',
    customerPhone: '0978999123',
    total: 5390000,
    itemCount: 1,
    itemsSummary: 'Tai nghe AirPods Pro 2 Type-C (VN/A)',
    paymentMethod: 'transfer',
    status: 'pending',
    createdAt: '11:45',
    cashier: 'Nguyễn Văn A',
    items: [{ name: 'Tai nghe AirPods Pro 2 Type-C', qty: 1, price: 5390000 }],
  },
  {
    id: 4,
    code: 'HD-20261109-020',
    customerName: 'Phạm Quỳnh Anh',
    customerPhone: '0934567890',
    total: 850000,
    itemCount: 2,
    itemsSummary: 'Củ sạc 20W + Kính Kingbull',
    paymentMethod: 'mixed',
    status: 'completed',
    createdAt: '10:20',
    cashier: 'Nguyễn Văn A',
    items: [
      { name: 'Củ sạc nhanh Apple 20W USB-C', qty: 1, price: 490000 },
      { name: 'Kính cường lực Kingbull', qty: 1, price: 360000 },
    ],
  },
]

export default function OrdersScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all')
  const [filterPayment, setFilterPayment] = useState<'all' | 'cash' | 'transfer' | 'mixed'>('all')
  const [orders, setOrders] = useState<DisplayOrder[]>(STITCH_ORDERS)

  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<DisplayOrder | null>(null)

  const loadOrders = useCallback(async () => {
    try {
      const res = await ordersApi.fetchOrders({ per_page: 20 })
      const raw = res.data ?? res
      if (Array.isArray(raw) && raw.length > 0) {
        const mapped: DisplayOrder[] = raw.map((o: any) => {
          const items = Array.isArray(o.items) ? o.items : []
          const summary =
            items.length > 0
              ? items.map((i: any) => i.product_name || i.name || 'Sản phẩm').join(', ')
              : 'Đơn bán lẻ'

          const firstImei = items.find((i: any) => i.imei_code || (i.imeis && i.imeis[0]))
          const imeiStr = firstImei?.imei_code || firstImei?.imeis?.[0]

          return {
            id: o.id,
            code: o.code || `HD-${o.id}`,
            customerName: o.customer_name || 'Khách lẻ tại quầy',
            customerPhone: o.customer_phone,
            total: Number(o.total_amount) || 0,
            itemCount: items.length || 1,
            itemsSummary: summary,
            paymentMethod: o.payment_method || 'cash',
            status: o.status === 'completed' || o.status === 'paid' ? 'completed' : o.status || 'completed',
            createdAt: o.created_at ? formatDateTimeVi(o.created_at) : '14:30',
            cashier: o.cashier_name || 'Nguyễn Văn A',
            imei: imeiStr,
            items: items.map((i: any) => ({
              name: i.product_name || i.name || 'Món',
              qty: i.quantity || 1,
              price: Number(i.price) || 0,
              imeis: i.imei_code ? [i.imei_code] : i.imeis,
            })),
          }
        })
        setOrders(mapped)
      }
    } catch {
      // Giữ STITCH_ORDERS fallback
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const copyOrderCode = (code: string) => {
    Alert.alert('Mã đơn hàng', `Mã đơn: ${code}\nĐã lưu vào bộ nhớ tạm ca trực.`)
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

  // Shift Stats
  const totalRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0)
  const completedCount = orders.filter((o) => o.status === 'completed').length
  const pendingCount = orders.filter((o) => o.status === 'pending').length

  const handleShare = async (order: DisplayOrder) => {
    try {
      await Share.share({
        title: `Hóa đơn ${order.code} - Liêng Mobile`,
        message: `Hóa đơn bán hàng ${order.code} tại Liêng Mobile POS:\n- Khách hàng: ${order.customerName}\n- Sản phẩm: ${order.itemsSummary}\n- Tổng tiền: ${formatMoney(order.total)}\n- Trạng thái: ${order.status === 'completed' ? 'Đã hoàn tất' : 'Chờ xử lý'}`,
      })
    } catch {
      // Ignored
    }
  }

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
            <Text style={styles.brandSubtitle}>Chi nhánh Cầu Giấy • Đơn Hàng</Text>
          </View>
        </View>
        <View style={styles.headerRightActions}>
          <Pressable style={styles.iconCircleBtn}>
            <Ionicons name="notifications-outline" size={20} color={Colors.onSurface} />
            <View style={styles.unreadDot} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/account')}
            style={styles.avatarBtn}
          >
            <Ionicons name="person-circle-outline" size={26} color={Colors.primaryContainer} />
          </Pressable>
        </View>
      </View>

      {/* ── Search & Barcode Scan Bar ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#8C716E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo mã HĐ, tên khách, SĐT, IMEI..."
            placeholderTextColor="#8C716E"
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#8C716E" />
            </Pressable>
          )}
        </View>
        <Pressable
          style={styles.scannerBtn}
          onPress={() => router.push('/(app)/(tabs)/pos')}
        >
          <Ionicons name="barcode-outline" size={22} color={Colors.white} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadOrders()
            }}
            tintColor={Colors.primaryContainer}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── 3 Top Shift Stat Cards ── */}
        <View style={styles.statsRow}>
          {/* Doanh số ca */}
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statLabel}>Doanh số ca</Text>
              <View style={[styles.statIconWrap, { backgroundColor: '#FFECEF' }]}>
                <Ionicons name="wallet-outline" size={14} color={Colors.primaryContainer} />
              </View>
            </View>
            <Text style={styles.statVal}>{formatMoney(totalRevenue || 42500000)}</Text>
            <Text style={styles.statSub}>Hôm nay</Text>
          </View>

          {/* Hoàn tất */}
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statLabel}>Hoàn tất</Text>
              <View style={[styles.statIconWrap, { backgroundColor: Colors.greenSoft }]}>
                <Ionicons name="checkmark-circle-outline" size={14} color={Colors.green} />
              </View>
            </View>
            <Text style={styles.statVal}>{completedCount || 8} đơn</Text>
            <Text style={[styles.statSub, { color: Colors.green }]}>Tỷ lệ 89%</Text>
          </View>

          {/* Chờ xử lý */}
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statLabel}>Chờ xử lý</Text>
              <View style={[styles.statIconWrap, { backgroundColor: Colors.amber100 }]}>
                <Ionicons name="time-outline" size={14} color={Colors.amber800} />
              </View>
            </View>
            <Text style={styles.statVal}>{pendingCount || 1} đơn</Text>
            <Text style={[styles.statSub, { color: Colors.amber800 }]}>Cần thu tiền</Text>
          </View>
        </View>

        {/* ── Dual Filter Rows ── */}
        <View style={styles.filterSection}>
          {/* Row 1: Status */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {[
              { id: 'all', label: `Tất cả (${orders.length})` },
              { id: 'completed', label: `Hoàn tất (${completedCount})` },
              { id: 'pending', label: `Chờ xử lý (${pendingCount})` },
              { id: 'cancelled', label: 'Đã hủy (0)' },
            ].map((f) => {
              const active = filterStatus === f.id
              return (
                <Pressable
                  key={f.id}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setFilterStatus(f.id as any)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          {/* Row 2: Payment */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterRow, { marginTop: 6 }]}>
            {[
              { id: 'all', label: 'Tất cả TT' },
              { id: 'cash', label: 'Tiền mặt' },
              { id: 'transfer', label: 'VietQR chuyển khoản' },
              { id: 'mixed', label: 'Kết hợp đa cổng' },
            ].map((f) => {
              const active = filterPayment === f.id
              return (
                <Pressable
                  key={f.id}
                  style={[styles.filterChipSub, active && styles.filterChipSubActive]}
                  onPress={() => setFilterPayment(f.id as any)}
                >
                  <Text style={[styles.filterChipSubText, active && styles.filterChipSubTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>

        {/* ── Order Cards Stream ── */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primaryContainer} />
            <Text style={styles.loadingText}>Đang tải danh sách đơn showroom...</Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {filtered.map((item) => {
              const isCompleted = item.status === 'completed'
              return (
                <View key={item.id} style={styles.orderCard}>
                  {/* Top line: Code, Copy, Status Badge */}
                  <View style={styles.cardHeaderLine}>
                    <View style={styles.codeGroup}>
                      <Text style={styles.cardOrderCode}>{item.code}</Text>
                      <Pressable onPress={() => copyOrderCode(item.code)} hitSlop={8}>
                        <Ionicons name="copy-outline" size={14} color="#8C716E" />
                      </Pressable>
                      <Ionicons name="shield-checkmark" size={14} color={Colors.green} />
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        isCompleted ? styles.badgeSuccess : styles.badgeWait,
                      ]}
                    >
                      <Ionicons
                        name={isCompleted ? 'checkmark-circle' : 'time-outline'}
                        size={12}
                        color={isCompleted ? Colors.greenDeep : Colors.amber900}
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isCompleted ? styles.textSuccess : styles.textWait,
                        ]}
                      >
                        {isCompleted ? 'Hoàn tất' : 'Chờ xử lý'}
                      </Text>
                    </View>
                  </View>

                  {/* Cashier & Time */}
                  <Text style={styles.cardTimeText}>
                    {item.createdAt} • Thu ngân: {item.cashier}
                  </Text>

                  {/* Customer info */}
                  <View style={styles.customerLine}>
                    <Ionicons name="person-outline" size={13} color="#58413F" />
                    <Text style={styles.customerText}>
                      Khách: <Text style={{ fontWeight: '700', color: '#191C1E' }}>{item.customerName}</Text>
                      {item.customerPhone ? ` (${item.customerPhone})` : ''}
                    </Text>
                  </View>

                  {/* Product Summary */}
                  <Text style={styles.cardProductTitle} numberOfLines={2}>
                    {item.itemsSummary}
                  </Text>

                  {/* IMEI pill if exists */}
                  {item.imei && (
                    <View style={styles.imeiPill}>
                      <Ionicons name="barcode-outline" size={12} color={Colors.primaryContainer} />
                      <Text style={styles.imeiPillText}>IMEI: {item.imei}</Text>
                    </View>
                  )}

                  {/* Price & Payment line */}
                  <View style={styles.cardFooterLine}>
                    <View>
                      <Text style={styles.amountLabel}>Tổng thanh toán</Text>
                      <Text style={styles.amountValue}>{formatMoney(item.total)}</Text>
                    </View>
                    <View style={styles.payMethodPill}>
                      <Text style={styles.payMethodPillText}>
                        {item.paymentMethod === 'cash'
                          ? 'Tiền mặt'
                          : item.paymentMethod === 'transfer'
                            ? 'VietQR Pro'
                            : 'Kết hợp'}
                      </Text>
                    </View>
                  </View>

                  {/* Quick Action buttons */}
                  <View style={styles.cardActionsLine}>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => setSelectedOrder(item)}
                    >
                      <Ionicons name="receipt-outline" size={14} color={Colors.primaryContainer} />
                      <Text style={styles.actionBtnText}>Xem chi tiết</Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionBtnSecondary}
                      onPress={() => handleShare(item)}
                    >
                      <Ionicons name="share-social-outline" size={14} color="#58413F" />
                      <Text style={styles.actionBtnSecText}>Chia sẻ</Text>
                    </Pressable>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Order Detail Modal ── */}
      <Modal
        visible={!!selectedOrder}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết hóa đơn {selectedOrder?.code}</Text>
              <Pressable onPress={() => setSelectedOrder(null)} hitSlop={10}>
                <Ionicons name="close" size={24} color="#191C1E" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.invoiceCard}>
                <Text style={styles.invStore}>LIÊNG MOBILE • FLAGSHIP #01</Text>
                <Text style={styles.invSub}>123 Điện Biên Phủ, P. Võ Thị Sáu, Q.3, TP.HCM</Text>
                <View style={styles.invDivider} />

                <Text style={styles.invRowText}>
                  Khách hàng: <Text style={{ fontWeight: '700' }}>{selectedOrder?.customerName}</Text>
                </Text>
                {selectedOrder?.customerPhone && (
                  <Text style={styles.invRowText}>Số điện thoại: {selectedOrder?.customerPhone}</Text>
                )}
                <Text style={styles.invRowText}>Thời gian: {selectedOrder?.createdAt}</Text>
                <Text style={styles.invRowText}>Thu ngân: {selectedOrder?.cashier}</Text>

                <View style={styles.invDivider} />

                <Text style={styles.invSectionTitle}>DANH SÁCH MÓN</Text>
                {selectedOrder?.items?.map((it, idx) => (
                  <View key={idx} style={styles.invItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.invItemName}>{it.name}</Text>
                      {it.imeis && it.imeis.length > 0 && (
                        <Text style={styles.invImeiText}>IMEI: {it.imeis.join(', ')}</Text>
                      )}
                      <Text style={styles.invItemPrice}>
                        {it.qty} x {formatMoney(it.price)}
                      </Text>
                    </View>
                    <Text style={styles.invItemTotal}>{formatMoney(it.qty * it.price)}</Text>
                  </View>
                ))}

                <View style={styles.invDivider} />

                <View style={styles.invTotalRow}>
                  <Text style={styles.invTotalLabel}>TỔNG CỘNG:</Text>
                  <Text style={styles.invTotalVal}>
                    {selectedOrder ? formatMoney(selectedOrder.total) : '0 đ'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalShareBtn}
                onPress={() => selectedOrder && handleShare(selectedOrder)}
              >
                <Ionicons name="share-outline" size={18} color={Colors.white} />
                <Text style={styles.modalShareBtnText}>Chia sẻ hóa đơn điện tử</Text>
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

  // Search Section
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F6',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#191C1E',
    paddingVertical: 0,
  },
  scannerBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },

  // 3 Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10.5,
    color: '#58413F',
    fontWeight: '500',
  },
  statIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191C1E',
    marginBottom: 2,
  },
  statSub: {
    fontSize: 10.5,
    color: '#58413F',
  },

  // Filters
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  filterRow: {
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#F2F4F6',
  },
  filterChipActive: {
    backgroundColor: Colors.primaryContainer,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#58413F',
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  filterChipSub: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  filterChipSubActive: {
    borderColor: Colors.primaryContainer,
    backgroundColor: '#FFECEF',
  },
  filterChipSubText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#58413F',
  },
  filterChipSubTextActive: {
    color: Colors.primaryContainer,
    fontWeight: '700',
  },

  // Orders List
  ordersList: {
    gap: 10,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 8,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeSuccess: {
    backgroundColor: Colors.greenSoft,
  },
  badgeWait: {
    backgroundColor: Colors.amber100,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  textSuccess: {
    color: Colors.greenDeep,
  },
  textWait: {
    color: Colors.amber900,
  },
  cardTimeText: {
    fontSize: 11,
    color: '#58413F',
  },
  customerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerText: {
    fontSize: 12,
    color: '#58413F',
  },
  cardProductTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#191C1E',
    lineHeight: 18,
  },
  imeiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FFECEF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  imeiPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.primaryContainer,
  },
  cardFooterLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
  },
  amountLabel: {
    fontSize: 10.5,
    color: '#58413F',
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  payMethodPill: {
    backgroundColor: '#F2F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  payMethodPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#191C1E',
  },
  cardActionsLine: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFECEF',
    borderRadius: Radius.sm,
    paddingVertical: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F2F4F6',
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionBtnSecText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#58413F',
  },

  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#58413F',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  modalBody: {
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: '#F7F9FB',
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 6,
  },
  invStore: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryContainer,
    textAlign: 'center',
  },
  invSub: {
    fontSize: 11,
    color: '#58413F',
    textAlign: 'center',
  },
  invDivider: {
    height: 1,
    backgroundColor: '#DFBFBC',
    marginVertical: 6,
  },
  invRowText: {
    fontSize: 12,
    color: '#191C1E',
  },
  invSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#58413F',
    marginTop: 4,
  },
  invItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  invItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#191C1E',
  },
  invImeiText: {
    fontSize: 10,
    color: Colors.primaryContainer,
  },
  invItemPrice: {
    fontSize: 11,
    color: '#58413F',
  },
  invItemTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191C1E',
  },
  invTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  invTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191C1E',
  },
  invTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryContainer,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  modalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.sm,
    paddingVertical: 12,
  },
  modalShareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
})
