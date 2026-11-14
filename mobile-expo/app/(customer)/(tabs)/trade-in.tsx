import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
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

import { api } from '@/api/client'
import { Radius } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'

interface DevicePricing {
  id: string
  brand: 'Apple' | 'Samsung' | 'Xiaomi' | 'OPPO'
  model: string
  storage: string
  displayName: string
  gradePrices: {
    grade1: number // Like new 99%
    grade2: number // Xước nhẹ 98%
    grade3: number // Cấn móp 95%
    grade4: number // Lỗi / Vỡ kính
  }
}

// Bảng giá sàn thu mua chính thức (Đồng bộ với file Excel & JSON)
const TRADE_IN_DEVICES: DevicePricing[] = [
  // --- APPLE IPHONE ---
  {
    id: 'apple-iphone-15-pmax-256',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    storage: '256GB',
    displayName: 'iPhone 15 Pro Max (256GB)',
    gradePrices: { grade1: 23500000, grade2: 22000000, grade3: 20000000, grade4: 14500000 },
  },
  {
    id: 'apple-iphone-15-pro-128',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    storage: '128GB',
    displayName: 'iPhone 15 Pro (128GB)',
    gradePrices: { grade1: 18500000, grade2: 17000000, grade3: 15000000, grade4: 11000000 },
  },
  {
    id: 'apple-iphone-14-pmax-128',
    brand: 'Apple',
    model: 'iPhone 14 Pro Max',
    storage: '128GB',
    displayName: 'iPhone 14 Pro Max (128GB)',
    gradePrices: { grade1: 17000000, grade2: 15500000, grade3: 13000000, grade4: 9000000 },
  },
  {
    id: 'apple-iphone-13-pmax-128',
    brand: 'Apple',
    model: 'iPhone 13 Pro Max',
    storage: '128GB',
    displayName: 'iPhone 13 Pro Max (128GB)',
    gradePrices: { grade1: 13500000, grade2: 12000000, grade3: 10000000, grade4: 6500000 },
  },
  {
    id: 'apple-iphone-12-pmax-128',
    brand: 'Apple',
    model: 'iPhone 12 Pro Max',
    storage: '128GB',
    displayName: 'iPhone 12 Pro Max (128GB)',
    gradePrices: { grade1: 10500000, grade2: 9200000, grade3: 7500000, grade4: 5000000 },
  },
  {
    id: 'apple-iphone-11-64',
    brand: 'Apple',
    model: 'iPhone 11',
    storage: '64GB',
    displayName: 'iPhone 11 (64GB)',
    gradePrices: { grade1: 5200000, grade2: 4500000, grade3: 3800000, grade4: 2500000 },
  },

  // --- SAMSUNG GALAXY ---
  {
    id: 'samsung-s24-ultra-256',
    brand: 'Samsung',
    model: 'Samsung Galaxy S24 Ultra',
    storage: '256GB',
    displayName: 'Galaxy S24 Ultra (256GB)',
    gradePrices: { grade1: 19500000, grade2: 17500000, grade3: 14500000, grade4: 9500000 },
  },
  {
    id: 'samsung-s24-256',
    brand: 'Samsung',
    model: 'Samsung Galaxy S24',
    storage: '256GB',
    displayName: 'Galaxy S24 (256GB)',
    gradePrices: { grade1: 12000000, grade2: 10500000, grade3: 8500000, grade4: 5500000 },
  },
  {
    id: 'samsung-s23-ultra-256',
    brand: 'Samsung',
    model: 'Samsung Galaxy S23 Ultra',
    storage: '256GB',
    displayName: 'Galaxy S23 Ultra (256GB)',
    gradePrices: { grade1: 14000000, grade2: 12500000, grade3: 10000000, grade4: 6500000 },
  },
  {
    id: 'samsung-s22-ultra-128',
    brand: 'Samsung',
    model: 'Samsung Galaxy S22 Ultra',
    storage: '128GB',
    displayName: 'Galaxy S22 Ultra (128GB)',
    gradePrices: { grade1: 9500000, grade2: 8200000, grade3: 6500000, grade4: 4200000 },
  },
  {
    id: 'samsung-z-fold5-256',
    brand: 'Samsung',
    model: 'Samsung Galaxy Z Fold5',
    storage: '256GB',
    displayName: 'Galaxy Z Fold5 (256GB)',
    gradePrices: { grade1: 18000000, grade2: 15500000, grade3: 12000000, grade4: 7500000 },
  },
  {
    id: 'samsung-z-flip5-256',
    brand: 'Samsung',
    model: 'Samsung Galaxy Z Flip5',
    storage: '256GB',
    displayName: 'Galaxy Z Flip5 (256GB)',
    gradePrices: { grade1: 9500000, grade2: 8200000, grade3: 6500000, grade4: 4000000 },
  },
  {
    id: 'samsung-a55-128',
    brand: 'Samsung',
    model: 'Samsung Galaxy A55 5G',
    storage: '128GB',
    displayName: 'Galaxy A55 5G (128GB)',
    gradePrices: { grade1: 5500000, grade2: 4800000, grade3: 3800000, grade4: 2300000 },
  },

  // --- XIAOMI ---
  {
    id: 'xiaomi-14t-pro-256',
    brand: 'Xiaomi',
    model: 'Xiaomi 14T Pro',
    storage: '256GB',
    displayName: 'Xiaomi 14T Pro (256GB)',
    gradePrices: { grade1: 10500000, grade2: 9200000, grade3: 7500000, grade4: 4800000 },
  },
  {
    id: 'xiaomi-14-256',
    brand: 'Xiaomi',
    model: 'Xiaomi 14',
    storage: '256GB',
    displayName: 'Xiaomi 14 (256GB)',
    gradePrices: { grade1: 12500000, grade2: 11000000, grade3: 8800000, grade4: 5500000 },
  },
  {
    id: 'xiaomi-13-pro-256',
    brand: 'Xiaomi',
    model: 'Xiaomi 13 Pro',
    storage: '256GB',
    displayName: 'Xiaomi 13 Pro (256GB)',
    gradePrices: { grade1: 9000000, grade2: 7800000, grade3: 6200000, grade4: 3800000 },
  },
  {
    id: 'xiaomi-redmi-note13-pro-128',
    brand: 'Xiaomi',
    model: 'Redmi Note 13 Pro',
    storage: '128GB',
    displayName: 'Redmi Note 13 Pro (128GB)',
    gradePrices: { grade1: 3800000, grade2: 3200000, grade3: 2500000, grade4: 1500000 },
  },

  // --- OPPO ---
  {
    id: 'oppo-find-n3-512',
    brand: 'OPPO',
    model: 'OPPO Find N3',
    storage: '512GB',
    displayName: 'OPPO Find N3 (512GB)',
    gradePrices: { grade1: 22000000, grade2: 19000000, grade3: 15000000, grade4: 9500000 },
  },
  {
    id: 'oppo-reno12-256',
    brand: 'OPPO',
    model: 'OPPO Reno12 5G',
    storage: '256GB',
    displayName: 'OPPO Reno12 5G (256GB)',
    gradePrices: { grade1: 6800000, grade2: 5800000, grade3: 4600000, grade4: 2800000 },
  },
  {
    id: 'oppo-reno11-256',
    brand: 'OPPO',
    model: 'OPPO Reno11 5G',
    storage: '256GB',
    displayName: 'OPPO Reno11 5G (256GB)',
    gradePrices: { grade1: 5200000, grade2: 4500000, grade3: 3500000, grade4: 2200000 },
  },
]

