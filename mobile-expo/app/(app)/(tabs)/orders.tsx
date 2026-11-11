import { Ionicons } from '@expo/vector-icons'
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
import { Card, Chip, Eyebrow, Muted, PrimaryButton, ScreenTitle, StatCard } from '@/components/ui'
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
  paymentMethod: string
  status: string
  createdAt: string
  items?: Array<{
    name: string
    qty: number
    price: number
    imeis?: string[]
  }>
}

const FALLBACK_ORDERS: DisplayOrder[] = [
  {
    id: 1,
    code: 'HD-20260714-023',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0982345678',
    total: 19990000,
    itemCount: 1,
    itemsSummary: 'iPhone 15 Pro 128GB Titan Tự Nhiên (IMEI: 356891002345012)',
    paymentMethod: 'transfer',
    status: 'completed',
    createdAt: '14:30 Hôm nay',
    items: [{ name: 'iPhone 15 Pro 128GB Titan', qty: 1, price: 19990000, imeis: ['356891002345012'] }],
  },
  {
    id: 2,
    code: 'HD-20260714-022',
    customerName: 'Trần Thị B',
    customerPhone: '0901234888',
    total: 16990000,
    itemCount: 1,
    itemsSummary: 'Samsung Galaxy S24 256GB Vàng Amber',
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: '13:15 Hôm nay',
    items: [{ name: 'Samsung Galaxy S24 256GB', qty: 1, price: 16990000, imeis: ['352345119902341'] }],
  },
  {
    id: 3,
    code: 'HD-20260714-021',
    customerName: 'Lê Minh C',
    customerPhone: '0978999123',
    total: 14990000,
    itemCount: 2,
    itemsSummary: 'Xiaomi 14 512GB + Củ sạc 90W',
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: '11:45 Hôm nay',
    items: [
      { name: 'Xiaomi 14 512GB', qty: 1, price: 13990000, imeis: ['864901024567890'] },
      { name: 'Củ sạc siêu nhanh 90W Xiaomi', qty: 1, price: 1000000 },
    ],
  },
]

