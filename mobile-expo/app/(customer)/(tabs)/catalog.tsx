import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
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

const CATEGORY_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'iphone', label: 'iPhone' },
  { id: 'samsung', label: 'Samsung' },
  { id: 'ipad', label: 'iPad' },
  { id: 'mac', label: 'MacBook' },
  { id: 'accessory', label: 'Phụ kiện' },
]

export default function CustomerCatalogScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()

  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null)

  // Form giữ máy
  const [inquiryName, setInquiryName] = useState('')
  const [inquiryPhone, setInquiryPhone] = useState('')
  const [inquiryNote, setInquiryNote] = useState('')
  const [submittingInquiry, setSubmittingInquiry] = useState(false)

  const filteredList = CATALOG_DATA.filter((item) => {
    const matchCat = selectedCat === 'all' || item.category === selectedCat
    const matchText =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchText
  })

  const handleOpenDetail = (item: CatalogItem) => {
    setSelectedProduct(item)
    setInquiryName(user?.name || '')
    setInquiryPhone(user?.phone || '')
    setInquiryNote('')
  }

  const handleSendInquiry = () => {
    if (!inquiryPhone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại để cửa hàng liên hệ giữ máy.')
      return
    }
    setSubmittingInquiry(true)
    setTimeout(() => {
      setSubmittingInquiry(false)
      const modelName = selectedProduct?.name || 'máy'
      setSelectedProduct(null)
      Alert.alert(
        'Đã gửi yêu cầu giữ máy 🎉',
        `Lieng Mobile đã tiếp nhận yêu cầu giữ máy "${modelName}". Chuyên viên tư vấn sẽ liên hệ SĐT ${inquiryPhone} trong 10 phút!`,
      )
    }, 600)
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
          {CATEGORY_TABS.map((cat) => {
            const active = selectedCat === cat.id
            return (
              <Pressable
                key={cat.id}
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => setSelectedCat(cat.id)}
              >
                <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
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
          {filteredList.map((item) => (
            <Pressable
              key={item.id}
              style={styles.productCard}
              onPress={() => handleOpenDetail(item)}
            >
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

              <View style={styles.viewDetailBtn}>
                <Text style={styles.viewDetailText}>Xem & Giữ máy</Text>
                <Ionicons name="arrow-forward" size={12} color="#7A0C10" />
              </View>
            </Pressable>
          ))}
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
                      <Text style={styles.warrantyBadgeText}>Bảo hành 12 tháng</Text>
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

                  {/* Form Giữ máy */}
                  <View style={styles.inquiryForm}>
                    <Text style={styles.inquiryFormTitle}>
                      Quan tâm / Đăng ký Giữ máy tại quầy
                    </Text>
                    <Text style={styles.inquiryFormDesc}>
                      Cửa hàng sẽ giữ máy cho bạn trong 24h. Nhân viên gọi xác nhận miễn phí.
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
                        {submittingInquiry ? 'Đang gửi yêu cầu...' : 'XÁC NHẬN GIỮ MÁY'}
                      </Text>
                    </Pressable>
                  </View>
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
})
