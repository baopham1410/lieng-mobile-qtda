import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import * as ordersApi from '@/api/orders'
import { Card, Chip, Eyebrow, Muted, ScreenTitle } from '@/components/ui'
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
    code: 'HD-20261109-003',
    customerName: 'Anh Minh',
    customerPhone: '0982345678',
    total: 15990000,
    itemCount: 1,
    itemsSummary: 'iPhone 13 128GB Midnight (IMEI: 356891002345012)',
    paymentMethod: 'transfer',
    status: 'completed',
    createdAt: '16:45 Hôm nay',
    items: [{ name: 'iPhone 13 128GB Midnight', qty: 1, price: 15990000, imeis: ['356891002345012'] }],
  },
  {
    id: 2,
    code: 'HD-20261109-002',
    customerName: 'Chị Hạnh',
    customerPhone: '0901234888',
    total: 2510000,
    itemCount: 2,
    itemsSummary: 'Củ sạc 20W + Tai nghe Type-C',
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: '15:20 Hôm nay',
    items: [
      { name: 'Củ sạc nhanh Apple 20W', qty: 1, price: 490000 },
      { name: 'Tai nghe Type-C chính hãng', qty: 1, price: 2020000 },
    ],
  },
  {
    id: 3,
    code: 'HD-20261109-001',
    customerName: 'Khách vãng lai',
    total: 350000,
    itemCount: 1,
    itemsSummary: 'Ốp lưng MagSafe iPhone 15',
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: '14:10 Hôm nay',
  },
]

export default function OrdersScreen() {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all')
  const [orders, setOrders] = useState<DisplayOrder[]>(FALLBACK_ORDERS)

  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<DisplayOrder | null>(null)

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

  const filtered = orders.filter((o) => {
    if (filterStatus === 'all') return true
    return o.status === filterStatus
  })

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Eyebrow>QUẢN LÝ BÁN HÀNG</Eyebrow>
        <ScreenTitle>Danh sách đơn hàng</ScreenTitle>
        <Muted>Tra cứu lịch sử đơn, thông tin khách và số IMEI đã xuất</Muted>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <Chip
          label="Tất cả đơn"
          active={filterStatus === 'all'}
          onPress={() => setFilterStatus('all')}
        />
        <Chip
          label="Đã hoàn tất"
          active={filterStatus === 'completed'}
          onPress={() => setFilterStatus('completed')}
        />
        <Chip
          label="Chờ xử lý"
          active={filterStatus === 'pending'}
          onPress={() => setFilterStatus('pending')}
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
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelectedOrder(item)}>
              <Card style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View>
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
                    {item.customerPhone ? ` (${item.customerPhone})` : ''}
                  </Text>
                  <Text style={styles.itemSummary} numberOfLines={2}>
                    {item.itemsSummary}
                  </Text>
                </View>

                <View style={styles.orderBottom}>
                  <View style={styles.statusCompletedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color={Colors.greenDeep} />
                    <Text style={styles.statusCompletedText}>
                      {item.status === 'completed' ? 'Đã thanh toán' : 'Chờ xử lý'}
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

      {/* Modal Chi tiết đơn hàng */}
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

                <ScrollView style={{ maxHeight: 380, paddingTop: 10 }}>
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
    fontFamily: 'monospace',
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
  statusCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusCompletedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.greenDeep,
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
    paddingTop: Space.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  itemsSectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: 6,
  },
  itemDetailBox: {
    backgroundColor: Colors.panelWarm,
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.amber200,
  },
  itemDetailName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink,
    flex: 1,
  },
  itemDetailTotal: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.redDeep,
  },
  itemDetailSub: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  imeiBox: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.amber200,
  },
  imeiBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.amber900,
  },
  imeiCode: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.slate700,
    fontWeight: '600',
  },
  itemSummaryText: {
    fontSize: 12,
    color: Colors.slate700,
    fontStyle: 'italic',
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.redSoft,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: Space.sm,
    marginBottom: Space.xl,
    borderWidth: 1,
    borderColor: Colors.redBorder,
  },
  totalBoxLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.redDeep,
  },
  totalBoxVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.redDeep,
  },
})
