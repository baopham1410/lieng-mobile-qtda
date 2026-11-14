import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { api } from '@/api/client'
import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { getProductImageSource } from '@/utils/productImages'

interface CatalogItem {
  id: number
  name: string
  category: 'iphone' | 'samsung' | 'ipad' | 'mac' | 'accessory' | 'other'
  subtitle: string
  price: number
  oldPrice: number
  imageKey: string
  specs: {
    screen: string
    chip: string
    ram: string
    storage: string
    battery: string
    warranty: string
  }
}

export interface HeldItemInfo {
  id: number
  name: string
  refCode: string
  date: string
  status: string
}

const CATALOG_DATA: CatalogItem[] = [
  {
    id: 1,
    name: 'iPhone 15 Pro Max',
    category: 'iphone',
    subtitle: 'Titan Tự Nhiên · 256GB · Mới 100%',
    price: 29990000,
    oldPrice: 34990000,
    imageKey: 'iphone-15.jpg',
    specs: {
      screen: '6.7" Super Retina XDR OLED 120Hz',
      chip: 'Apple A17 Pro (3nm)',
      ram: '8 GB',
      storage: '256 GB NVMe',
      battery: '4.422 mAh · Sạc nhanh 20W',
      warranty: '12 tháng 1 đổi 1 chính hãng',
    },
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24 Ultra',
    category: 'samsung',
    subtitle: 'Titan Gray · 12GB/256GB · Galaxy AI',
    price: 25490000,
    oldPrice: 29990000,
    imageKey: 'samsung-s24.jpg',
    specs: {
      screen: '6.8" Dynamic AMOLED 2X 120Hz',
      chip: 'Snapdragon 8 Gen 3 for Galaxy',
      ram: '12 GB',
      storage: '256 GB UFS 4.0',
      battery: '5.000 mAh · Sạc siêu nhanh 45W',
      warranty: '12 tháng chính hãng SSVN',
    },
  },
  {
    id: 3,
    name: 'iPad Air 11" M2 (2024)',
    category: 'ipad',
    subtitle: 'Space Gray · 128GB Wi-Fi',
    price: 15490000,
    oldPrice: 16990000,
    imageKey: 'ipad-air.jpg',
    specs: {
      screen: '11" Liquid Retina IPS',
      chip: 'Apple M2 8-core CPU / 10-core GPU',
      ram: '8 GB',
      storage: '128 GB',
      battery: '28.93 Wh · Hỗ trợ Apple Pencil Pro',
      warranty: '12 tháng chính hãng',
    },
  },
  {
    id: 4,
    name: 'MacBook Air 13.6" M2',
    category: 'mac',
    subtitle: 'Midnight · 8GB/256GB SSD',
    price: 23990000,
    oldPrice: 27990000,
    imageKey: 'macbook-air-m2.jpg',
    specs: {
      screen: '13.6" Liquid Retina 500 nits',
      chip: 'Apple M2 8-core',
      ram: '8 GB Unified Memory',
      storage: '256 GB SSD',
      battery: '52.6 Wh · Pin tới 18 giờ',
      warranty: '12 tháng chính hãng',
    },
  },
  {
    id: 5,
    name: 'AirPods Pro 2 USB-C',
    category: 'accessory',
    subtitle: 'Hộp sạc MagSafe USB-C · ANC 2X',
    price: 5390000,
    oldPrice: 6190000,
    imageKey: 'airpods-pro.jpg',
    specs: {
      screen: 'Không có màn hình',
      chip: 'Apple H2 headphone chip',
      ram: 'N/A',
      storage: 'N/A',
      battery: 'Tới 30 giờ kèm hộp sạc',
      warranty: '12 tháng chính hãng',
    },
  },
  {
    id: 6,
    name: 'Xiaomi 14 5G Leica',
    category: 'other',
    subtitle: 'Đen nhám · 12GB/256GB · Camera Leica',
    price: 18990000,
    oldPrice: 22990000,
    imageKey: 'xiaomi-14.jpg',
    specs: {
      screen: '6.36" LTPO OLED 1.5K 120Hz',
      chip: 'Snapdragon 8 Gen 3',
      ram: '12 GB LPDDR5X',
      storage: '256 GB UFS 4.0',
      battery: '4.610 mAh · Sạc 90W HyperCharge',
      warranty: '18 tháng chính hãng DGW',
    },
  },
  {
    id: 7,
    name: 'Củ sạc nhanh GaN 65W 3 Cổng',
    category: 'accessory',
    subtitle: '2 Type-C + 1 USB-A · Siêu nhỏ gọn',
    price: 490000,
    oldPrice: 690000,
    imageKey: 'gan-charger.jpg',
    specs: {
      screen: 'N/A',
      chip: 'Công nghệ GaN III',
      ram: 'N/A',
      storage: 'N/A',
      battery: 'Hỗ trợ PD 3.0, QC 4.0+',
      warranty: '12 tháng 1 đổi 1',
    },
  },
  {
    id: 8,
    name: 'Cáp sạc Type-C to Type-C 100W',
    category: 'accessory',
    subtitle: 'Dây dù chống đứt · Chiều dài 1.2m',
    price: 180000,
    oldPrice: 250000,
    imageKey: 'cable-usbc.jpg',
    specs: {
      screen: 'N/A',
      chip: 'E-Marker chip thông minh',
      ram: 'N/A',
      storage: 'N/A',
      battery: 'Chịu tải tới 100W / 5A',
      warranty: '12 tháng 1 đổi 1',
    },
  },
]

