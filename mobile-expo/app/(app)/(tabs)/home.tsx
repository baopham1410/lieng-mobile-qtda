import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import * as ordersApi from '@/api/orders'
import { Card, Eyebrow, Muted, ScreenTitle, StatCard } from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { formatDateTimeVi, formatMoney } from '@/utils/format'

interface RecentOrder {
  id: number | string
  code: string
  customerName: string
  total: number
  itemCount: number
  summary: string
  createdAt: string
  status: string
}

const FALLBACK_RECENT: RecentOrder[] = [
  {
    id: 1,
    code: 'HD-20261109-003',
    customerName: 'Anh Minh',
    total: 15990000,
    itemCount: 1,
    summary: 'iPhone 13 128GB Midnight (IMEI: 356891***012)',
    createdAt: '16:45 Hôm nay',
    status: 'completed',
  },
  {
    id: 2,
    code: 'HD-20261109-002',
    customerName: 'Chị Hạnh',
    total: 2510000,
    itemCount: 2,
    summary: 'Củ sạc 20W + Tai nghe Type-C',
    createdAt: '15:20 Hôm nay',
    status: 'completed',
  },
  {
    id: 3,
    code: 'HD-20261109-001',
    customerName: 'Khách vãng lai',
    total: 350000,
    itemCount: 1,
    summary: 'Ốp lưng MagSafe iPhone 15',
    createdAt: '14:10 Hôm nay',
    status: 'completed',
  },
]

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(FALLBACK_RECENT)
  const [stats, setStats] = useState({
    todayRevenue: 18850000,
    completedOrders: 3,
    pendingAppraisals: 2,
    activeWarranties: 1,
  })

  const loadDashboard = useCallback(async () => {
    try {
      const res = await ordersApi.fetchOrders({ per_page: 5 })
      const raw = res.data ?? res
      if (Array.isArray(raw) && raw.length > 0) {
        const mapped: RecentOrder[] = raw.slice(0, 4).map((o: any) => ({
          id: o.id,
          code: o.code || `HD-${o.id}`,
          customerName: o.customer_name || 'Khách lẻ tại quầy',
          total: Number(o.total_amount) || 0,
          itemCount: o.items ? o.items.length : 1,
          summary: o.items ? o.items.map((i: any) => i.product_name || i.name).join(', ') : 'Đơn bán lẻ',
          createdAt: o.created_at ? formatDateTimeVi(o.created_at) : 'Hôm nay',
          status: o.status || 'completed',
        }))
        setRecentOrders(mapped)

        const totalRev = mapped.reduce((sum, it) => sum + it.total, 0)
        setStats((prev) => ({
          ...prev,
          todayRevenue: totalRev > 0 ? totalRev : 18850000,
          completedOrders: mapped.length,
        }))
      }
    } catch {
      // Dùng fallback nếu API chưa có data
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboard()
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />
        }
      >
        {/* Header Block */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1 }}>
            <Eyebrow>LIENG MOBILE STORE</Eyebrow>
            <ScreenTitle>Xin chào, {user?.name?.split(' ').pop() || 'Nhân viên'}!</ScreenTitle>
            <Muted>Tổng quan tình hình kinh doanh cửa hàng hôm nay</Muted>
          </View>
          <View style={styles.storeStatusBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.storeStatusText}>Đang mở ca</Text>
          </View>
        </View>

        {/* Thống kê nhanh hôm nay (Stats Overview) */}
        <View style={styles.statsGrid}>
          <View style={styles.statCol}>
            <StatCard
              label="Doanh thu hôm nay"
              value={formatMoney(stats.todayRevenue)}
              icon="income"
              valueColor={Colors.greenDeep}
              hint={`${stats.completedOrders} đơn bán lẻ`}
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              label="Đơn hoàn tất"
              value={`${stats.completedOrders} đơn`}
              icon="net"
              iconColor={Colors.brand}
              iconBg={Colors.redSoft}
              valueColor={Colors.ink}
              hint="100% thanh toán"
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              label="Máy chờ thẩm định"
              value={`${stats.pendingAppraisals} máy`}
              icon="transfer"
              iconColor={Colors.amber700}
              iconBg={Colors.amber100}
              valueColor={Colors.amber900}
              hint="Thu cũ đổi mới"
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              label="Bảo hành trong ca"
              value={`${stats.activeWarranties} máy`}
              icon="cash"
              iconColor={Colors.blueDeep}
              iconBg={Colors.blueSoft}
              valueColor={Colors.blueDeep}
              hint="Đang xử lý"
            />
          </View>
        </View>

        {/* Phím tắt thao tác nhanh (Quick Actions) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Thao tác nhanh tại quầy</Text>
        </View>
        <View style={styles.quickGrid}>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/pos')}
            style={({ pressed }) => [styles.quickActionCard, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: Colors.redSoft }]}>
              <Ionicons name="cart-outline" size={22} color={Colors.brand} />
            </View>
            <Text style={styles.actionTitle}>Tạo đơn POS mới</Text>
            <Text style={styles.actionDesc}>Bán máy, phụ kiện, quét IMEI</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/appraisal')}
            style={({ pressed }) => [styles.quickActionCard, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: Colors.amber100 }]}>
              <Ionicons name="phone-portrait-outline" size={22} color={Colors.amber900} />
            </View>
            <Text style={styles.actionTitle}>Thẩm định máy cũ</Text>
            <Text style={styles.actionDesc}>AutoGrade định giá thu đổi</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/(tabs)/services')}
            style={({ pressed }) => [styles.quickActionCard, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: Colors.blueSoft }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color={Colors.blueDeep} />
            </View>
            <Text style={styles.actionTitle}>Tra cứu bảo hành</Text>
            <Text style={styles.actionDesc}>Check IMEI / SĐT khách</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/(tabs)/quay')}
            style={({ pressed }) => [styles.quickActionCard, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: Colors.greenSoft }]}>
              <Ionicons name="storefront-outline" size={22} color={Colors.greenDeep} />
            </View>
            <Text style={styles.actionTitle}>Quầy nhỏ (Quán)</Text>
            <Text style={styles.actionDesc}>Module Quán & Ghi chi phụ</Text>
          </Pressable>
        </View>

        {/* Đơn hàng gần đây */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đơn hàng gần đây trong ca</Text>
          <Pressable onPress={() => router.push('/(app)/(tabs)/orders')}>
            <Text style={styles.seeAllText}>Xem tất cả →</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.brand} />
          </View>
        ) : (
          <View style={styles.orderList}>
            {recentOrders.map((ord) => (
              <Pressable
                key={ord.id}
                onPress={() => router.push('/(app)/(tabs)/orders')}
              >
                <Card style={styles.orderItem}>
                  <View style={styles.orderTop}>
                    <View>
                      <Text style={styles.orderCode}>{ord.code}</Text>
                      <Text style={styles.orderCust}>Khách: {ord.customerName} · {ord.createdAt}</Text>
                    </View>
                    <Text style={styles.orderAmount}>{formatMoney(ord.total)}</Text>
                  </View>
                  <View style={styles.orderDivider} />
                  <View style={styles.orderBottom}>
                    <Text style={styles.orderProduct} numberOfLines={1}>{ord.summary}</Text>
                    <View style={styles.statusPaidBadge}>
                      <Text style={styles.statusPaidText}>Đã thanh toán</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Space.sm,
  },
  storeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.greenSoft,
    borderColor: Colors.greenBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: Colors.green,
  },
  storeStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.greenDeep,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
  },
  statCol: {
    width: '48.5%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Space.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.ink,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
  },
  quickActionCard: {
    width: '48.5%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.brand,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink,
  },
  actionDesc: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  centerBox: {
    paddingVertical: Space.lg,
    alignItems: 'center',
  },
  orderList: {
    gap: Space.sm,
  },
  orderItem: {
    backgroundColor: Colors.white,
    padding: Space.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderCode: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: Colors.brand,
  },
  orderCust: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.ink,
  },
  orderDivider: {
    height: 1,
    backgroundColor: Colors.slate100,
    marginVertical: 8,
  },
  orderBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderProduct: {
    fontSize: 12,
    color: Colors.slate700,
    flex: 1,
    marginRight: 8,
  },
  statusPaidBadge: {
    backgroundColor: Colors.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusPaidText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.greenDeep,
  },
})
