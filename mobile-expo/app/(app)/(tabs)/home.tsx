import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Card, Eyebrow, Muted, ScreenTitle, StatCard } from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { formatMoney } from '@/utils/format'

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 800)
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
              value={formatMoney(18500000)}
              icon="income"
              valueColor={Colors.greenDeep}
              hint="3 đơn bán lẻ"
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              label="Đơn hoàn tất"
              value="3 đơn"
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
              value="2 máy"
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
              value="1 máy"
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
            <Text style={styles.actionDesc}>Định giá máy thu đổi</Text>
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
            <Text style={styles.actionDesc}>Module Quán & Ghi chi cũ</Text>
          </Pressable>
        </View>

        {/* Đơn hàng gần đây */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đơn hàng gần đây trong ca</Text>
          <Pressable onPress={() => router.push('/(app)/(tabs)/orders')}>
            <Text style={styles.seeAllText}>Xem tất cả →</Text>
          </Pressable>
        </View>

        <View style={styles.orderList}>
          <Card style={styles.orderItem}>
            <View style={styles.orderTop}>
              <View>
                <Text style={styles.orderCode}>#HD-20261109-003</Text>
                <Text style={styles.orderCust}>Khách lẻ: Anh Minh (0982***123)</Text>
              </View>
              <Text style={styles.orderAmount}>{formatMoney(15990000)}</Text>
            </View>
            <View style={styles.orderDivider} />
            <View style={styles.orderBottom}>
              <Text style={styles.orderProduct}>iPhone 13 128GB (IMEI: 356891***012)</Text>
              <View style={styles.statusPaidBadge}>
                <Text style={styles.statusPaidText}>Đã thanh toán</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.orderItem}>
            <View style={styles.orderTop}>
              <View>
                <Text style={styles.orderCode}>#HD-20261109-002</Text>
                <Text style={styles.orderCust}>Khách lẻ: Chị Hạnh</Text>
              </View>
              <Text style={styles.orderAmount}>{formatMoney(2510000)}</Text>
            </View>
            <View style={styles.orderDivider} />
            <View style={styles.orderBottom}>
              <Text style={styles.orderProduct}>Củ sạc 20W + Tai nghe Type-C</Text>
              <View style={styles.statusPaidBadge}>
                <Text style={styles.statusPaidText}>Đã thanh toán</Text>
              </View>
            </View>
          </Card>
        </View>
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
    fontSize: 12,
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