export default function CustomerCatalogScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, customer } = useAuth()
  const customerPhone = customer?.phone || user?.phone || '0383435600'
  const customerName = customer?.name || user?.name || ''

  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null)
  const [catalogList, setCatalogList] = useState<CatalogItem[]>(CATALOG_DATA)
  const [heldItems, setHeldItems] = useState<HeldItemInfo[]>([])

  // Form giữ máy
  const [inquiryName, setInquiryName] = useState(customerName)
  const [inquiryPhone, setInquiryPhone] = useState(customerPhone)
  const [inquiryNote, setInquiryNote] = useState('')
  const [submittingInquiry, setSubmittingInquiry] = useState(false)

  // 1. Tải danh sách đã giữ từ AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('lieng_held_items').then((stored) => {
      if (stored) {
        try {
          setHeldItems(JSON.parse(stored))
        } catch {}
      }
    })
  }, [])

  // 2. Đồng bộ các yêu cầu giữ máy thật từ database Neon
  useEffect(() => {
    if (!customerPhone) return
    api.get(`/customer/my-inquiries?phone=${encodeURIComponent(customerPhone)}`)
      .then((res) => {
        const inqs = res.data?.data
        if (Array.isArray(inqs) && inqs.length > 0) {
          const fromBackend: HeldItemInfo[] = inqs.map((q: any) => ({
            id: q.product_id || q.id,
            name: q.product_name || 'Thiết bị',
            refCode: q.code || ('TV-' + q.id),
            date: q.created_at ? new Date(q.created_at).toLocaleDateString('vi-VN') : 'Hôm nay',
            status: q.status || 'ringing',
          }))
          setHeldItems((prev) => {
            const map = new Map<string, HeldItemInfo>()
            prev.forEach((p) => map.set(p.name.toLowerCase().trim(), p))
            fromBackend.forEach((b) => map.set(b.name.toLowerCase().trim(), b))
            const merged = Array.from(map.values())
            AsyncStorage.setItem('lieng_held_items', JSON.stringify(merged))
            return merged
          })
        }
      })
      .catch(() => {})
  }, [customerPhone])

  useEffect(() => {
    let isMounted = true
    api.get('/store/catalog')
      .then((res) => {
        const products = res.data?.data?.products
        if (Array.isArray(products) && products.length > 0 && isMounted) {
          const mapped: CatalogItem[] = products.map((p: any, idx: number) => {
            let cat: CatalogItem['category'] = 'other'
            const catLower = (p.category || '').toLowerCase()
            const nameLower = (p.name || '').toLowerCase()
            if (nameLower.includes('iphone') || catLower.includes('apple') || catLower === 'phone') cat = 'iphone'
            if (nameLower.includes('galaxy') || nameLower.includes('samsung')) cat = 'samsung'
            if (nameLower.includes('ipad') || catLower === 'tablet') cat = 'ipad'
            if (nameLower.includes('macbook') || catLower === 'laptop') cat = 'mac'
            if (catLower === 'accessory' || nameLower.includes('sạc') || nameLower.includes('cáp') || nameLower.includes('tai nghe') || nameLower.includes('ốp')) cat = 'accessory'

            return {
              id: p.productId || idx + 1,
              name: p.name,
              category: cat,
              subtitle: `${p.brand || 'Chính hãng'} · ${p.badge || 'Sẵn hàng'}`,
              price: Number(p.price) || 0,
              oldPrice: Number(p.oldPrice) || Math.round(Number(p.price) * 1.1),
              imageKey: p.image || 'iphone-15.jpg',
              specs: {
                screen: p.specs?.[0] || '6.7" OLED',
                chip: p.specs?.[1] || 'Chip hiệu năng cao',
                ram: '8 GB',
                storage: p.specs?.[0] || '128 GB',
                battery: 'Pin chuẩn · Sạc nhanh',
                warranty: `${p.warrantyMonths || 12} tháng chính hãng`,
              },
            }
          })
          setCatalogList(mapped)
        }
      })
      .catch((err) => {
        console.warn('API store catalog fetch error, fallback to CATALOG_DATA:', err?.message)
      })
    return () => { isMounted = false }
  }, [])

  const dynamicCategoryTabs = [
    { id: 'all', label: 'Tất cả' },
    ...(heldItems.length > 0 ? [{ id: 'held', label: `Đang giữ (${heldItems.length})` }] : []),
    { id: 'iphone', label: 'iPhone' },
    { id: 'samsung', label: 'Samsung' },
    { id: 'ipad', label: 'iPad' },
    { id: 'mac', label: 'MacBook' },
    { id: 'accessory', label: 'Phụ kiện' },
  ]

  const filteredList = catalogList.filter((item) => {
    if (selectedCat === 'held') {
      return heldItems.some(
        (h) =>
          h.id === item.id ||
          h.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(h.name.toLowerCase())
      )
    }
    const matchCat = selectedCat === 'all' || item.category === selectedCat
    const matchText =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchText
  })

  const handleOpenDetail = (item: CatalogItem) => {
    setSelectedProduct(item)
    setInquiryName(customerName || user?.name || '')
    setInquiryPhone(customerPhone || user?.phone || '')
    setInquiryNote('')
  }

  const handleSendInquiry = async () => {
    if (!inquiryPhone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại để cửa hàng liên hệ giữ hàng.')
      return
    }
    setSubmittingInquiry(true)
    const modelName = selectedProduct?.name || 'máy'
    const isAccessory = selectedProduct?.category === 'accessory'
    try {
      const res = await api.post('/store/inquiry', {
        name: inquiryName.trim() || customerName || 'Quý khách',
        phone: inquiryPhone.trim(),
        product_name: modelName,
        topic: isAccessory ? 'Giữ phụ kiện tại quầy' : 'Giữ máy tại quầy',
        items: [
          {
            productId: (selectedProduct as any)?.productId || selectedProduct?.id || 1,
            qty: 1,
          },
        ],
        note: inquiryNote.trim() || undefined,
      })
      const refCode = res.data?.data?.reference || ('TV-' + Date.now().toString().slice(-6))
      const newHeldItem: HeldItemInfo = {
        id: selectedProduct?.id || Date.now(),
        name: selectedProduct?.name || 'Sản phẩm',
        refCode,
        date: new Date().toLocaleDateString('vi-VN'),
        status: 'ringing',
      }
      const updated = [...heldItems.filter((h) => h.id !== newHeldItem.id && h.name !== newHeldItem.name), newHeldItem]
      setHeldItems(updated)
      await AsyncStorage.setItem('lieng_held_items', JSON.stringify(updated))
      setSelectedProduct(null)
      Alert.alert(
        isAccessory ? 'Đã đặt giữ sản phẩm 🎉' : 'Đã đặt giữ máy 🎉',
        `Lieng Mobile đã tiếp nhận yêu cầu giữ "${modelName}".\nMã phiếu giữ: ${refCode}.\nCửa hàng giữ hàng cho bạn trong 24h. Chuyên viên sẽ gọi xác nhận đến SĐT ${inquiryPhone}!`,
      )
    } catch (err: any) {
      console.warn('API inquiry error, fallback alert:', err)
      const refCode = 'TV-' + Date.now().toString().slice(-6)
      const newHeldItem: HeldItemInfo = {
        id: selectedProduct?.id || Date.now(),
        name: selectedProduct?.name || 'Sản phẩm',
        refCode,
        date: new Date().toLocaleDateString('vi-VN'),
        status: 'ringing',
      }
      const updated = [...heldItems.filter((h) => h.id !== newHeldItem.id && h.name !== newHeldItem.name), newHeldItem]
      setHeldItems(updated)
      await AsyncStorage.setItem('lieng_held_items', JSON.stringify(updated))
      setSelectedProduct(null)
      Alert.alert(
        isAccessory ? 'Đã đặt giữ sản phẩm 🎉' : 'Đã đặt giữ máy 🎉',
        `Lieng Mobile đã tiếp nhận yêu cầu giữ "${modelName}". Mã phiếu giữ: ${refCode}.\nChuyên viên tư vấn sẽ liên hệ SĐT ${inquiryPhone} trong ít phút!`,
      )
    } finally {
      setSubmittingInquiry(false)
    }
  }

  const handleCancelHold = async (product: CatalogItem) => {
    Alert.alert(
      'Hủy phiếu giữ hàng',
      `Bạn có chắc chắn muốn hủy giữ "${product.name}"?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy giữ hàng',
          style: 'destructive',
          onPress: async () => {
            const updated = heldItems.filter(
              (h) => h.id !== product.id && !h.name.toLowerCase().includes(product.name.toLowerCase())
            )
            setHeldItems(updated)
            await AsyncStorage.setItem('lieng_held_items', JSON.stringify(updated))
            setSelectedProduct(null)
            Alert.alert('Thành công', 'Đã hủy phiếu giữ hàng.')
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* ── Header Tìm Kiếm ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Text style={styles.headerTitle}>Cửa Hàng Lieng Mobile</Text>
        <Text style={styles.headerSub}>Sản phẩm chính hãng · Giá tốt mỗi ngày</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên máy, model, phụ kiện..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>

        {/* Categories Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {dynamicCategoryTabs.map((cat) => {
            const active = selectedCat === cat.id
            const isHeldTab = cat.id === 'held'
            return (
              <Pressable
                key={cat.id}
                style={[
                  styles.catChip,
                  active && styles.catChipActive,
                  isHeldTab && styles.catChipHeld,
                  isHeldTab && active && styles.catChipHeldActive,
                ]}
                onPress={() => setSelectedCat(cat.id)}
              >
                {isHeldTab ? (
                  <Ionicons name="checkmark-circle" size={14} color={active ? '#FFFFFF' : '#15803D'} />
                ) : null}
                <Text
                  style={[
                    styles.catChipText,
                    active && styles.catChipTextActive,
                    isHeldTab && styles.catChipHeldText,
                    isHeldTab && active && styles.catChipHeldTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {/* ── Product Grid ── */}
      <ScrollView
        contentContainerStyle={[styles.gridWrap, { paddingBottom: insets.bottom + 85 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.resultCountText}>
          Hiển thị {filteredList.length} sản phẩm phù hợp
        </Text>

        <View style={styles.grid}>
          {filteredList.map((item) => {
            const isHeld = heldItems.some(
              (h) =>
                h.id === item.id ||
                h.name.toLowerCase().includes(item.name.toLowerCase()) ||
                item.name.toLowerCase().includes(h.name.toLowerCase())
            )
            const isAccessory = item.category === 'accessory'
            const actionText = isHeld
              ? '✓ Đã giữ tại quầy'
              : (isAccessory ? 'Xem & Giữ hàng' : 'Xem & Giữ máy')

            return (
              <Pressable
                key={item.id}
                style={[styles.productCard, isHeld && styles.productCardHeld]}
                onPress={() => handleOpenDetail(item)}
              >
                {isHeld ? (
                  <View style={styles.heldBadge}>
                    <Ionicons name="checkmark-circle" size={11} color="#FFFFFF" />
                    <Text style={styles.heldBadgeText}>ĐÃ GIỮ 24H</Text>
                  </View>
                ) : null}

                <Image
                  source={getProductImageSource(item.imageKey, item.name)}
                  style={styles.productImg}
                  resizeMode="contain"
                />

                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.productSub} numberOfLines={1}>
                  {item.subtitle}
                </Text>

                <View style={styles.priceWrap}>
                  <Text style={styles.priceNum}>
                    {item.price.toLocaleString('vi-VN')} đ
                  </Text>
                  <Text style={styles.priceOld}>
                    {item.oldPrice.toLocaleString('vi-VN')} đ
                  </Text>
                </View>

                <View style={[styles.viewDetailBtn, isHeld && styles.viewDetailBtnHeld]}>
                  <Text style={[styles.viewDetailText, isHeld && styles.viewDetailTextHeld]}>
                    {actionText}
                  </Text>
                  <Ionicons
                    name={isHeld ? 'checkmark' : 'arrow-forward'}
                    size={12}
                    color={isHeld ? '#FFFFFF' : '#7A0C10'}
                  />
                </View>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>

      {/* ── Modal Chi Tiết Sản Phẩm & Giữ Máy ── */}
      <Modal visible={!!selectedProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle} numberOfLines={1}>
                {selectedProduct?.name}
              </Text>
              <Pressable onPress={() => setSelectedProduct(null)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedProduct ? (
                <>
                  <Image
                    source={getProductImageSource(
                      selectedProduct.imageKey,
                      selectedProduct.name,
                    )}
                    style={styles.detailBigImg}
                    resizeMode="contain"
                  />

                  <View style={styles.priceBanner}>
                    <View>
                      <Text style={styles.detailPriceNum}>
                        {selectedProduct.price.toLocaleString('vi-VN')} đ
                      </Text>
                      <Text style={styles.detailPriceOld}>
                        Giá gốc: {selectedProduct.oldPrice.toLocaleString('vi-VN')} đ
                      </Text>
                    </View>
                    <View style={styles.warrantyBadge}>
                      <Ionicons name="shield-checkmark" size={14} color="#059669" />
                      <Text style={styles.warrantyBadgeText}>Bảo hành chính hãng</Text>
                    </View>
                  </View>

                  {/* Bảng thông số */}
                  <View style={styles.specsBox}>
                    <Text style={styles.specsTitle}>Thông số kỹ thuật nổi bật</Text>
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Màn hình:</Text>
                      <Text style={styles.specVal}>{selectedProduct.specs.screen}</Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Vi xử lý:</Text>
                      <Text style={styles.specVal}>{selectedProduct.specs.chip}</Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>RAM / Bộ nhớ:</Text>
                      <Text style={styles.specVal}>
                        {selectedProduct.specs.ram} · {selectedProduct.specs.storage}
                      </Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Pin & Sạc:</Text>
                      <Text style={styles.specVal}>{selectedProduct.specs.battery}</Text>
                    </View>
                  </View>

                  {/* Deep link Thu cũ */}
                  <Pressable
                    style={styles.tradeInBox}
                    onPress={() => {
                      setSelectedProduct(null)
                      router.replace('/(customer)/(tabs)/trade-in' as any)
                    }}
                  >
                    <Ionicons name="repeat" size={24} color="#7A0C10" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tradeInBoxTitle}>Có máy cũ muốn đổi máy này?</Text>
                      <Text style={styles.tradeInBoxDesc}>
                        Định giá thu cũ bằng AI trợ giá thêm 2.000.000 đ
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#7A0C10" />
                  </Pressable>

                  {/* Form Giữ máy HOẶC Trạng thái ĐÃ GIỮ */}
                  {(() => {
                    const isHeld = heldItems.some(
                      (h) =>
                        h.id === selectedProduct.id ||
                        h.name.toLowerCase().includes(selectedProduct.name.toLowerCase()) ||
                        selectedProduct.name.toLowerCase().includes(h.name.toLowerCase())
                    )
                    const heldInfo = heldItems.find(
                      (h) =>
                        h.id === selectedProduct.id ||
                        h.name.toLowerCase().includes(selectedProduct.name.toLowerCase()) ||
                        selectedProduct.name.toLowerCase().includes(h.name.toLowerCase())
                    )
                    const isAccessory = selectedProduct.category === 'accessory'

                    if (isHeld) {
                      return (
                        <View style={styles.heldStatusBox}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Ionicons name="checkmark-circle" size={24} color="#15803D" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.heldStatusTitle}>Đã Đặt Giữ Tại Showroom</Text>
                              <Text style={styles.heldStatusSub}>
                                Mã phiếu: {heldInfo?.refCode || 'TV-ONLINE'} · Ngày: {heldInfo?.date || 'Hôm nay'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.heldStatusNote}>
                            Cửa hàng Lieng Mobile cam kết giữ {isAccessory ? 'sản phẩm' : 'máy'} này cho bạn trong vòng 24h. Nhân viên tư vấn tại showroom đã nhận thông tin và sẵn sàng hỗ trợ bạn.
                          </Text>

                          <Pressable
                            style={styles.cancelHoldBtn}
                            onPress={() => handleCancelHold(selectedProduct)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#DC2626" />
                            <Text style={styles.cancelHoldBtnText}>Hủy phiếu giữ {isAccessory ? 'hàng' : 'máy'}</Text>
                          </Pressable>
                        </View>
                      )
                    }

                    return (
                      <View style={styles.inquiryForm}>
                        <Text style={styles.inquiryFormTitle}>
                          {isAccessory ? 'Quan tâm / Đăng ký Giữ sản phẩm tại quầy' : 'Quan tâm / Đăng ký Giữ máy tại quầy'}
                        </Text>
                        <Text style={styles.inquiryFormDesc}>
                          {isAccessory
                            ? 'Cửa hàng sẽ giữ sản phẩm cho bạn trong 24h. Nhân viên gọi xác nhận miễn phí.'
                            : 'Cửa hàng sẽ giữ máy cho bạn trong 24h. Nhân viên gọi xác nhận miễn phí.'}
                        </Text>

                        <TextInput
                          style={styles.formInput}
                          placeholder="Họ và tên của bạn"
                          placeholderTextColor="#94A3B8"
                          value={inquiryName}
                          onChangeText={setInquiryName}
                        />

                        <TextInput
                          style={styles.formInput}
                          placeholder="Số điện thoại nhận máy (*)"
                          placeholderTextColor="#94A3B8"
                          keyboardType="phone-pad"
                          value={inquiryPhone}
                          onChangeText={setInquiryPhone}
                        />

                        <TextInput
                          style={[styles.formInput, { height: 60 }]}
                          placeholder="Ghi chú thêm (màu sắc mong muốn, giờ nhận máy...)"
                          placeholderTextColor="#94A3B8"
                          multiline
                          value={inquiryNote}
                          onChangeText={setInquiryNote}
                        />

                        <Pressable
                          style={styles.submitInquiryBtn}
                          onPress={handleSendInquiry}
                          disabled={submittingInquiry}
                        >
                          <Text style={styles.submitInquiryBtnText}>
                            {submittingInquiry
                              ? 'Đang gửi yêu cầu...'
                              : (isAccessory ? 'XÁC NHẬN GIỮ HÀNG (24H)' : 'XÁC NHẬN GIỮ MÁY (24H)')}
                          </Text>
                        </Pressable>
                      </View>
                    )
                  })()}
                </>
              ) : null}
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
  header: {
    backgroundColor: '#7A0C10',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12,
    color: '#FFE5E5',
    marginTop: 2,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#191C1E',
    padding: 0,
  },
  catScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  catChipActive: {
    backgroundColor: '#FFFFFF',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFE5E5',
  },
  catChipTextActive: {
    color: '#7A0C10',
    fontWeight: '800',
  },
  gridWrap: {
    padding: 16,
  },
  resultCountText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    padding: 12,
    justifyContent: 'space-between',
  },
  productImg: {
    width: '100%',
    height: 125,
    marginVertical: 4,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
    height: 36,
  },
  productSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  priceWrap: {
    marginBottom: 8,
  },
  priceNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7A0C10',
  },
  priceOld: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    backgroundColor: '#FFF8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  viewDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A0C10',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#191C1E',
    flex: 1,
  },
  detailBigImg: {
    width: '100%',
    height: 200,
    marginVertical: 8,
  },
  priceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8F8',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  detailPriceNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#7A0C10',
  },
  detailPriceOld: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  warrantyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  warrantyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  specsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  specsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191C1E',
    marginBottom: 4,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#191C1E',
  },
  tradeInBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF8F8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    marginBottom: 16,
  },
  tradeInBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7A0C10',
  },
  tradeInBoxDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  inquiryForm: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  inquiryFormTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191C1E',
  },
  inquiryFormDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#191C1E',
  },
  submitInquiryBtn: {
    backgroundColor: '#7A0C10',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitInquiryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Held styles
  catChipHeld: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  catChipHeldActive: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  catChipHeldText: {
    color: '#15803D',
    fontWeight: '800',
  },
  catChipHeldTextActive: {
    color: '#FFFFFF',
  },
  productCardHeld: {
    borderColor: '#10B981',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
  },
  heldBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heldBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  viewDetailBtnHeld: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  viewDetailTextHeld: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heldStatusBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 20,
    gap: 10,
  },
  heldStatusTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#15803D',
  },
  heldStatusSub: {
    fontSize: 11.5,
    color: '#166534',
    marginTop: 2,
    fontWeight: '600',
  },
  heldStatusNote: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelHoldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginTop: 4,
  },
  cancelHoldBtnText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },
})
