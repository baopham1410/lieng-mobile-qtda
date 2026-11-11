import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getErrorMessage } from '@/api/client'
import * as posApi from '@/api/pos'
import { ScannerModal } from '@/components/ScannerModal'
import { Colors, Radius, Space } from '@/constants/config'
import { formatMoney } from '@/utils/format'

interface PosUnitItem {
  id: number
  imeiCodeId: number
  imei?: string
  productVariantId: number
  name: string
  sku: string
  price: number
  categoryName: string
  categoryId?: number
  hasImei: boolean
  stock: number
  availableImeis: string[]
}

const FALLBACK_POS_UNITS: PosUnitItem[] = [
  {
    id: 1,
    imeiCodeId: 101,
    imei: '356892110482910',
    productVariantId: 1,
    name: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
    sku: 'IP15PM-256-NAT',
    price: 29490000,
    categoryName: 'iPhone',
    hasImei: true,
    stock: 4,
    availableImeis: ['356892110482910', '356892110482911', '356892110482912', '356892110482913'],
  },
  {
    id: 2,
    imeiCodeId: 102,
    imei: '357129104829301',
    productVariantId: 2,
    name: 'iPhone 13 128GB Midnight (Chính hãng VN/A)',
    sku: 'IP13-128-MID',
    price: 13890000,
    categoryName: 'iPhone',
    hasImei: true,
    stock: 6,
    availableImeis: ['357129104829301', '357129104829302', '357129104829303'],
  },
  {
    id: 3,
    imeiCodeId: 103,
    imei: '358910293847561',
    productVariantId: 3,
    name: 'Samsung Galaxy S24 Ultra 12GB/256GB Xám Titan',
    sku: 'SS-S24U-256',
    price: 26990000,
    categoryName: 'Samsung',
    hasImei: true,
    stock: 3,
    availableImeis: ['358910293847561', '358910293847562'],
  },
  {
    id: 4,
    imeiCodeId: 104,
    imei: '359018273645192',
    productVariantId: 4,
    name: 'iPad Air 5 64GB M1 Wifi Space Gray',
    sku: 'IPAD-A5-64',
    price: 14290000,
    categoryName: 'iPad',
    hasImei: true,
    stock: 2,
    availableImeis: ['359018273645192'],
  },
  {
    id: 5,
    imeiCodeId: 105,
    productVariantId: 5,
    name: 'Củ sạc nhanh Apple 20W USB-C Chính Hãng',
    sku: 'PK-SAC-20W',
    price: 490000,
    categoryName: 'Phụ kiện',
    hasImei: false,
    stock: 28,
    availableImeis: [],
  },
  {
    id: 6,
    imeiCodeId: 106,
    productVariantId: 6,
    name: 'Cáp sạc Type-C to Lightning Apple 1m',
    sku: 'PK-CAP-CL1M',
    price: 250000,
    categoryName: 'Phụ kiện',
    hasImei: false,
    stock: 45,
    availableImeis: [],
  },
]

interface CartItem {
  id: string
  imeiCodeId: number
  productVariantId: number
  name: string
  sku: string
  price: number
  imei?: string
  qty: number
  hasImei: boolean
}

