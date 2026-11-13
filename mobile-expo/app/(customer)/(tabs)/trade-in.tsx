import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Radius } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'

interface DevicePricing {
  model: string
  storage: string
  gradePrices: {
    grade1: number // Like new 99%
    grade2: number // Xước nhẹ 98%
    grade3: number // Cấn móp 95%
    grade4: number // Lỗi / Vỡ kính
  }
}

const TRADE_IN_PRICING: Record<string, DevicePricing> = {
  'iphone-15-pmax-256': {
    model: 'iPhone 15 Pro Max',
    storage: '256GB',
    gradePrices: { grade1: 22500000, grade2: 20500000, grade3: 17500000, grade4: 12000000 },
  },
  'iphone-15-pmax-512': {
    model: 'iPhone 15 Pro Max',
    storage: '512GB',
    gradePrices: { grade1: 25000000, grade2: 23000000, grade3: 19500000, grade4: 14000000 },
  },
  'iphone-14-pmax-128': {
    model: 'iPhone 14 Pro Max',
    storage: '128GB',
    gradePrices: { grade1: 17000000, grade2: 15500000, grade3: 13000000, grade4: 9000000 },
  },
  'iphone-14-pmax-256': {
    model: 'iPhone 14 Pro Max',
    storage: '256GB',
    gradePrices: { grade1: 18500000, grade2: 17000000, grade3: 14500000, grade4: 10500000 },
  },
  'iphone-13-pmax-128': {
    model: 'iPhone 13 Pro Max',
    storage: '128GB',
    gradePrices: { grade1: 13500000, grade2: 12000000, grade3: 10000000, grade4: 6500000 },
  },
  'samsung-s24-ultra-256': {
    model: 'Samsung Galaxy S24 Ultra',
    storage: '256GB',
    gradePrices: { grade1: 19500000, grade2: 17500000, grade3: 14500000, grade4: 10000000 },
  },
  'samsung-s23-ultra-256': {
    model: 'Samsung Galaxy S23 Ultra',
    storage: '256GB',
    gradePrices: { grade1: 14000000, grade2: 12500000, grade3: 10000000, grade4: 7000000 },
  },
}

const MODELS = [
  { id: 'iphone-15-pmax-256', brand: 'Apple', name: 'iPhone 15 Pro Max (256GB)' },
  { id: 'iphone-15-pmax-512', brand: 'Apple', name: 'iPhone 15 Pro Max (512GB)' },
  { id: 'iphone-14-pmax-128', brand: 'Apple', name: 'iPhone 14 Pro Max (128GB)' },
  { id: 'iphone-14-pmax-256', brand: 'Apple', name: 'iPhone 14 Pro Max (256GB)' },
  { id: 'iphone-13-pmax-128', brand: 'Apple', name: 'iPhone 13 Pro Max (128GB)' },
  { id: 'samsung-s24-ultra-256', brand: 'Samsung', name: 'Samsung Galaxy S24 Ultra (256GB)' },
  { id: 'samsung-s23-ultra-256', brand: 'Samsung', name: 'Samsung Galaxy S23 Ultra (256GB)' },
]