export default function OrdersScreen() {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all')
  const [filterPayment, setFilterPayment] = useState<'all' | 'cash' | 'transfer' | 'mixed'>('all')
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'this_week'>('all')
  const [orders, setOrders] = useState<DisplayOrder[]>(FALLBACK_ORDERS)

  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<DisplayOrder | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const loadOrders = useCallback(async () => {
    try {
      const res = await ordersApi.fetchOrders({
        status: filterStatus === 'all' ? undefined : filterStatus,
      })
      const raw = res.data ?? res
      if (Array.isArray(raw) && raw.length > 0) {
        const mapped: DisplayOrder[] = raw.map((o: any) => ({
          id: o.id,
          code: o.code || `HD-${o.id}`,
          customerName: o.customer_name || 'Khách lẻ tại quầy',
          customerPhone: o.customer_phone,
          total: Number(o.total_amount) || 0,
          itemCount: o.items ? o.items.length : 1,
          itemsSummary: o.items
            ? o.items.map((i: any) => i.product_name || i.name).join(', ')
            : 'Đơn hàng bán lẻ',
          paymentMethod: o.payment_method || 'cash',
          status: o.status || 'completed',
          createdAt: o.created_at ? formatDateTimeVi(o.created_at) : 'Vừa xong',
          items: o.items?.map((i: any) => ({
            name: i.product_name || i.name || 'Sản phẩm',
            qty: i.quantity || 1,
            price: Number(i.price) || 0,
            imeis: i.imeis,
          })),
        }))
        setOrders(mapped)
      }
    } catch {
      // Dùng fallback orders nếu chưa có dữ liệu backend
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filterStatus])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Lọc theo search & filterStatus & filterPayment
  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    const matchPayment = filterPayment === 'all' || o.paymentMethod === filterPayment
    const q = search.trim().toLowerCase()
    if (!q) return matchStatus && matchPayment
    const matchCode = o.code.toLowerCase().includes(q)
    const matchName = o.customerName.toLowerCase().includes(q)
    const matchPhone = o.customerPhone?.toLowerCase().includes(q)
    const matchItem = o.itemsSummary.toLowerCase().includes(q)
    return matchStatus && matchPayment && (matchCode || matchName || matchPhone || matchItem)
  })

  // Thống kê nhanh đơn
  const totalRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, it) => sum + it.total, 0)
  const completedCount = orders.filter((o) => o.status === 'completed').length
  const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'pending_payment').length

  const handleShareOrder = async (order: DisplayOrder) => {
    try {
      const msg = [
        `HÓA ĐƠN BÁN LẺ - LIENG MOBILE`,
        `Mã đơn: ${order.code}`,
        `Thời gian: ${order.createdAt}`,
        `Khách hàng: ${order.customerName} ${order.customerPhone ? `(${order.customerPhone})` : ''}`,
        `Sản phẩm: ${order.itemsSummary}`,
        `Tổng tiền: ${formatMoney(order.total)}`,
        `Hình thức: ${order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}`,
        `Trạng thái: ${order.status === 'completed' ? 'Đã thanh toán' : order.status}`,
      ].join('\n')
      await Share.share({ message: msg })
    } catch {
      // Bỏ qua lỗi hủy share
    }
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder) return
    const doCancel = async () => {
      setCancelling(true)
      try {
        await ordersApi.cancelOrder(selectedOrder.id)
        setOrders((prev) =>
          prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: 'cancelled' } : o)),
        )
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : null))
      } catch (err: any) {
        Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể hủy đơn.')
      } finally {
        setCancelling(false)
      }
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${selectedOrder.code}?`)) {
        await doCancel()
      }
    } else {
      Alert.alert('Hủy đơn hàng', `Bạn có chắc muốn hủy đơn hàng ${selectedOrder.code}?`, [
        { text: 'Bỏ qua', style: 'cancel' },
        { text: 'Xác nhận hủy', style: 'destructive', onPress: doCancel },
      ])
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Eyebrow>QUẢN LÝ BÁN HÀNG</Eyebrow>
        <ScreenTitle>Danh sách đơn hàng</ScreenTitle>
        <Muted>Tra cứu lịch sử đơn, thông tin khách và số IMEI đã xuất</Muted>
      </View>

      {/* ── Thống kê nhanh đơn hàng (Web-aligned Stats) ── */}
      <View style={styles.statsStrip}>
        <View style={styles.statCol}>
          <StatCard
            label="Doanh số hoàn tất"
            value={formatMoney(totalRevenue)}
            icon="income"
            iconColor={Colors.brand}
            iconBg={Colors.redSoft}
            valueColor={Colors.redDeep}
          />
        </View>
        <View style={styles.statCol}>
          <StatCard
            label="Đơn thành công"
            value={`${completedCount} đơn`}
            icon="net"
            iconColor={Colors.greenDeep}
            iconBg={Colors.greenSoft}
            valueColor={Colors.greenDeep}
          />
        </View>
        <View style={styles.statCol}>
          <StatCard
            label="Chờ xử lý"
            value={`${pendingCount} đơn`}
            icon="transfer"
            iconColor={Colors.amber700}
            iconBg={Colors.amber100}
            valueColor={Colors.amber900}
          />
        </View>
      </View>

      {/* ── Search Box ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={17} color={Colors.slate400} style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm mã đơn, tên khách, số điện thoại..."
          placeholderTextColor={Colors.slate400}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!search && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.slate400} />
          </Pressable>
        )}
      </View>

      {/* ── Filter Chips ── */}
      <View style={styles.filterRow}>
        <Chip
          label="Tất cả"
          active={filterStatus === 'all'}
          onPress={() => setFilterStatus('all')}
        />
        <Chip
          label="Hoàn tất"
          active={filterStatus === 'completed'}
          onPress={() => setFilterStatus('completed')}
        />
        <Chip
          label="Chờ xử lý"
          active={filterStatus === 'pending'}
          onPress={() => setFilterStatus('pending')}
        />
        <Chip
          label="Đã hủy"
          active={filterStatus === 'cancelled'}
          onPress={() => setFilterStatus('cancelled')}
        />
      </View>

      {/* ── Payment Method Filters (Web-aligned) ── */}
      <View style={[styles.filterRow, { marginTop: 4, marginBottom: 8 }]}>
        <Chip
          label="Tất cả TT"
          active={filterPayment === 'all'}
          onPress={() => setFilterPayment('all')}
        />
        <Chip
          label="Tiền mặt"
          active={filterPayment === 'cash'}
          onPress={() => setFilterPayment('cash')}
        />
        <Chip
          label="Chuyển khoản"
          active={filterPayment === 'transfer'}
          onPress={() => setFilterPayment('transfer')}
        />
        <Chip
          label="Kết hợp"
          active={filterPayment === 'mixed'}
          onPress={() => setFilterPayment('mixed')}
        />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Colors.brand} size="large" />
          <Text style={styles.loadingText}>Đang tải danh sách đơn...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                loadOrders()
              }}
              tintColor={Colors.brand}
            />
          }
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={44} color={Colors.slate400} />
              <Text style={styles.emptyTitle}>Không tìm thấy đơn hàng</Text>
              <Text style={styles.emptyDesc}>
                Thử thay đổi từ khóa tìm kiếm hoặc chuyển bộ lọc trạng thái khác.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelectedOrder(item)}>
              <Card style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderCode}>{item.code}</Text>
                    <Text style={styles.orderTime}>{item.createdAt}</Text>
                  </View>
                  <View style={styles.amountBox}>
                    <Text style={styles.orderTotal}>{formatMoney(item.total)}</Text>
                    <View style={styles.payBadge}>
                      <Text style={styles.payBadgeText}>
                        {item.paymentMethod === 'cash'
                          ? 'Tiền mặt'
                          : item.paymentMethod === 'transfer'
                            ? 'Chuyển khoản'
                            : 'Hỗn hợp'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.orderMiddle}>
                  <Text style={styles.customerName}>
                    Khách: <Text style={{ fontWeight: '700', color: Colors.ink }}>{item.customerName}</Text>
                    {item.customerPhone ? ` · ${item.customerPhone}` : ''}
                  </Text>
                  <Text style={styles.itemSummary} numberOfLines={2}>
                    {item.itemsSummary}
                  </Text>
                </View>

                <View style={styles.orderBottom}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'completed'
                        ? styles.statusCompleted
                        : item.status === 'cancelled'
                          ? styles.statusCancelled
                          : styles.statusPending,
                    ]}
                  >
                    <Ionicons
                      name={
                        item.status === 'completed'
                          ? 'checkmark-circle'
                          : item.status === 'cancelled'
                            ? 'close-circle'
                            : 'time'
                      }
                      size={13}
                      color={
                        item.status === 'completed'
                          ? Colors.greenDeep
                          : item.status === 'cancelled'
                            ? Colors.redDeep
                            : Colors.amber900
                      }
                    />
                    <Text
                      style={[
                        styles.statusText,
                        item.status === 'completed'
                          ? { color: Colors.greenDeep }
                          : item.status === 'cancelled'
                            ? { color: Colors.redDeep }
                            : { color: Colors.amber900 },
                      ]}
                    >
                      {item.status === 'completed'
                        ? 'Đã thanh toán'
                        : item.status === 'cancelled'
                          ? 'Đã hủy'
                          : 'Chờ xử lý'}
                    </Text>
                  </View>

                  <View style={styles.detailBtn}>
                    <Text style={styles.detailBtnText}>Chi tiết đơn</Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.brand} />
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}

      {/* ── Modal Chi tiết đơn hàng (Web-aligned SlideOver) ── */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalEyebrow}>CHI TIẾT HÓA ĐƠN</Text>
                    <Text style={styles.modalTitle}>{selectedOrder.code}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedOrder(null)} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color={Colors.slate} />
                  </Pressable>
                </View>

                <ScrollView style={{ maxHeight: 420, paddingTop: 10 }}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Khách hàng:</Text>
                    <Text style={styles.infoVal}>{selectedOrder.customerName}</Text>
                  </View>
                  {selectedOrder.customerPhone && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Số điện thoại:</Text>
                      <Text style={styles.infoVal}>{selectedOrder.customerPhone}</Text>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Thời gian lập:</Text>
                    <Text style={styles.infoVal}>{selectedOrder.createdAt}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Hình thức TT:</Text>
                    <Text style={styles.infoVal}>
                      {selectedOrder.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Trạng thái:</Text>
                    <Text
                      style={[
                        styles.infoVal,
                        {
                          color:
                            selectedOrder.status === 'completed'
                              ? Colors.greenDeep
                              : selectedOrder.status === 'cancelled'
                                ? Colors.redDeep
                                : Colors.amber900,
                        },
                      ]}
                    >
                      {selectedOrder.status === 'completed'
                        ? 'Đã thanh toán'
                        : selectedOrder.status === 'cancelled'
                          ? 'Đã hủy đơn'
                          : 'Chờ thanh toán'}
                    </Text>
                  </View>

                  <View style={styles.itemsSection}>
                    <Text style={styles.itemsSectionHeading}>Danh sách thiết bị / hàng hóa:</Text>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((it, idx) => (
                        <View key={idx} style={styles.itemDetailBox}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.itemDetailName}>{it.name}</Text>
                            <Text style={styles.itemDetailTotal}>{formatMoney(it.price * it.qty)}</Text>
                          </View>
                          <Text style={styles.itemDetailSub}>
                            Số lượng: {it.qty} · Đơn giá: {formatMoney(it.price)}
                          </Text>
                          {it.imeis && it.imeis.length > 0 && (
                            <View style={styles.imeiBox}>
                              <Text style={styles.imeiBoxLabel}>IMEI máy xuất kho:</Text>
                              {it.imeis.map((im, imIdx) => (
                                <Text key={imIdx} style={styles.imeiCode}>• {im}</Text>
                              ))}
                            </View>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.itemSummaryText}>{selectedOrder.itemsSummary}</Text>
                    )}
                  </View>

                  <View style={styles.totalBox}>
                    <Text style={styles.totalBoxLabel}>Tổng tiền thanh toán:</Text>
                    <Text style={styles.totalBoxVal}>{formatMoney(selectedOrder.total)}</Text>
                  </View>

                  {/* Nút Chia sẻ hóa đơn & Hủy đơn */}
                  <View style={{ marginTop: Space.md, gap: Space.sm }}>
                    <PrimaryButton
                      label="CHIA SẺ HÓA ĐƠN"
                      tone="brand"
                      icon="share-social-outline"
                      onPress={() => handleShareOrder(selectedOrder)}
                    />
                    {selectedOrder.status !== 'cancelled' && (
                      <PrimaryButton
                        label={cancelling ? 'Đang hủy...' : 'HỦY ĐƠN HÀNG'}
                        tone="red"
                        icon="trash-outline"
                        onPress={handleCancelOrder}
                        disabled={cancelling}
                      />
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  header: {
    paddingHorizontal: Space.lg,
    paddingTop: Space.sm,
  },
  statsStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Space.lg,
    marginTop: Space.sm,
  },
  statCol: {
    flex: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    height: 44,
    marginHorizontal: Space.lg,
    marginTop: Space.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.ink,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Space.lg,
    marginVertical: Space.sm,
  },
  centerBox: {
    paddingVertical: Space.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: Colors.slate,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: Space.lg,
    gap: Space.sm,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: Space.xl * 2,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: Colors.slate,
    textAlign: 'center',
    maxWidth: 240,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.brand,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  orderCode: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '900',
    color: Colors.brand,
  },
  orderTime: {
    fontSize: 11,
    color: Colors.slate400,
    marginTop: 2,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.ink,
  },
  payBadge: {
    backgroundColor: Colors.slate100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginTop: 2,
  },
  payBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate600,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.slate100,
    marginVertical: 10,
  },
  orderMiddle: {
    gap: 4,
  },
  customerName: {
    fontSize: 12,
    color: Colors.slate,
  },
  itemSummary: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate700,
  },
  orderBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.slate50,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusCompleted: {
    backgroundColor: Colors.greenSoft,
    borderColor: Colors.greenBorder,
  },
  statusCancelled: {
    backgroundColor: Colors.redSoft,
    borderColor: Colors.redBorder,
  },
  statusPending: {
    backgroundColor: Colors.amber100,
    borderColor: Colors.amber200,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Space.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate400,
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.brand,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.slate,
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.ink,
  },
  itemsSection: {
    marginTop: Space.sm,
  },
  itemsSectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: 6,
  },
  itemDetailBox: {
    backgroundColor: Colors.canvas,
    padding: Space.sm,
    borderRadius: Radius.md,
    marginBottom: 6,
  },
  itemDetailName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
  },
  itemDetailTotal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.brand,
  },
  itemDetailSub: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  imeiBox: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  imeiBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate,
  },
  imeiCode: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.brand,
  },
  itemSummaryText: {
    fontSize: 12,
    color: Colors.slate,
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.redSoft,
    padding: Space.md,
    borderRadius: Radius.lg,
    marginTop: Space.md,
    borderWidth: 1,
    borderColor: Colors.redBorder,
  },
  totalBoxLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.brandDeep,
  },
  totalBoxVal: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.brand,
  },
})
