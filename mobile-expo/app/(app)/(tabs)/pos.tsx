import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Card, Chip, Eyebrow, Muted, PrimaryButton, ScreenTitle } from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { formatMoney } from '@/utils/format'

interface MockProduct {
  id: number
  name: string
  sku: string
  price: number
  category: string
  stockCount: number
  hasImei: boolean
}

const DEMO_PRODUCTS: MockProduct[] = [
  { id: 1, name: 'iPhone 15 Pro Max 256GB', sku: 'IP15PM-256', price: 29490000, category: 'iphone', stockCount: 5, hasImei: true },
  { id: 2, name: 'iPhone 13 128GB (Chính hãng)', sku: 'IP13-128', price: 13890000, category: 'iphone', stockCount: 12, hasImei: true },
  { id: 3, name: 'Samsung Galaxy S24 Ultra', sku: 'SS-S24U-256', price: 26990000, category: 'samsung', stockCount: 4, hasImei: true },
  { id: 4, name: 'iPad Air 5 64GB M1 Wifi', sku: 'IPAD-A5-64', price: 14290000, category: 'ipad', stockCount: 3, hasImei: true },
  { id: 5, name: 'Củ sạc nhanh Apple 20W USB-C', sku: 'PK-SAC-20W', price: 490000, category: 'accessory', stockCount: 35, hasImei: false },
  { id: 6, name: 'Cáp sạc Type-C to Lightning 1m', sku: 'PK-CAP-CL1M', price: 250000, category: 'accessory', stockCount: 48, hasImei: false },
  { id: 7, name: 'Ốp lưng MagSafe iPhone 15', sku: 'PK-OP-MAG15', price: 350000, category: 'accessory', stockCount: 20, hasImei: false },
]