const BRANDS = ['Tất cả', 'Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Hãng khác']

const BRANCHES = [
  { id: 'q5', name: 'Showroom 1: 123 Nguyễn Văn Cừ, Q.5', address: '123 Nguyễn Văn Cừ, P.4, Q.5, TP.HCM' },
  { id: 'q3', name: 'Showroom 2: 456 Lê Văn Sỹ, Q.3', address: '456 Lê Văn Sỹ, P.14, Q.3, TP.HCM' },
]

const TIME_SLOTS = [
  { id: 'today_morning', label: 'Hôm nay: 08:30 – 12:00' },
  { id: 'today_afternoon', label: 'Hôm nay: 13:30 – 17:30' },
  { id: 'today_evening', label: 'Hôm nay: 18:00 – 21:00' },
  { id: 'tomorrow', label: 'Ngày mai: Cả ngày (8:30 – 21:00)' },
]

export default function CustomerTradeInScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [selectedBrand, setSelectedBrand] = useState('Tất cả')
  const [selectedDeviceId, setSelectedDeviceId] = useState('apple-iphone-15-pmax-256')
  const [selectedGrade, setSelectedGrade] = useState<'grade1' | 'grade2' | 'grade3' | 'grade4'>('grade1')
  
  // Trường hợp khách bán dòng máy khác (tự nhập)
  const [customModelName, setCustomModelName] = useState('')
  const [customStorage, setCustomStorage] = useState('128GB')

  // Thông tin đặt lịch hẹn
  const [selectedBranchId, setSelectedBranchId] = useState('q5')
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState('today_afternoon')
  
  // Thông tin liên hệ
  const [customerName, setCustomerName] = useState(user?.name || '')
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '0383435600')
  const [note, setNote] = useState('')
  
  // Danh sách phiếu lịch hẹn
  const [submittedTickets, setSubmittedTickets] = useState<any[]>([])

  useEffect(() => {
    // Load phiếu đã tạo từ AsyncStorage
    AsyncStorage.getItem('lieng_customer_tradein_tickets').then((raw) => {
      if (raw) {
        try {
          setSubmittedTickets(JSON.parse(raw))
        } catch {}
      }
    })
  }, [])

  const handleSelectBrand = (brand: string) => {
    setSelectedBrand(brand)
    if (brand === 'Hãng khác') {
      setSelectedDeviceId('custom')
    } else if (selectedDeviceId === 'custom') {
      const firstInBrand = TRADE_IN_DEVICES.find((d) => brand === 'Tất cả' || d.brand === brand)
      if (firstInBrand) setSelectedDeviceId(firstInBrand.id)
    }
  }

  const isCustom = selectedDeviceId === 'custom'

  const filteredDevices = TRADE_IN_DEVICES.filter((d) => {
    if (selectedBrand === 'Tất cả') return true
    if (selectedBrand === 'Hãng khác') return false
    return d.brand === selectedBrand
  })

  const currentDevice = TRADE_IN_DEVICES.find((d) => d.id === selectedDeviceId)
  const estimatedPrice = currentDevice ? currentDevice.gradePrices[selectedGrade] : 0
  const chosenBranch = BRANCHES.find((b) => b.id === selectedBranchId) || BRANCHES[0]
  const chosenTimeSlot = TIME_SLOTS.find((s) => s.id === selectedTimeSlotId) || TIME_SLOTS[0]

  const handleCreateTicket = async () => {
    if (!customerPhone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại để tạo lịch hẹn thu cũ.')
      return
    }

    if (isCustom && !customModelName.trim()) {
      Alert.alert('Thiếu tên máy', 'Vui lòng nhập tên dòng máy bạn muốn bán (VD: Google Pixel 8 Pro, Sony Xperia, Note 20...).')
      return
    }

    const deviceDisplayName = isCustom
      ? `${customModelName.trim()} ${customStorage.trim() ? `(${customStorage.trim()})` : ''}`
      : currentDevice?.displayName || 'Điện thoại cũ'

    const gradeLabel =
      selectedGrade === 'grade1'
        ? 'Loại 1 (Like New 99%)'
        : selectedGrade === 'grade2'
          ? 'Loại 2 (Xước nhẹ 98%)'
          : selectedGrade === 'grade3'
            ? 'Loại 3 (Cấn / Vỡ kính)'
            : 'Loại 4 (Hỏng nặng)'

    const newTicketCode = `TC-${Date.now().toString().slice(-6)}`

    try {
      await api.post('/store/inquiry', {
        name: customerName.trim() || 'Khách đặt lịch thu cũ',
        phone: customerPhone.trim(),
        product_name: `${deviceDisplayName} [${gradeLabel}]`,
        topic: 'Đặt lịch hẹn thu cũ',
        note: `Định giá: ${isCustom ? 'Định giá trực tiếp tại showroom' : `${estimatedPrice.toLocaleString('vi-VN')} đ`} | Lịch hẹn: ${chosenTimeSlot.label} | Tại: ${chosenBranch.name} | Ghi chú: ${note}`,
        items: [{ productId: 1, qty: 1 }],
      })
    } catch (e: any) {
      console.warn('Inquiry API log:', e?.message)
    }

    const newTicket = {
      code: newTicketCode,
      device: deviceDisplayName,
      isCustom: isCustom,
      gradeLabel: gradeLabel,
      estimatePrice: estimatedPrice,
      priceDisplay: isCustom ? 'Định giá tại quầy' : `${estimatedPrice.toLocaleString('vi-VN')} đ`,
      branch: chosenBranch.name,
      timeSlot: chosenTimeSlot.label,
      status: 'Đã đặt lịch hẹn',
      createdAt: new Date().toLocaleDateString('vi-VN'),
    }

    const updated = [newTicket, ...submittedTickets]
    setSubmittedTickets(updated)
    await AsyncStorage.setItem('lieng_customer_tradein_tickets', JSON.stringify(updated))

    Alert.alert(
      'Đặt lịch hẹn thành công 🎉',
      `Mã lịch hẹn: ${newTicket.code}\nThiết bị: ${newTicket.device}\nGiá thu mua: ${newTicket.priceDisplay}\n\n📍 Địa điểm: ${chosenBranch.name}\n⏰ Thời gian: ${chosenTimeSlot.label}\n\nNhân viên kỹ thuật showroom đã nhận thông tin và sẽ sẵn sàng đón tiếp bạn kiểm tra máy nhé!`,
    )
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Text style={styles.headerTitle}>Đặt Lịch Hẹn Thu Mua Điện Thoại</Text>
        <Text style={styles.headerSub}>Định giá tham khảo · Đặt lịch mang máy tới Showroom</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 85 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner 4 bước */}
        <View style={styles.stepsBanner}>
          <Text style={styles.stepsTitle}>Quy Trình 4 Bước Đặt Lịch Hẹn</Text>
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
              <Text style={styles.stepLabel}>Đặt lịch hẹn</Text>
            </View>
          </View>
        </View>

        {/* ── BƯỚC 1: Chọn dòng máy ── */}
        <View style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardHeader}>Bước 1: Chọn máy bạn muốn bán</Text>
            <Text style={styles.badgeCount}>
              {isCustom ? 'Tự nhập máy khác' : `${filteredDevices.length} máy sẵn`}
            </Text>
          </View>

          {/* Bộ lọc Hãng */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandRow}>
            {BRANDS.map((b) => (
              <Pressable
                key={b}
                style={[styles.brandPill, selectedBrand === b && styles.brandPillActive]}
                onPress={() => handleSelectBrand(b)}
              >
                <Text style={[styles.brandPillText, selectedBrand === b && styles.brandPillTextActive]}>
                  {b}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Danh sách chip thiết bị */}
          {selectedBrand !== 'Hãng khác' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modelScroll}>
              {filteredDevices.map((m) => {
                const active = selectedDeviceId === m.id
                return (
                  <Pressable
                    key={m.id}
                    style={[styles.modelChip, active && styles.modelChipActive]}
                    onPress={() => setSelectedDeviceId(m.id)}
                  >
                    <Ionicons
                      name={m.brand === 'Apple' ? 'logo-apple' : 'phone-portrait'}
                      size={16}
                      color={active ? '#7A0C10' : '#64748B'}
                    />
                    <Text style={[styles.modelChipText, active && styles.modelChipTextActive]}>
                      {m.displayName}
                    </Text>
                  </Pressable>
                )
              })}

              {/* Nút bấm tự nhập máy khác */}
              <Pressable
                style={[styles.modelChip, isCustom && styles.modelChipActive]}
                onPress={() => setSelectedDeviceId('custom')}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={isCustom ? '#7A0C10' : '#64748B'}
                />
                <Text style={[styles.modelChipText, isCustom && styles.modelChipTextActive]}>
                  + Dòng máy khác (Tự nhập)
                </Text>
              </Pressable>
            </ScrollView>
          )}

          {/* Form tự nhập máy khác nếu chọn custom */}
          {isCustom && (
            <View style={styles.customBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="sparkles" size={16} color="#7A0C10" />
                <Text style={styles.customBoxTitle}>Bán điện thoại khác (Chưa có trong danh mục)</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Tên hãng & dòng máy (VD: Google Pixel 8 Pro, Sony Xperia 1, Galaxy Note 20...)"
                placeholderTextColor="#94A3B8"
                value={customModelName}
                onChangeText={setCustomModelName}
              />
              <TextInput
                style={styles.input}
                placeholder="Dung lượng bộ nhớ (VD: 128GB, 256GB, 512GB...)"
                placeholderTextColor="#94A3B8"
                value={customStorage}
                onChangeText={setCustomStorage}
              />
              <Text style={styles.customBoxNote}>
                💡 Lieng Mobile nhận thu mua tất cả các dòng smartphone chính hãng! Kỹ thuật viên sẽ kiểm tra trực tiếp và chốt giá tốt nhất cho bạn tại Showroom.
              </Text>
            </View>
          )}
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
              <Text style={styles.gradeDesc}>Thân máy đẹp như mới, không cấn móp hay trầy xước, pin tốt ≥ 85%, full chức năng</Text>
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
              <Text style={styles.gradeTitle}>Loại 2 (Xước nhẹ 95% - 98%)</Text>
              <Text style={styles.gradeDesc}>Xước dăm nhẹ ở sườn viền hoặc mặt lưng, màn hình hiển thị sáng đẹp không nứt</Text>
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
              <Text style={styles.gradeTitle}>Loại 3 (Cấn viền / Nứt kính ngoài)</Text>
              <Text style={styles.gradeDesc}>Có vết cấn móp góc cạnh hoặc nứt kính ngoài; tấm nền màn hình và cảm ứng hoạt động tốt</Text>
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
              <Text style={styles.gradeTitle}>Loại 4 (Hỏng nặng / Lỗi màn hình)</Text>
              <Text style={styles.gradeDesc}>Màn hình sọc, đốm đen, mất nguồn, pin chai nặng hoặc lỗi linh kiện quan trọng</Text>
            </View>
          </Pressable>
        </View>

        {/* ── BƯỚC 3: Giá thu mua ước tính ── */}
        {isCustom ? (
          <View style={styles.priceEstimateCard}>
            <Text style={styles.estimateLabel}>ĐỊNH GIÁ TRỰC TIẾP TẠI SHOWROOM</Text>
            <Text style={[styles.estimateValue, { fontSize: 24, marginVertical: 8 }]}>
              Liên hệ báo giá tại quầy
            </Text>
            <View style={styles.subsidyRow}>
              <Ionicons name="sparkles" size={15} color="#065F46" />
              <Text style={styles.subsidyText}>
                Cam kết định giá tốt nhất thị trường theo ngoại quan thực tế
              </Text>
            </View>
            <Text style={styles.disclaimerText}>
              * Do dòng máy này chưa có trong bảng giá niêm yết tự động, bạn hãy đặt lịch hẹn mang máy ra Showroom. Kỹ thuật viên sẽ kiểm tra trực tiếp và chốt giá thu mua minh bạch cho bạn.
            </Text>
          </View>
        ) : (
          <View style={styles.priceEstimateCard}>
            <Text style={styles.estimateLabel}>GIÁ THU MUA THAM KHẢO TẠI QUẦY</Text>
            <Text style={styles.estimateValue}>
              {estimatedPrice.toLocaleString('vi-VN')} đ
            </Text>
            <View style={styles.subsidyRow}>
              <Ionicons name="shield-checkmark" size={15} color="#065F46" />
              <Text style={styles.subsidyText}>
                Định giá tham khảo · Kiểm tra máy trực tiếp tại Showroom
              </Text>
            </View>
            <Text style={styles.disclaimerText}>
              * Mức giá trên là giá tham khảo theo bảng giá niêm yết của Lieng Mobile. Khi bạn mang máy đến cửa hàng theo lịch hẹn, chuyên viên kỹ thuật sẽ kiểm tra máy trực tiếp để chốt giá chính thức với bạn.
            </Text>
          </View>
        )}

        {/* ── BƯỚC 4: Chọn Chi nhánh & Khung giờ hẹn ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeader}>Bước 4: Đặt lịch hẹn mang máy tới Showroom</Text>

          {/* Chọn chi nhánh */}
          <Text style={styles.inputLabel}>Chọn Showroom Lieng Mobile:</Text>
          <View style={{ gap: 8 }}>
            {BRANCHES.map((b) => {
              const active = selectedBranchId === b.id
              return (
                <Pressable
                  key={b.id}
                  style={[styles.branchCard, active && styles.branchCardActive]}
                  onPress={() => setSelectedBranchId(b.id)}
                >
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color="#7A0C10"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.branchName, active && styles.branchNameActive]}>{b.name}</Text>
                    <Text style={styles.branchAddress}>{b.address}</Text>
                  </View>
                </Pressable>
              )
            })}
          </View>

          {/* Chọn khung giờ hẹn */}
          <Text style={[styles.inputLabel, { marginTop: 6 }]}>Chọn thời gian bạn sẽ tới:</Text>
          <View style={styles.timeSlotGrid}>
            {TIME_SLOTS.map((s) => {
              const active = selectedTimeSlotId === s.id
              return (
                <Pressable
                  key={s.id}
                  style={[styles.timeSlotBtn, active && styles.timeSlotBtnActive]}
                  onPress={() => setSelectedTimeSlotId(s.id)}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={active ? '#7A0C10' : '#64748B'}
                  />
                  <Text style={[styles.timeSlotText, active && styles.timeSlotTextActive]}>
                    {s.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          {/* Thông tin liên hệ */}
          <Text style={[styles.inputLabel, { marginTop: 6 }]}>Số điện thoại xác nhận lịch hẹn:</Text>
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại (*)"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={customerPhone}
            onChangeText={setCustomerPhone}
          />

          <TextInput
            style={[styles.input, { height: 48 }]}
            placeholder="Ghi chú thêm (VD: Máy còn hộp, cáp sạc...)"
            placeholderTextColor="#94A3B8"
            value={note}
            onChangeText={setNote}
          />

          <Pressable style={styles.submitBtn} onPress={handleCreateTicket}>
            <Ionicons name="calendar" size={18} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>XÁC NHẬN ĐẶT LỊCH HẸN THU CŨ</Text>
          </Pressable>
        </View>

        {/* ── Danh sách phiếu lịch hẹn của tôi ── */}
        <View style={styles.historyCard}>
          <Text style={styles.historyHeader}>Lịch Hẹn Thu Cũ Của Bạn ({submittedTickets.length})</Text>
          {submittedTickets.length === 0 ? (
            <View style={styles.emptyTickets}>
              <Ionicons name="calendar-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyTicketsText}>Bạn chưa có lịch hẹn thu cũ nào.</Text>
              <Text style={styles.emptyTicketsSub}>Chọn dòng máy và đặt lịch hẹn ở trên để được hỗ trợ nhanh nhất tại quầy.</Text>
            </View>
          ) : (
            submittedTickets.map((t, idx) => (
              <View key={idx} style={styles.ticketItem}>
                <View style={styles.ticketTop}>
                  <Text style={styles.ticketCode}>{t.code}</Text>
                  <View style={styles.ticketStatusBadge}>
                    <Text style={styles.ticketStatusText}>{t.status}</Text>
                  </View>
                </View>
                <Text style={styles.ticketModel}>{t.device}</Text>
                <Text style={styles.ticketGrade}>{t.gradeLabel}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Ionicons name="location-outline" size={13} color="#64748B" />
                  <Text style={styles.ticketMetaText}>{t.branch}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="time-outline" size={13} color="#64748B" />
                  <Text style={styles.ticketMetaText}>{t.timeSlot}</Text>
                </View>
                <View style={styles.ticketBottom}>
                  <Text style={styles.ticketPrice}>
                    {t.priceDisplay || (t.estimatePrice > 0 ? `${t.estimatePrice.toLocaleString('vi-VN')} đ` : 'Định giá tại quầy')}
                  </Text>
                  <Text style={styles.ticketDate}>{t.createdAt}</Text>
                </View>
              </View>
            ))
          )}
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
  badgeCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A0C10',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  brandRow: {
    gap: 8,
    paddingVertical: 2,
  },
  brandPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandPillActive: {
    backgroundColor: '#7A0C10',
    borderColor: '#7A0C10',
  },
  brandPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  brandPillTextActive: {
    color: '#FFFFFF',
  },
  modelScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
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
  customBox: {
    backgroundColor: '#FFF8F8',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 8,
    marginTop: 4,
  },
  customBoxTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#7A0C10',
  },
  customBoxNote: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
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
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: 10,
  },
  subsidyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  disclaimerText: {
    fontSize: 10.5,
    color: '#FFE5E5',
    textAlign: 'center',
    lineHeight: 15,
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  branchCardActive: {
    borderColor: '#7A0C10',
    backgroundColor: '#FFF8F8',
  },
  branchName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  branchNameActive: {
    color: '#7A0C10',
    fontWeight: '800',
  },
  branchAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  timeSlotGrid: {
    gap: 6,
  },
  timeSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  timeSlotBtnActive: {
    borderColor: '#7A0C10',
    backgroundColor: '#FFF8F8',
  },
  timeSlotText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  timeSlotTextActive: {
    color: '#7A0C10',
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  input: {
    backgroundColor: '#FFFFFF',
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
  emptyTickets: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  emptyTicketsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyTicketsSub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
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
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ticketStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#065F46',
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
  ticketMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  ticketBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
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