export default function CustomerTradeInScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [selectedModelId, setSelectedModelId] = useState('iphone-15-pmax-256')
  const [selectedGrade, setSelectedGrade] = useState<'grade1' | 'grade2' | 'grade3' | 'grade4'>('grade1')
  const [batteryPercent, setBatteryPercent] = useState('88')
  const [customerName, setCustomerName] = useState(user?.name || '')
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '')
  const [note, setNote] = useState('')
  const [submittedTickets, setSubmittedTickets] = useState<any[]>([
    {
      code: 'TC-2026-081',
      model: 'iPhone 14 Pro Max 128GB',
      gradeLabel: 'Loại 2 (Xước nhẹ 98%)',
      estimatePrice: 15500000,
      status: 'Chờ mang máy',
      createdAt: '13/11/2026',
    },
  ])

  const currentPricing = TRADE_IN_PRICING[selectedModelId]
  const estimatedPrice = currentPricing?.gradePrices[selectedGrade] || 0

  const handleCreateTicket = () => {
    if (!customerPhone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại liên hệ để nhận mã phiếu thu cũ.')
      return
    }

    const newTicket = {
      code: `TC-2026-0${submittedTickets.length + 82}`,
      model: currentPricing?.model + ' ' + currentPricing?.storage,
      gradeLabel:
        selectedGrade === 'grade1'
          ? 'Loại 1 (Like New 99%)'
          : selectedGrade === 'grade2'
            ? 'Loại 2 (Xước nhẹ 98%)'
            : selectedGrade === 'grade3'
              ? 'Loại 3 (Cấn móp 95%)'
              : 'Loại 4 (Lỗi / Vỡ kính)',
      estimatePrice: estimatedPrice,
      status: 'Chờ mang máy',
      createdAt: 'Hôm nay',
    }

    setSubmittedTickets([newTicket, ...submittedTickets])
    Alert.alert(
      'Tạo phiếu thu cũ thành công 🎉',
      `Mã phiếu của bạn: ${newTicket.code}\nGiá thu mua ước tính: ${estimatedPrice.toLocaleString('vi-VN')} đ.\n\nBạn vui lòng mang máy đến Showroom Lieng Mobile (123 Đường Công Nghệ, Q.1) để chuyên viên thẩm định và nhận tiền ngay!`,
    )
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Text style={styles.headerTitle}>Thu Cũ Đổi Mới Chuẩn AI</Text>
        <Text style={styles.headerSub}>Định giá online 60s · Trợ giá thêm 2.000.000 đ</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 85 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner 4 bước */}
        <View style={styles.stepsBanner}>
          <Text style={styles.stepsTitle}>Quy Trình 4 Bước Thu Cũ Nhanh Gọn</Text>
          <View style={styles.stepGrid}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumBox}><Text style={styles.stepNum}>1</Text></View>
              <Text style={styles.stepLabel}>Chọn dòng máy</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumBox}><Text style={styles.stepNum}>2</Text></View>
              <Text style={styles.stepLabel}>Chọn tình trạng</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumBox}><Text style={styles.stepNum}>3</Text></View>
              <Text style={styles.stepLabel}>Xem giá ước tính</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumBox}><Text style={styles.stepNum}>4</Text></View>
              <Text style={styles.stepLabel}>Nhận tiền tại quầy</Text>
            </View>
          </View>
        </View>

        {/* ── BƯỚC 1: Chọn dòng máy ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeader}>Bước 1: Chọn máy bạn đang dùng</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modelScroll}>
            {MODELS.map((m) => {
              const active = selectedModelId === m.id
              return (
                <Pressable
                  key={m.id}
                  style={[styles.modelChip, active && styles.modelChipActive]}
                  onPress={() => setSelectedModelId(m.id)}
                >
                  <Ionicons
                    name={m.brand === 'Apple' ? 'logo-apple' : 'phone-portrait'}
                    size={16}
                    color={active ? '#7A0C10' : '#64748B'}
                  />
                  <Text style={[styles.modelChipText, active && styles.modelChipTextActive]}>
                    {m.name}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>

        {/* ── BƯỚC 2: Chọn tình trạng ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeader}>Bước 2: Tình trạng thực tế của máy</Text>

          {/* Grade 1 */}
          <Pressable
            style={[styles.gradeRow, selectedGrade === 'grade1' && styles.gradeRowActive]}
            onPress={() => setSelectedGrade('grade1')}
          >
            <Ionicons
              name={selectedGrade === 'grade1' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color="#7A0C10"
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.gradeTitle}>Loại 1 (Like New 99%)</Text>
                <View style={[styles.gradeTag, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.gradeTagText, { color: '#059669' }]}>Giá cao nhất</Text>
                </View>
              </View>
              <Text style={styles.gradeDesc}>Thân máy đẹp như mới, không cấn móp hay trầy xước, pin tốt {'>'} 85%</Text>
            </View>
          </Pressable>

          {/* Grade 2 */}
          <Pressable
            style={[styles.gradeRow, selectedGrade === 'grade2' && styles.gradeRowActive]}
            onPress={() => setSelectedGrade('grade2')}
          >
            <Ionicons
              name={selectedGrade === 'grade2' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color="#7A0C10"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.gradeTitle}>Loại 2 (Xước nhẹ 98%)</Text>
              <Text style={styles.gradeDesc}>Xước dăm nhẹ ở viền hoặc lưng máy, màn hình sáng đẹp không trầy</Text>
            </View>
          </Pressable>

          {/* Grade 3 */}
          <Pressable
            style={[styles.gradeRow, selectedGrade === 'grade3' && styles.gradeRowActive]}
            onPress={() => setSelectedGrade('grade3')}
          >
            <Ionicons
              name={selectedGrade === 'grade3' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color="#7A0C10"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.gradeTitle}>Loại 3 (Cấn móp 95%)</Text>
              <Text style={styles.gradeDesc}>Có vết cấn móp góc cạnh, trầy xước thấy rõ, màn hình hoạt động bình thường</Text>
            </View>
          </Pressable>

          {/* Grade 4 */}
          <Pressable
            style={[styles.gradeRow, selectedGrade === 'grade4' && styles.gradeRowActive]}
            onPress={() => setSelectedGrade('grade4')}
          >
            <Ionicons
              name={selectedGrade === 'grade4' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color="#7A0C10"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.gradeTitle}>Loại 4 (Lỗi / Vỡ kính)</Text>
              <Text style={styles.gradeDesc}>Kính nứt vỡ, sọc màn hình, pin chai nặng hoặc mất một số tính năng phụ</Text>
            </View>
          </Pressable>
        </View>

        {/* ── BƯỚC 3: Giá thu mua ước tính ── */}
        <View style={styles.priceEstimateCard}>
          <Text style={styles.estimateLabel}>GIÁ THU MUA ƯỚC TÍNH</Text>
          <Text style={styles.estimateValue}>
            {estimatedPrice.toLocaleString('vi-VN')} đ
          </Text>
          <View style={styles.subsidyRow}>
            <Ionicons name="sparkles" size={16} color="#D97706" />
            <Text style={styles.subsidyText}>
              Đã cộng trợ giá lên đời +2.000.000 đ khi đổi máy mới
            </Text>
          </View>
          <Text style={styles.disclaimerText}>
            * Giá ước tính dựa trên tình trạng tự khai báo. Khi bạn mang máy đến cửa hàng, hệ thống AutoGrade AI và chuyên viên kỹ thuật sẽ thẩm định thực tế để chốt giá cuối cùng.
          </Text>
        </View>

        {/* ── BƯỚC 4: Thông tin liên hệ & Đặt lịch ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeader}>Bước 4: Thông tin đặt lịch mang máy</Text>

          <TextInput
            style={styles.input}
            placeholder="Họ và tên của bạn"
            placeholderTextColor="#94A3B8"
            value={customerName}
            onChangeText={setCustomerName}
          />

          <TextInput
            style={styles.input}
            placeholder="Số điện thoại (*)"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={customerPhone}
            onChangeText={setCustomerPhone}
          />

          <TextInput
            style={[styles.input, { height: 60 }]}
            placeholder="Ghi chú thêm (máy còn hộp zin, có củ sạc zin...)"
            placeholderTextColor="#94A3B8"
            multiline
            value={note}
            onChangeText={setNote}
          />

          <Pressable style={styles.submitBtn} onPress={handleCreateTicket}>
            <Ionicons name="send" size={18} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>GỬI YÊU CẦU & NHẬN MÃ THU CŨ</Text>
          </Pressable>
        </View>

        {/* ── Danh sách phiếu thu cũ của tôi ── */}
        <View style={styles.historyCard}>
          <Text style={styles.historyHeader}>Phiếu Thu Cũ Của Bạn ({submittedTickets.length})</Text>
          {submittedTickets.map((t, idx) => (
            <View key={idx} style={styles.ticketItem}>
              <View style={styles.ticketTop}>
                <Text style={styles.ticketCode}>{t.code}</Text>
                <View style={styles.ticketStatusBadge}>
                  <Text style={styles.ticketStatusText}>{t.status}</Text>
                </View>
              </View>
              <Text style={styles.ticketModel}>{t.model}</Text>
              <Text style={styles.ticketGrade}>{t.gradeLabel}</Text>
              <View style={styles.ticketBottom}>
                <Text style={styles.ticketPrice}>
                  {t.estimatePrice.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.ticketDate}>{t.createdAt}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  },
  content: {
    padding: 16,
    gap: 14,
  },
  stepsBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191C1E',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: '24%',
    gap: 4,
  },
  stepNumBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7A0C10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 13,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 12,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191C1E',
  },
  modelScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modelChipActive: {
    backgroundColor: '#FFF8F8',
    borderColor: '#7A0C10',
  },
  modelChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  modelChipTextActive: {
    color: '#7A0C10',
    fontWeight: '800',
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gradeRowActive: {
    backgroundColor: '#FFF8F8',
    borderColor: '#7A0C10',
  },
  gradeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191C1E',
  },
  gradeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gradeTagText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  gradeDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  priceEstimateCard: {
    backgroundColor: '#7A0C10',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
  },
  estimateLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFE5E5',
    letterSpacing: 1,
  },
  estimateValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 6,
  },
  subsidyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: 10,
  },
  subsidyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  disclaimerText: {
    fontSize: 10.5,
    color: '#FFE5E5',
    textAlign: 'center',
    lineHeight: 15,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#191C1E',
  },
  submitBtn: {
    backgroundColor: '#7A0C10',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 12,
  },
  historyHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191C1E',
  },
  ticketItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7A0C10',
  },
  ticketStatusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ticketStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400E',
  },
  ticketModel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  ticketGrade: {
    fontSize: 11,
    color: '#64748B',
  },
  ticketBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#ECEEF0',
    paddingTop: 6,
  },
  ticketPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7A0C10',
  },
  ticketDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
})