export default function PosScreen() {
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [cart, setCart] = useState<{ product: MockProduct; qty: number }[]>([])
  const [cartModal, setCartModal] = useState(false)
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer'>('cash')

  const filtered = DEMO_PRODUCTS.filter((p) => {
    const matchCat = category === 'all' || p.category === category
    const matchSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0)

  const addToCart = (product: MockProduct) => {
    setCart((prev) => {
      const exist = prev.find((i) => i.product.id === product.id)
      if (exist) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, { product, qty: 1 }]
    })
  }

  const handleCheckout = () => {
    Alert.alert(
      'Thanh toán POS thành công!',
      `Đã tạo đơn hàng POS trị giá ${formatMoney(cartTotal)} qua hình thức ${payMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}.`,
      [
        {
          text: 'Xong',
          onPress: () => {
            setCart([])
            setCartModal(false)
          },
        },
      ]
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Eyebrow>BÁN HÀNG TẠI QUẦY (POS)</Eyebrow>
          <ScreenTitle>Điện thoại & Phụ kiện</ScreenTitle>
          <Muted>Chọn sản phẩm, quản lý số IMEI và xuất hóa đơn</Muted>
        </View>

        {/* Nút giỏ hàng nổi */}
        <Pressable
          onPress={() => setCartModal(true)}
          style={({ pressed }) => [styles.cartBtn, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="cart" size={20} color={Colors.white} />
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Ô tìm kiếm */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.slate400} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên máy, model, SKU..."
          placeholderTextColor={Colors.slate400}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Colors.slate400} />
          </Pressable>
        )}
      </View>

      {/* Chip danh mục */}
      <View style={styles.catRow}>
        <Chip label="Tất cả" active={category === 'all'} onPress={() => setCategory('all')} />
        <Chip label="iPhone" active={category === 'iphone'} onPress={() => setCategory('iphone')} />
        <Chip label="Samsung" active={category === 'samsung'} onPress={() => setCategory('samsung')} />
        <Chip label="iPad" active={category === 'ipad'} onPress={() => setCategory('ipad')} />
        <Chip label="Phụ kiện" active={category === 'accessory'} onPress={() => setCategory('accessory')} />
      </View>

      {/* Lưới sản phẩm */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
        renderItem={({ item }) => (
          <Card style={styles.productCard}>
            <View style={styles.productTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productSku}>SKU: {item.sku}</Text>
              </View>
              {item.hasImei && (
                <View style={styles.imeiTag}>
                  <Text style={styles.imeiTagText}>IMEI</Text>
                </View>
              )}
            </View>

            <View style={styles.productBottom}>
              <View>
                <Text style={styles.productPrice}>{formatMoney(item.price)}</Text>
                <Text style={styles.stockText}>Còn lại: {item.stockCount} máy</Text>
              </View>

              <Pressable
                onPress={() => addToCart(item)}
                style={({ pressed }) => [styles.addCartBtn, pressed && { opacity: 0.8 }]}
              >
                <Ionicons name="add" size={18} color={Colors.white} />
                <Text style={styles.addCartText}>Chọn</Text>
              </Pressable>
            </View>
          </Card>
        )}
      />

      {/* Thanh Bar giỏ hàng nhanh ở đáy nếu có món */}
      {cartItemCount > 0 && (
        <View style={[styles.bottomBar, { bottom: insets.bottom + 68 }]}>
          <View>
            <Text style={styles.bottomBarCount}>{cartItemCount} món trong giỏ</Text>
            <Text style={styles.bottomBarTotal}>{formatMoney(cartTotal)}</Text>
          </View>
          <PrimaryButton
            label="Xem giỏ & Thu tiền"
            size="sm"
            tone="green"
            icon="arrow-forward"
            onPress={() => setCartModal(true)}
          />
        </View>
      )}

      {/* Modal Giỏ hàng & Thanh toán */}
      <Modal visible={cartModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Giỏ hàng POS ({cartItemCount})</Text>
              <Pressable onPress={() => setCartModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.slate} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {cart.map((item) => (
                <View key={item.product.id} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartRowName}>{item.product.name}</Text>
                    <Text style={styles.cartRowPrice}>{formatMoney(item.product.price)} x {item.qty}</Text>
                  </View>
                  <Text style={styles.cartRowTotal}>{formatMoney(item.product.price * item.qty)}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.paymentSection}>
              <Text style={styles.payMethodLabel}>Phương thức thanh toán:</Text>
              <View style={styles.payMethodRow}>
                <Chip
                  label="Tiền mặt (TM)"
                  active={payMethod === 'cash'}
                  onPress={() => setPayMethod('cash')}
                />
                <Chip
                  label="Chuyển khoản (CK)"
                  active={payMethod === 'transfer'}
                  onPress={() => setPayMethod('transfer')}
                />
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.totalValue}>{formatMoney(cartTotal)}</Text>
              </View>

              <PrimaryButton
                label="Xác nhận & Xuất hóa đơn"
                tone="red"
                icon="checkmark-circle-outline"
                onPress={handleCheckout}
              />
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
    backgroundColor: Colors.canvas,
  },
  header: {
    paddingHorizontal: Space.lg,
    paddingTop: Space.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.amber,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.white,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Space.lg,
    marginTop: Space.sm,
    paddingHorizontal: 14,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.ink,
    padding: 0,
  },
  catRow: {
    flexDirection: 'row',
    paddingHorizontal: Space.lg,
    marginVertical: Space.sm,
    gap: 6,
  },
  listContent: {
    paddingHorizontal: Space.lg,
    gap: Space.sm,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
  },
  productSku: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.slate400,
    marginTop: 2,
  },
  imeiTag: {
    backgroundColor: Colors.amber100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  imeiTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.amber900,
  },
  productBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.redDeep,
  },
  stockText: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.greenDeep,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  addCartText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  bottomBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: Colors.ink,
    borderRadius: Radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomBarCount: {
    fontSize: 11,
    color: Colors.slate400,
    fontWeight: '600',
  },
  bottomBarTotal: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.white,
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
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.ink,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate50,
  },
  cartRowName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  cartRowPrice: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  cartRowTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
  },
  paymentSection: {
    marginTop: Space.md,
    gap: Space.sm,
  },
  payMethodLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate,
  },
  payMethodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.redDeep,
  },
})
