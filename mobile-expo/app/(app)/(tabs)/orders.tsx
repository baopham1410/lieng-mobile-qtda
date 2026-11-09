import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Card, Chip, Eyebrow, Muted, ScreenTitle } from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { formatMoney } from '@/utils/format'

interface MockOrder {
  id: string
  code: string
  customerName: string
  customerPhone?: string
  total: number
  itemCount: number
  itemsSummary: string
  paymentMethod: 'cash' | 'transfer' | 'mixed'
  status: 'completed' | 'pending' | 'cancelled'
  createdAt: string
}

const DEMO_ORDERS: MockOrder[] = [
  {
    id: '1',
    code: 'HD-20261109-003',
    customerName: 'Anh Minh',
    customerPhone: '0982345678',
    total: 15990000,
    itemCount: 1,
    itemsSummary: 'iPhone 13 128GB Midnight (IMEI: 356891002345012)',
    paymentMethod: 'transfer',
    status: 'completed',
    createdAt: '16:45 Hôm nay',
  },
  {
    id: '2',
    code: 'HD-20261109-002',
    customerName: 'Chị Hạnh',
    customerPhone: '0901234888',
    total: 2510000,
    itemCount: 2,
    itemsSummary: 'Củ sạc 20W + Tai nghe Type-C',
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: '15:20 Hôm nay',
  },
  {
    id: '3',
    code: 'HD-20261109-001',
    customerName: 'Khách vãng lai',
    total: 350000,
    itemCount: 1,
    itemsSummary: 'Ốp lưng MagSafe iPhone 15',
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: '14:10 Hôm nay',
  },
  {
    id: '4',
    code: 'HD-20261108-009',
    customerName: 'Anh Hoàng Nam',
    customerPhone: '0918765432',
    total: 29490000,
    itemCount: 1,
    itemsSummary: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
    paymentMethod: 'transfer',
    status: 'completed',
    createdAt: '18:30 Hôm qua',
  },
]

export default function OrdersScreen() {
  const insets = useSafeAreaInsets()
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all')

  const filtered = DEMO_ORDERS.filter((o) => {
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        renderItem={({ item }) => (
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
                    {item.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
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
                <Text style={styles.statusCompletedText}>Đã giao & thanh toán</Text>
              </View>

              <Pressable style={styles.detailBtn}>
                <Text style={styles.detailBtnText}>Chi tiết đơn</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.brand} />
              </Pressable>
            </View>
          </Card>
        )}
      />
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
})