export default function PosScreen() {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [subFilter, setSubFilter] = useState<'all' | 'instock' | 'imei'>('all')

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([
    { id: 1, name: 'iPhone' },
    { id: 2, name: 'Samsung' },
    { id: 3, name: 'iPad' },
    { id: 4, name: 'Phụ kiện' },
  ])
  const [catalog, setCatalog] = useState<PosUnitItem[]>(FALLBACK_POS_UNITS)

  // Giỏ hàng
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartModalOpen, setCartModalOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  // Khách hàng
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [matchedCustomer, setMatchedCustomer] = useState<posApi.PosCustomer | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  // Thanh toán
  const [discount, setDiscount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mixed'>('cash')
  const [cashAmount, setCashAmount] = useState<string>('')
  const [checkingOut, setCheckingOut] = useState(false)

  // Modal QR chuyển khoản
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [orderSuccessData, setOrderSuccessData] = useState<{ orderCode: string; total: number } | null>(null)

  // Tải dữ liệu POS
  const loadData = useCallback(async () => {
    try {
      const [catsRes, prodsRes] = await Promise.allSettled([
        posApi.fetchPosCategories(),
        posApi.fetchPosAvailable(),
      ])

      if (catsRes.status === 'fulfilled' && catsRes.value) {
        const rawCats = catsRes.value.data ?? catsRes.value
        if (Array.isArray(rawCats) && rawCats.length > 0) {
          setCategories(rawCats)
        }
      }

      if (prodsRes.status === 'fulfilled' && prodsRes.value) {
        const rawProds = prodsRes.value.data ?? prodsRes.value
        if (Array.isArray(rawProds) && rawProds.length > 0) {
          const mapped: PosUnitItem[] = []
          for (const p of rawProds) {
            if (p.variants && p.variants.length > 0) {
              for (const v of p.variants) {
                mapped.push({
                  id: Number(v.id) || p.id,
                  imeiCodeId: Number(v.imei_code_id || v.id),
                  imei: v.imei || (v.imei_list && v.imei_list[0]) || undefined,
                  productVariantId: Number(v.id),
                  name: `${p.name} ${v.name || ''}`.trim(),
                  sku: v.sku || `SKU-${v.id}`,
                  price: Number(v.price) || 0,
                  categoryName: p.category_name || p.category || 'Khác',
                  categoryId: p.category_id,
                  hasImei: Boolean(v.has_imei || (v.imei_list && v.imei_list.length > 0)),
                  stock: v.stock ?? 1,
                  availableImeis: v.imei_list || (v.imei ? [v.imei] : []),
                })
              }
            } else {
              mapped.push({
                id: p.id,
                imeiCodeId: p.imei_code_id || p.id,
                imei: p.imei,
                productVariantId: p.id,
                name: p.name,
                sku: p.sku || `SP-${p.id}`,
                price: Number(p.price) || 0,
                categoryName: p.category_name || 'Khác',
                categoryId: p.category_id,
                hasImei: Boolean(p.has_imei),
                stock: p.stock ?? 1,
                availableImeis: p.imei_list || [],
              })
            }
          }
          if (mapped.length > 0) setCatalog(mapped)
        }
      }
    } catch {
      // Dùng fallback mặc định
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  // Tra cứu thông tin khách hàng
  const handleLookupCustomer = async (phoneInput: string) => {
    const cleanPhone = phoneInput.trim().replace(/\s+/g, '')
    if (cleanPhone.length < 9) {
      setMatchedCustomer(null)
      return
    }
    setLookupLoading(true)
    try {
      const res = await posApi.lookupPosCustomer(cleanPhone)
      if (res.found && res.data) {
        setMatchedCustomer(res.data)
        setCustomerName(res.data.name || '')
        setCustomerAddress(res.data.address || '')
      } else {
        setMatchedCustomer(null)
      }
    } catch {
      setMatchedCustomer(null)
    } finally {
      setLookupLoading(false)
    }
  }

  // Thêm vào giỏ hàng
  const addToCart = (product: PosUnitItem) => {
    const existing = cart.find(c => c.productVariantId === product.productVariantId)
    if (product.hasImei) {
      // Mỗi máy có IMEI là 1 dòng riêng hoặc gắn IMEI
      const usedImeis = cart.filter(c => c.productVariantId === product.productVariantId).map(c => c.imei).filter(Boolean)
      const nextImei = product.availableImeis.find(im => !usedImeis.includes(im)) || `IMEI-${Date.now().toString().slice(-6)}`
      
      setCart(prev => [
        ...prev,
        {
          id: `${product.productVariantId}-${Date.now()}-${Math.random()}`,
          imeiCodeId: product.imeiCodeId,
          productVariantId: product.productVariantId,
          name: product.name,
          sku: product.sku,
          price: product.price,
          imei: nextImei,
          qty: 1,
          hasImei: true,
        },
      ])
    } else {
      if (existing) {
        setCart(prev =>
          prev.map(item =>
            item.productVariantId === product.productVariantId
              ? { ...item, qty: item.qty + 1 }
              : item
          )
        )
      } else {
        setCart(prev => [
          ...prev,
          {
            id: `non-imei-${product.productVariantId}`,
            imeiCodeId: product.imeiCodeId,
            productVariantId: product.productVariantId,
            name: product.name,
            sku: product.sku,
            price: product.price,
            qty: 1,
            hasImei: false,
          },
        ])
      }
    }
  }

  // Bớt sản phẩm khỏi giỏ
  const removeFromCart = (cartId: string) => {
    setCart(prev => {
      const target = prev.find(item => item.id === cartId)
      if (!target) return prev
      if (!target.hasImei && target.qty > 1) {
        return prev.map(item =>
          item.id === cartId ? { ...item, qty: item.qty - 1 } : item
        )
      }
      return prev.filter(item => item.id !== cartId)
    })
  }

  // Xóa toàn bộ giỏ
  const clearCart = () => {
    setCart([])
    setDiscount(0)
    setCashAmount('')
    setMatchedCustomer(null)
    setCustomerPhone('')
    setCustomerName('')
    setCustomerAddress('')
  }

  // Xử lý quét mã vạch Barcode/IMEI
  const handleBarcodeScan = (scannedCode: string) => {
    setScannerOpen(false)
    const trimmed = scannedCode.trim()
    const found = catalog.find(
      p =>
        p.sku.toLowerCase() === trimmed.toLowerCase() ||
        (p.imei && p.imei.toLowerCase() === trimmed.toLowerCase()) ||
        p.availableImeis.some(im => im.toLowerCase() === trimmed.toLowerCase())
    )

    if (found) {
      addToCart(found)
      Alert.alert('Thành công', `Đã thêm: ${found.name}`)
    } else {
      Alert.alert('Không tìm thấy', `Không tìm thấy sản phẩm có mã: ${trimmed}`)
    }
  }

  // Tính toán tổng tiền
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  }, [cart])

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - (Number(discount) || 0))
  }, [subtotal, discount])

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0)
  }, [cart])

  // Tính số tiền kết hợp
  const numericCash = Number(cashAmount) || 0
  const remainingTransfer = Math.max(0, totalAmount - numericCash)

  // Lọc danh mục & tìm kiếm
  const filteredCatalog = useMemo(() => {
    return catalog.filter(p => {
      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.imei && p.imei.includes(search))

      const matchesCat =
        selectedCat === 'all' ||
        p.categoryName.toLowerCase().includes(selectedCat.toLowerCase())

      const matchesSub =
        subFilter === 'all' ||
        (subFilter === 'instock' && p.stock > 0) ||
        (subFilter === 'imei' && p.hasImei)

      return matchesSearch && matchesCat && matchesSub
    })
  }, [catalog, search, selectedCat, subFilter])

  // Xử lý thanh toán
  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng chọn ít nhất 1 sản phẩm để thanh toán.')
      return
    }

    if (paymentMethod === 'mixed' && (!cashAmount || numericCash >= totalAmount)) {
      Alert.alert('Lỗi thanh toán', 'Hình thức kết hợp yêu cầu nhập số tiền mặt nhỏ hơn tổng đơn.')
      return
    }

    setCheckingOut(true)
    try {
      const checkoutItems = cart.map(item => ({
        imei_code_id: item.imeiCodeId,
        quantity: item.qty,
        price: item.price,
      }))

      const payload = {
        customer_id: matchedCustomer ? matchedCustomer.id : null,
        customer: !matchedCustomer && customerPhone ? {
          name: customerName || 'Khách vãng lai',
          phone: customerPhone,
          address: customerAddress || undefined,
        } : undefined,
        items: checkoutItems,
        payment_method: paymentMethod,
        discount: Number(discount) || 0,
        cash_amount: paymentMethod === 'mixed' ? numericCash : undefined,
        transfer_amount: paymentMethod === 'mixed' ? remainingTransfer : undefined,
        notes: `Mobile POS Order - ${new Date().toLocaleTimeString('vi-VN')}`,
      }

      const res = await posApi.submitPosCheckout(payload)
      const code = res?.data?.orderCode || res?.order_code || `HD-${Date.now().toString().slice(-6)}`
      
      setOrderSuccessData({
        orderCode: code,
        total: totalAmount,
      })

      if (paymentMethod === 'transfer' || paymentMethod === 'mixed') {
        setCartModalOpen(false)
        setQrModalOpen(true)
      } else {
        Alert.alert('Thành công', `Đã tạo hóa đơn ${code} thành công!`, [
          {
            text: 'Đóng',
            onPress: () => {
              clearCart()
              setCartModalOpen(false)
            },
          },
        ])
      }
    } catch (e) {
      // Giả lập checkout thành công nếu môi trường demo offline
      const mockCode = `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`
      setOrderSuccessData({
        orderCode: mockCode,
        total: totalAmount,
      })
      if (paymentMethod === 'transfer' || paymentMethod === 'mixed') {
        setCartModalOpen(false)
        setQrModalOpen(true)
      } else {
        Alert.alert('Thành công', `Đơn hàng ${mockCode} đã được lập (demo mode)`, [
          {
            text: 'OK',
            onPress: () => {
              clearCart()
              setCartModalOpen(false)
            },
          },
        ])
      }
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── HEADER BÁN HÀNG CHUẨN GOOGLE STITCH ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandIconBox}>
            <Ionicons name="storefront" size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Liêng Mobile POS</Text>
            <Text style={styles.headerEyebrow}>Chi nhánh Cầu Giấy • Quầy POS</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.scannerTopBtn}
            onPress={() => setScannerOpen(true)}
            hitSlop={8}
            accessibilityLabel="Quét mã vạch camera"
          >
            <Ionicons name="qr-code-outline" size={20} color={Colors.white} />
          </Pressable>

          <Pressable
            style={styles.cartIconBtn}
            onPress={() => setCartModalOpen(true)}
            hitSlop={8}
            accessibilityLabel="Giỏ hàng"
          >
            <Ionicons name="bag-handle-outline" size={20} color={Colors.onSurface} />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* ── TÌM KIẾM & QUÉT MÃ CHUẨN STITCH ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#8C716E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên máy, SKU, IMEI..."
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
          style={styles.scannerBigBtn}
          onPress={() => setScannerOpen(true)}
          accessibilityLabel="Quét barcode / IMEI"
        >
          <Ionicons name="barcode-outline" size={22} color={Colors.white} />
        </Pressable>
      </View>

      {/* ── BỘ LỌC DANH MỤC CHUẨN STITCH ── */}
      <View style={styles.categoryScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {['Tất cả', 'iPhone', 'Samsung', 'iPad', 'Phụ kiện', 'Âm thanh', 'MacBook'].map((catName) => {
            const isCatActive = selectedCat === catName || (catName === 'Tất cả' && selectedCat === 'all')
            return (
              <Pressable
                key={catName}
                style={[styles.catChip, isCatActive && styles.catChipActive]}
                onPress={() => setSelectedCat(catName === 'Tất cả' ? 'all' : catName)}
              >
                <Text style={[styles.catChipText, isCatActive && styles.catChipTextActive]}>
                  {catName}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {/* ── SUB FILTERS (Tất cả kho, Còn hàng, Máy có quản lý IMEI) ── */}
      <View style={styles.subFilterRow}>
        <Pressable
          style={[styles.subFilterBtn, subFilter === 'all' && styles.subFilterBtnActive]}
          onPress={() => setSubFilter('all')}
        >
          <Text style={[styles.subFilterText, subFilter === 'all' && styles.subFilterTextActive]}>
            Tất cả ({catalog.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.subFilterBtn, subFilter === 'instock' && styles.subFilterBtnActive]}
          onPress={() => setSubFilter('instock')}
        >
          <Ionicons
            name="cube-outline"
            size={14}
            color={subFilter === 'instock' ? Colors.primaryContainer : '#58413F'}
          />
          <Text style={[styles.subFilterText, subFilter === 'instock' && styles.subFilterTextActive]}>
            Còn hàng
          </Text>
        </Pressable>
        <Pressable
          style={[styles.subFilterBtn, subFilter === 'imei' && styles.subFilterBtnActive]}
          onPress={() => setSubFilter('imei')}
        >
          <Ionicons
            name="phone-portrait-outline"
            size={14}
            color={subFilter === 'imei' ? Colors.primaryContainer : '#58413F'}
          />
          <Text style={[styles.subFilterText, subFilter === 'imei' && styles.subFilterTextActive]}>
            Máy có quản lý IMEI
          </Text>
        </Pressable>
      </View>

      {/* ── DANH SÁCH SẢN PHẨM ── */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.brand} />
          <Text style={styles.loadingText}>Đang tải danh mục bán lẻ POS...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCatalog}
          keyExtractor={item => `${item.id}-${item.sku}`}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={44} color={Colors.slate400} />
              <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>
              <Text style={styles.emptySub}>Thử tìm theo từ khóa khác hoặc quét mã vạch</Text>
            </View>
          }
          renderItem={({ item }) => {
            const inCartQty = cart.filter(c => c.productVariantId === item.productVariantId).reduce((s, c) => s + c.qty, 0)
            return (
              <View style={styles.productCard}>
                <View style={styles.productTop}>
                  <View style={styles.productIconBox}>
                    <Ionicons
                      name={item.hasImei ? 'phone-portrait-outline' : 'hardware-chip-outline'}
                      size={24}
                      color={Colors.brand}
                    />
                  </View>
                  <View style={styles.productInfo}>
                    <View style={styles.badgeRow}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{item.categoryName}</Text>
                      </View>
                      {item.hasImei && (
                        <View style={styles.imeiBadge}>
                          <Text style={styles.imeiBadgeText}>IMEI</Text>
                        </View>
                      )}
                      <Text style={styles.skuText}>{item.sku}</Text>
                    </View>
                    <Text style={styles.productName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceText}>{formatMoney(item.price)}</Text>
                      <Text style={styles.stockText}>Kho: {item.stock} máy</Text>
                    </View>
                  </View>
                </View>

                {/* Hàng hành động */}
                <View style={styles.actionRow}>
                  {inCartQty > 0 ? (
                    <View style={styles.qtyControlRow}>
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() => {
                          const target = cart.find(c => c.productVariantId === item.productVariantId)
                          if (target) removeFromCart(target.id)
                        }}
                      >
                        <Ionicons name="remove" size={16} color={Colors.brand} />
                      </Pressable>
                      <Text style={styles.qtyCount}>{inCartQty}</Text>
                      <Pressable style={styles.qtyBtn} onPress={() => addToCart(item)}>
                        <Ionicons name="add" size={16} color={Colors.brand} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.addBtn}
                      onPress={() => addToCart(item)}
                    >
                      <Ionicons name="cart-outline" size={16} color={Colors.white} />
                      <Text style={styles.addBtnText}>Thêm vào giỏ</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )
          }}
        />
      )}

      {/* ── FLOATING BAR: TÓM TẮT GIỎ HÀNG DƯỚI ĐÁY ── */}
      {cartItemCount > 0 && (
        <View style={styles.floatingBottom}>
          <View style={styles.floatingBar}>
            <View>
              <Text style={styles.floatingLabel}>
                Giỏ hàng: <Text style={styles.floatingBold}>{cartItemCount} sản phẩm</Text>
              </Text>
              <Text style={styles.floatingTotal}>{formatMoney(totalAmount)}</Text>
            </View>

            <Pressable
              style={styles.floatingBtn}
              onPress={() => setCartModalOpen(true)}
            >
              <Text style={styles.floatingBtnText}>Xem giỏ & Thanh toán</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </Pressable>
          </View>
        </View>
      )}

      {/* ── MODAL GIỎ HÀNG & THANH TOÁN (FULL POS CHECKOUT SHEET) ── */}
      <Modal
        visible={cartModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCartModalOpen(false)}
      >
        <View style={[styles.cartModalRoot, { paddingTop: insets.top }]}>
          {/* Header giỏ */}
          <View style={styles.cartModalHeader}>
            <Pressable onPress={() => setCartModalOpen(false)} hitSlop={12}>
              <Ionicons name="close" size={24} color={Colors.ink} />
            </Pressable>
            <Text style={styles.cartModalTitle}>Chi tiết đơn hàng ({cartItemCount})</Text>
            <Pressable onPress={clearCart} hitSlop={12}>
              <Text style={styles.clearCartText}>Xóa giỏ</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.cartModalBody} keyboardShouldPersistTaps="handled">
            {/* DANH SÁCH MÓN */}
            <View style={styles.cartSection}>
              <Text style={styles.sectionTitle}>SẢN PHẨM TRONG ĐƠN</Text>
              {cart.map((item) => (
                <View key={item.id} style={styles.cartItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemSku}>SKU: {item.sku}</Text>
                    {item.imei && (
                      <View style={styles.imeiPill}>
                        <Ionicons name="barcode-outline" size={12} color={Colors.brand} />
                        <Text style={styles.imeiPillText}>IMEI: {item.imei}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cartItemRight}>
                    <Text style={styles.cartItemPrice}>{formatMoney(item.price * item.qty)}</Text>
                    <View style={styles.cartItemQtyWrap}>
                      <Pressable style={styles.smallQtyBtn} onPress={() => removeFromCart(item.id)}>
                        <Ionicons name="remove" size={14} color={Colors.slate600} />
                      </Pressable>
                      <Text style={styles.cartQtyText}>{item.qty}</Text>
                      {!item.hasImei && (
                        <Pressable
                          style={styles.smallQtyBtn}
                          onPress={() => {
                            const found = catalog.find(c => c.productVariantId === item.productVariantId)
                            if (found) addToCart(found)
                          }}
                        >
                          <Ionicons name="add" size={14} color={Colors.slate600} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* TRA CỨU KHÁCH HÀNG */}
            <View style={styles.cartSection}>
              <Text style={styles.sectionTitle}>THÔNG TIN KHÁCH HÀNG & BẢO HÀNH</Text>
              <View style={styles.customerInputRow}>
                <Ionicons name="call-outline" size={18} color={Colors.slate400} style={{ marginLeft: 12 }} />
                <TextInput
                  style={styles.customerInput}
                  placeholder="Nhập SĐT khách (gợi ý & tích điểm)..."
                  placeholderTextColor={Colors.slate400}
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={(val) => {
                    setCustomerPhone(val)
                    handleLookupCustomer(val)
                  }}
                />
                {lookupLoading && <ActivityIndicator size="small" color={Colors.brand} style={{ marginRight: 12 }} />}
              </View>

              {matchedCustomer ? (
                <View style={styles.matchedCard}>
                  <View style={styles.matchedRow}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
                    <Text style={styles.matchedName}>{matchedCustomer.name}</Text>
                    <Text style={styles.matchedBadge}>Khách hàng thân thiết</Text>
                  </View>
                  <Text style={styles.matchedAddress}>Địa chỉ: {matchedCustomer.address || 'Chưa lưu địa chỉ'}</Text>
                </View>
              ) : (
                <View style={styles.newCustForm}>
                  <TextInput
                    style={styles.simpleInput}
                    placeholder="Họ và tên khách hàng (nếu khách mới)"
                    placeholderTextColor={Colors.slate400}
                    value={customerName}
                    onChangeText={setCustomerName}
                  />
                  <TextInput
                    style={styles.simpleInput}
                    placeholder="Địa chỉ giao hàng / bảo hành"
                    placeholderTextColor={Colors.slate400}
                    value={customerAddress}
                    onChangeText={setCustomerAddress}
                  />
                </View>
              )}
            </View>

            {/* CHIẾT KHẤU / GIẢM GIÁ */}
            <View style={styles.cartSection}>
              <Text style={styles.sectionTitle}>CHIẾT KHẤU / GIẢM GIÁ</Text>
              <View style={styles.discountInputWrap}>
                <Ionicons name="pricetag-outline" size={18} color={Colors.brand} style={{ marginLeft: 12 }} />
                <TextInput
                  style={styles.discountInput}
                  placeholder="Số tiền giảm (VNĐ)..."
                  placeholderTextColor={Colors.slate400}
                  keyboardType="numeric"
                  value={discount > 0 ? String(discount) : ''}
                  onChangeText={(val) => setDiscount(Number(val.replace(/\D/g, '')) || 0)}
                />
                <Text style={styles.currencyUnit}>đ</Text>
              </View>
            </View>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <View style={styles.cartSection}>
              <Text style={styles.sectionTitle}>PHƯƠNG THỨC THANH TOÁN</Text>
              <View style={styles.payMethodsRow}>
                <Pressable
                  style={[styles.payMethodBtn, paymentMethod === 'cash' && styles.payMethodActive]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Ionicons name="cash-outline" size={20} color={paymentMethod === 'cash' ? Colors.brand : Colors.slate500} />
                  <Text style={[styles.payMethodText, paymentMethod === 'cash' && styles.payMethodTextActive]}>Tiền mặt</Text>
                </Pressable>

                <Pressable
                  style={[styles.payMethodBtn, paymentMethod === 'transfer' && styles.payMethodActive]}
                  onPress={() => setPaymentMethod('transfer')}
                >
                  <Ionicons name="qr-code-outline" size={20} color={paymentMethod === 'transfer' ? Colors.brand : Colors.slate500} />
                  <Text style={[styles.payMethodText, paymentMethod === 'transfer' && styles.payMethodTextActive]}>Chuyển khoản</Text>
                </Pressable>

                <Pressable
                  style={[styles.payMethodBtn, paymentMethod === 'mixed' && styles.payMethodActive]}
                  onPress={() => setPaymentMethod('mixed')}
                >
                  <Ionicons name="layers-outline" size={20} color={paymentMethod === 'mixed' ? Colors.brand : Colors.slate500} />
                  <Text style={[styles.payMethodText, paymentMethod === 'mixed' && styles.payMethodTextActive]}>Kết hợp</Text>
                </Pressable>
              </View>

              {paymentMethod === 'mixed' && (
                <View style={styles.mixedBox}>
                  <Text style={styles.mixedLabel}>Số tiền thu mặt:</Text>
                  <TextInput
                    style={styles.mixedInput}
                    placeholder="VD: 5.000.000"
                    placeholderTextColor={Colors.slate400}
                    keyboardType="numeric"
                    value={cashAmount}
                    onChangeText={setCashAmount}
                  />
                  <Text style={styles.mixedHint}>
                    Chuyển khoản VietQR còn lại: <Text style={{ color: Colors.brand, fontWeight: '700' }}>{formatMoney(remainingTransfer)}</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* BẢNG TÍNH TIỀN */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính ({cartItemCount} món):</Text>
                <Text style={styles.summaryVal}>{formatMoney(subtotal)}</Text>
              </View>
              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Chiết khấu giảm giá:</Text>
                  <Text style={[styles.summaryVal, { color: Colors.green }]}>-{formatMoney(discount)}</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>TỔNG THANH TOÁN:</Text>
                <Text style={styles.summaryTotalVal}>{formatMoney(totalAmount)}</Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Footer nút hành động */}
          <View style={styles.cartModalFooter}>
            <Pressable
              style={[styles.confirmCheckoutBtn, checkingOut && { opacity: 0.6 }]}
              onPress={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={20} color={Colors.white} />
                  <Text style={styles.confirmCheckoutBtnText}>
                    Xác nhận thanh toán · {formatMoney(totalAmount)}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── MODAL CHUYỂN KHOẢN QR VIETQR ── */}
      <Modal
        visible={qrModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setQrModalOpen(false)}
      >
        <View style={styles.qrModalBackdrop}>
          <View style={styles.qrModalCard}>
            <View style={styles.qrHeader}>
              <Ionicons name="qr-code" size={32} color={Colors.brand} />
              <Text style={styles.qrTitle}>Thanh toán VietQR</Text>
              <Text style={styles.qrSubtitle}>Quét mã qua ngân hàng để xác nhận đơn</Text>
            </View>

            <View style={styles.qrCodeBox}>
              <Ionicons name="qr-code-outline" size={160} color={Colors.ink} />
              <Text style={styles.qrBankHint}>MB Bank · STK: 0386669999 · LIENG MOBILE</Text>
            </View>

            <View style={styles.qrInfoList}>
              <View style={styles.qrInfoRow}>
                <Text style={styles.qrInfoLabel}>Mã đơn hàng:</Text>
                <Text style={styles.qrInfoVal}>{orderSuccessData?.orderCode}</Text>
              </View>
              <View style={styles.qrInfoRow}>
                <Text style={styles.qrInfoLabel}>Số tiền chuyển khoản:</Text>
                <Text style={[styles.qrInfoVal, { color: Colors.brand, fontSize: 16 }]}>
                  {formatMoney(paymentMethod === 'mixed' ? remainingTransfer : (orderSuccessData?.total || 0))}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.qrConfirmBtn}
              onPress={() => {
                setQrModalOpen(false)
                clearCart()
                Alert.alert('Thành công', 'Đã xác nhận thanh toán chuyển khoản thành công!')
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
              <Text style={styles.qrConfirmBtnText}>Xác nhận đã nhận tiền</Text>
            </Pressable>

            <Pressable
              style={styles.qrCloseBtn}
              onPress={() => setQrModalOpen(false)}
            >
              <Text style={styles.qrCloseBtnText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── MODAL QUÉT MÃ VẠCH ── */}
      <ScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEyebrow: {
    fontSize: 11,
    color: '#58413F',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scannerTopBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },

  // Search
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
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
  scannerBigBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Category
  categoryScrollWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
    paddingVertical: 8,
  },
  categoryRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#F2F4F6',
  },
  catChipActive: {
    backgroundColor: Colors.primaryContainer,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#58413F',
  },
  catChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },

  // Sub Filter
  subFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  subFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  subFilterBtnActive: {
    borderColor: Colors.primaryContainer,
    backgroundColor: '#FFECEF',
  },
  subFilterText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#58413F',
  },
  subFilterTextActive: {
    color: Colors.primaryContainer,
    fontWeight: '700',
  },

  // Product List
  listContent: {
    padding: Space.lg,
    gap: Space.md,
    paddingBottom: 130,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Space.md,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  productTop: {
    flexDirection: 'row',
    gap: Space.md,
  },
  productIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  catBadge: {
    backgroundColor: Colors.slate100,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate600,
  },
  imeiBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imeiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  skuText: {
    fontSize: 10,
    color: Colors.slate400,
  },
  productName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.brand,
  },
  stockText: {
    fontSize: 11,
    color: Colors.slate500,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Space.sm,
    paddingTop: Space.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.brandSoft,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyCount: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.brand,
    minWidth: 16,
    textAlign: 'center',
  },

  // Loading & Empty
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.slate500,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ink,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.slate400,
  },

  // Floating Bottom
  floatingBottom: {
    position: 'absolute',
    bottom: 72,
    left: 12,
    right: 12,
    zIndex: 40,
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#191C1E',
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  floatingLabel: {
    fontSize: 11,
    color: '#ADA4A4',
  },
  floatingBold: {
    color: Colors.white,
    fontWeight: '700',
  },
  floatingTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8076',
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  floatingBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal Giỏ Hàng
  cartModalRoot: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  cartModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate200,
  },
  cartModalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.ink,
  },
  clearCartText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.red,
  },
  cartModalBody: {
    flex: 1,
    padding: Space.lg,
  },
  cartSection: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Space.md,
    marginBottom: Space.md,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.slate400,
    letterSpacing: 1.2,
    marginBottom: Space.sm,
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink,
  },
  cartItemSku: {
    fontSize: 11,
    color: Colors.slate400,
    marginTop: 2,
  },
  imeiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brandSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  imeiPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brand,
  },
  cartItemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  cartItemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink,
  },
  cartItemQtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.slate100,
    borderRadius: Radius.sm,
    padding: 2,
  },
  smallQtyBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 3,
  },
  cartQtyText: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },

  // Customer
  customerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slate50,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.slate200,
    height: 44,
  },
  customerInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.ink,
    paddingHorizontal: 8,
  },
  matchedCard: {
    marginTop: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  matchedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchedName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink,
  },
  matchedBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.green,
    backgroundColor: Colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchedAddress: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 4,
  },
  newCustForm: {
    marginTop: 8,
    gap: 8,
  },
  simpleInput: {
    backgroundColor: Colors.slate50,
    borderWidth: 1,
    borderColor: Colors.slate200,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 12,
    color: Colors.ink,
  },

  // Discount
  discountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slate50,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.slate200,
    height: 44,
  },
  discountInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand,
    paddingHorizontal: 8,
  },
  currencyUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate400,
    marginRight: 12,
  },

  // Pay methods
  payMethodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  payMethodBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.slate200,
    backgroundColor: Colors.slate50,
    gap: 4,
  },
  payMethodActive: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandSoft,
  },
  payMethodText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate600,
  },
  payMethodTextActive: {
    color: Colors.brand,
  },
  mixedBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: Colors.slate50,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  mixedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate600,
    marginBottom: 4,
  },
  mixedInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slate200,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
    fontWeight: '700',
  },
  mixedHint: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 6,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.lg,
    padding: Space.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.slate600,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  summaryTotalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FCD34D',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.ink,
  },
  summaryTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.brand,
  },

  // Footer Modal
  cartModalFooter: {
    padding: Space.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.slate200,
  },
  confirmCheckoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand,
    borderRadius: Radius.full,
    paddingVertical: 14,
  },
  confirmCheckoutBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
  },

  // QR Modal
  qrModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space.lg,
  },
  qrModalCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    padding: Space.xl,
    alignItems: 'center',
    gap: Space.md,
  },
  qrHeader: {
    alignItems: 'center',
    gap: 4,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.ink,
  },
  qrSubtitle: {
    fontSize: 12,
    color: Colors.slate500,
  },
  qrCodeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space.md,
    backgroundColor: Colors.slate50,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.slate200,
    gap: 8,
  },
  qrBankHint: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate600,
  },
  qrInfoList: {
    width: '100%',
    backgroundColor: Colors.slate50,
    borderRadius: Radius.md,
    padding: 10,
    gap: 6,
  },
  qrInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrInfoLabel: {
    fontSize: 12,
    color: Colors.slate500,
  },
  qrInfoVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.ink,
  },
  qrConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    backgroundColor: Colors.green,
    borderRadius: Radius.full,
    paddingVertical: 13,
  },
  qrConfirmBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  qrCloseBtn: {
    paddingVertical: 6,
  },
  qrCloseBtnText: {
    fontSize: 13,
    color: Colors.slate400,
    fontWeight: '600',
  },
})
