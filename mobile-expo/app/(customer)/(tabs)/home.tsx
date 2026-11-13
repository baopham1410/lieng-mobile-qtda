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
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { getProductImageSource } from '@/utils/productImages'

const HOT_PRODUCTS = [
  {
    id: 1,
    name: 'iPhone 15 Pro Max 256GB',
    subtitle: 'Titan Tự Nhiên · Mới 100%',
    price: 29990000,
    oldPrice: 34990000,
    badge: 'Bán chạy nhất',
    imageKey: 'iphone-15.jpg',
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24 Ultra',
    subtitle: '12GB/256GB · Titan Gray',
    price: 25490000,
    oldPrice: 29990000,
    badge: 'AI Flagship',
    imageKey: 'samsung-s24.jpg',
  },
  {
    id: 3,
    name: 'MacBook Air M2 13.6"',
    subtitle: '8GB/256GB · Midnight',
    price: 23990000,
    oldPrice: 27990000,
    badge: 'Học tập - Đồ họa',
    imageKey: 'macbook-air-m2.jpg',
  },
  {
    id: 4,
    name: 'iPad Air 11" M2 (2024)',
    subtitle: '128GB Wi-Fi · Space Gray',
    price: 15490000,
    oldPrice: 16990000,
    badge: 'Mới ra mắt',
    imageKey: 'ipad-air.jpg',
  },
  {
    id: 5,
    name: 'Tai nghe AirPods Pro 2 USB-C',
    subtitle: 'Chống ồn chủ động ANC 2X',
    price: 5390000,
    oldPrice: 6190000,
    badge: 'Âm thanh đỉnh',
    imageKey: 'airpods-pro.jpg',
  },
  {
    id: 6,
    name: 'Xiaomi 14 5G 12GB/256GB',
    subtitle: 'Ống kính Leica cao cấp',
    price: 18990000,
    oldPrice: 22990000,
    badge: 'Nhiếp ảnh Leica',
    imageKey: 'xiaomi-14.jpg',
  },
]

export default function CustomerHomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const [showAddressModal, setShowAddressModal] = useState(false)

  const handleCallHotline = () => {
    Linking.openURL('tel:0900000000').catch(() => {
      Alert.alert('Hotline Lieng Mobile', 'Gọi ngay: 0900.000.000 (08:00 - 21:30)')
    })
  }

  const handleOpenZalo = () => {
    Linking.openURL('https://zalo.me').catch(() => {
      Alert.alert('Zalo Lieng Mobile', 'Nhắn tin qua Zalo số: 0900.000.000 để được hỗ trợ tức thì!')
    })
  }

  const handleOpenMap = () => {
    const query = encodeURIComponent('123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh')
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    })
    Linking.openURL(url).catch(() => {
      setShowAddressModal(true)
    })
  }

  return (
    <View style={styles.container}>
      {/* ── Top Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>L</Text>
            </View>
            <View>
              <Text style={styles.brandName}>
                LIENG <Text style={{ color: '#FFB3AC' }}>MOBILE</Text>
              </Text>
              <Text style={styles.greetingText}>
                Xin chào, {user?.name || 'Quý khách'} 👋
              </Text>
            </View>
          </View>

          <Pressable style={styles.hotlinePill} onPress={handleCallHotline}>
            <Ionicons name="call" size={14} color="#FFFFFF" />
            <Text style={styles.hotlinePillText}>0900.000.000</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 85 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Banner ── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>CHÍNH HÃNG 100%</Text>
          </View>
          <Text style={styles.heroTitle}>Thế Giới Công Nghệ Chuẩn Lieng</Text>
          <Text style={styles.heroSubtitle}>
            Điện thoại · Máy tính bảng · Phụ kiện zin · Thu cũ đổi mới trợ giá cao nhất
          </Text>

          <View style={styles.storeTimeRow}>
            <Ionicons name="time-outline" size={14} color="#FFE5E5" />
            <Text style={styles.storeTimeText}>Mở cửa: 08:00 – 21:30 hằng ngày</Text>
          </View>
        </View>

        {/* ── 4 CTA Nhanh (Lưới 2x2) ── */}
        <View style={styles.quickGrid}>
          <Pressable style={styles.quickCard} onPress={handleCallHotline}>
            <View style={[styles.quickIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="call" size={20} color="#DC2626" />
            </View>
            <View style={styles.quickTextWrap}>
              <Text style={styles.quickTitle}>Gọi tư vấn</Text>
              <Text style={styles.quickDesc}>Hotline miễn phí</Text>
            </View>
          </Pressable>

          <Pressable style={styles.quickCard} onPress={handleOpenZalo}>
            <View style={[styles.quickIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="chatbubbles" size={20} color="#0284C7" />
            </View>
            <View style={styles.quickTextWrap}>
              <Text style={styles.quickTitle}>Nhắn Zalo</Text>
              <Text style={styles.quickDesc}>Hỗ trợ 24/7</Text>
            </View>
          </Pressable>

          <Pressable style={styles.quickCard} onPress={handleOpenMap}>
            <View style={[styles.quickIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="navigate" size={20} color="#059669" />
            </View>
            <View style={styles.quickTextWrap}>
              <Text style={styles.quickTitle}>Chỉ đường</Text>
              <Text style={styles.quickDesc}>Đến Showroom</Text>
            </View>
          </Pressable>

          <Pressable style={styles.quickCard} onPress={() => setShowAddressModal(true)}>
            <View style={[styles.quickIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="business" size={20} color="#D97706" />
            </View>
            <View style={styles.quickTextWrap}>
              <Text style={styles.quickTitle}>Địa chỉ cửa hàng</Text>
              <Text style={styles.quickDesc}>Xem chi tiết</Text>
            </View>
          </Pressable>
        </View>

        {/* ── Dịch vụ nổi bật (3 Card lớn) ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dịch Vụ Nổi Bật</Text>
          <Text style={styles.sectionSubtitle}>Chỉ có tại Lieng Mobile</Text>
        </View>

        {/* Card 1: Thu cũ đổi mới */}
        <Pressable
          style={styles.servicePromoCard}
          onPress={() => router.replace('/(customer)/(tabs)/trade-in' as any)}
        >
          <View style={styles.servicePromoContent}>
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>AUTO-GRADE AI</Text>
            </View>
            <Text style={styles.servicePromoTitle}>Thu Cũ Đổi Mới — Lên Đời Siêu Tiết Kiệm</Text>
            <Text style={styles.servicePromoDesc}>
              Định giá online 60 giây. Trợ giá đến 2.000.000 đ. Nhận tiền mặt hoặc trừ thẳng vào máy mới.
            </Text>
            <View style={styles.actionLinkRow}>
              <Text style={styles.actionLinkText}>Định giá máy của tôi ngay</Text>
              <Ionicons name="arrow-forward" size={15} color="#7A0C10" />
            </View>
          </View>
          <View style={styles.servicePromoIconBox}>
            <Ionicons name="repeat" size={38} color="#7A0C10" />
          </View>
        </Pressable>

        {/* Card 2: Tra cứu bảo hành */}
        <Pressable
          style={[styles.servicePromoCard, { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF' }]}
          onPress={() => router.replace('/(customer)/(tabs)/warranty' as any)}
        >
          <View style={styles.servicePromoContent}>
            <View style={[styles.serviceBadge, { backgroundColor: '#0284C7' }]}>
              <Text style={styles.serviceBadgeText}>BẢO HÀNH ĐIỆN TỬ</Text>
            </View>
            <Text style={[styles.servicePromoTitle, { color: '#0369A1' }]}>
              Tra Cứu Bảo Hành Chuẩn IMEI
            </Text>
            <Text style={styles.servicePromoDesc}>
              Nhập số IMEI hoặc SĐT để kiểm tra thời hạn bảo hành 12 tháng, lịch sử sửa chữa minh bạch.
            </Text>
            <View style={styles.actionLinkRow}>
              <Text style={[styles.actionLinkText, { color: '#0284C7' }]}>Tra cứu bảo hành</Text>
              <Ionicons name="arrow-forward" size={15} color="#0284C7" />
            </View>
          </View>
          <View style={[styles.servicePromoIconBox, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="shield-checkmark" size={38} color="#0284C7" />
          </View>
        </Pressable>

        {/* ── Máy Đang Hot (Horizontal Scroll) ── */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View>
            <Text style={styles.sectionTitle}>Sản Phẩm Đang Hot 🔥</Text>
            <Text style={styles.sectionSubtitle}>Giá tốt nhất hôm nay tại Showroom</Text>
          </View>
          <Pressable onPress={() => router.replace('/(customer)/(tabs)/catalog' as any)}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hotList}
        >
          {HOT_PRODUCTS.map((item) => (
            <Pressable
              key={item.id}
              style={styles.hotCard}
              onPress={() => router.replace('/(customer)/(tabs)/catalog' as any)}
            >
              <View style={styles.hotBadgeBox}>
                <Text style={styles.hotBadgeText}>{item.badge}</Text>
              </View>

              <Image
                source={getProductImageSource(item.imageKey, item.name)}
                style={styles.hotImage}
                resizeMode="contain"
              />

              <Text style={styles.hotName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.hotSub} numberOfLines={1}>
                {item.subtitle}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceCurrent}>
                  {item.price.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.priceOld}>
                  {item.oldPrice.toLocaleString('vi-VN')} đ
                </Text>
              </View>

              <View style={styles.cardBtn}>
                <Text style={styles.cardBtnText}>Xem chi tiết</Text>
                <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── 4 Cam Kết Vàng ── */}
        <View style={styles.commitWrap}>
          <Text style={styles.commitHeader}>4 Cam Kết Vàng Lieng Mobile</Text>
          <View style={styles.commitGrid}>
            <View style={styles.commitItem}>
              <Ionicons name="ribbon" size={20} color="#7A0C10" />
              <Text style={styles.commitTitle}>100% Chính Hãng</Text>
              <Text style={styles.commitDesc}>Phát hiện máy dựng đền gấp 10 lần</Text>
            </View>
            <View style={styles.commitItem}>
              <Ionicons name="refresh-circle" size={20} color="#7A0C10" />
              <Text style={styles.commitTitle}>1 Đổi 1 Trong 30 Ngày</Text>
              <Text style={styles.commitDesc}>Lỗi do nhà sản xuất đổi ngay máy mới</Text>
            </View>
            <View style={styles.commitItem}>
              <Ionicons name="shield" size={20} color="#7A0C10" />
              <Text style={styles.commitTitle}>Bảo Hành 12 Tháng</Text>
              <Text style={styles.commitDesc}>Bảo hành toàn diện cả nguồn và màn hình</Text>
            </View>
            <View style={styles.commitItem}>
              <Ionicons name="card" size={20} color="#7A0C10" />
              <Text style={styles.commitTitle}>Trả Góp 0% Lãi Suất</Text>
              <Text style={styles.commitDesc}>Thủ tục nhanh qua thẻ tín dụng / CCCD</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Modal Thông tin Cửa hàng ── */}
      <Modal visible={showAddressModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="storefront" size={22} color="#7A0C10" />
                <Text style={styles.modalTitle}>Showroom Lieng Mobile</Text>
              </View>
              <Pressable onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </Pressable>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={18} color="#7A0C10" />
                <Text style={styles.infoText}>
                  123 Đường Công Nghệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="time" size={18} color="#7A0C10" />
                <Text style={styles.infoText}>
                  Giờ mở cửa: 08:00 – 21:30 (Thứ 2 đến Chủ Nhật)
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call" size={18} color="#7A0C10" />
                <Text style={styles.infoText}>
                  Hotline bán hàng & kỹ thuật: 0900.000.000
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="mail" size={18} color="#7A0C10" />
                <Text style={styles.infoText}>
                  Email: lienhe@liengmobile.com
                </Text>
              </View>
            </View>

            <Pressable style={styles.modalActionBtn} onPress={handleOpenMap}>
              <Ionicons name="navigate" size={18} color="#FFFFFF" />
              <Text style={styles.modalActionBtnText}>Mở Google Maps chỉ đường</Text>
            </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 20,
    fontWeight: '900',
    color: '#7A0C10',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 12,
    color: '#FFE5E5',
    fontWeight: '500',
  },
  hotlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  hotlinePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroBanner: {
    backgroundColor: '#7A0C10',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#7A0C10',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#FFE5E5',
    lineHeight: 18,
    marginBottom: 12,
  },
  storeTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeTimeText: {
    fontSize: 11,
    color: '#FFE5E5',
    fontWeight: '500',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  quickCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTextWrap: {
    flex: 1,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  quickDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#191C1E',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A0C10',
  },
  servicePromoCard: {
    backgroundColor: '#FFF8F8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  servicePromoContent: {
    flex: 1,
    paddingRight: 12,
  },
  serviceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#7A0C10',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  serviceBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  servicePromoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7A0C10',
    marginBottom: 4,
  },
  servicePromoDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 8,
  },
  actionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A0C10',
  },
  servicePromoIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotList: {
    gap: 12,
    paddingBottom: 4,
  },
  hotCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    padding: 12,
    position: 'relative',
  },
  hotBadgeBox: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#B32446',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  hotBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  hotImage: {
    width: '100%',
    height: 120,
    marginVertical: 6,
  },
  hotName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
    height: 36,
  },
  hotSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 6,
  },
  priceRow: {
    marginBottom: 8,
  },
  priceCurrent: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7A0C10',
  },
  priceOld: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  cardBtn: {
    backgroundColor: '#7A0C10',
    borderRadius: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  cardBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  commitWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    marginTop: 20,
  },
  commitHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191C1E',
    marginBottom: 14,
    textAlign: 'center',
  },
  commitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  commitItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFF8F8',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 4,
  },
  commitTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A0C10',
  },
  commitDesc: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7A0C10',
  },
  modalContent: {
    gap: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  modalActionBtn: {
    backgroundColor: '#7A0C10',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
