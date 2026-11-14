import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  Alert,
  Linking,
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

interface WarrantyInfo {
  imei: string
  model: string
  color: string
  customerName: string
  customerPhone: string
  purchaseDate: string
  warrantyExpiry: string
  remainingDays: number
  status: 'active' | 'repairing' | 'expired'
  warrantyPackage: string
  repairHistory?: Array<{
    date: string
    issue: string
    result: string
  }>
}

const SAMPLE_WARRANTIES: Record<string, WarrantyInfo> = {
  '356891234567890': {
    imei: '356891234567890',
    model: 'iPhone 15 Pro Max 256GB',
    color: 'Titan Tự Nhiên',
    customerName: 'Trần Quốc Bảo',
    customerPhone: '0988777666',
    purchaseDate: '15/10/2026',
    warrantyExpiry: '15/10/2027',
    remainingDays: 336,
    status: 'active',
    warrantyPackage: 'Gói Bảo Hành VIP 12 Tháng 1 Đổi 1 (Nguồn, Màn hình, FaceID)',
    repairHistory: [],
  },
  '358901234567891': {
    imei: '358901234567891',
    model: 'Samsung Galaxy S24 Ultra 256GB',
    color: 'Titan Gray',
    customerName: 'Nguyễn Văn Nam',
    customerPhone: '0901234567',
    purchaseDate: '01/08/2026',
    warrantyExpiry: '01/08/2027',
    remainingDays: 261,
    status: 'active',
    warrantyPackage: 'Bảo Hành Chính Hãng SSVN 12 Tháng',
    repairHistory: [
      {
        date: '20/09/2026',
        issue: 'Vệ sinh cổng sạc USB-C',
        result: 'Đã hoàn thành miễn phí',
      },
    ],
  },
  '0988777666': {
    imei: '356891234567890',
    model: 'iPhone 15 Pro Max 256GB',
    color: 'Titan Tự Nhiên',
    customerName: 'Trần Quốc Bảo',
    customerPhone: '0988777666',
    purchaseDate: '15/10/2026',
    warrantyExpiry: '15/10/2027',
    remainingDays: 336,
    status: 'active',
    warrantyPackage: 'Gói Bảo Hành VIP 12 Tháng 1 Đổi 1 (Nguồn, Màn hình, FaceID)',
  },
}

export default function CustomerWarrantyScreen() {
  const insets = useSafeAreaInsets()
  const [keyword, setKeyword] = useState('')
  const [searchResult, setSearchResult] = useState<WarrantyInfo | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = (query?: string) => {
    const q = (query ?? keyword).trim()
    if (!q) {
      Alert.alert('Chưa nhập thông tin', 'Vui lòng nhập số IMEI (15 số) hoặc Số điện thoại để tra cứu.')
      return
    }

    setHasSearched(true)
    const result = SAMPLE_WARRANTIES[q]
    if (result) {
      setSearchResult(result)
    } else {
      setSearchResult(null)
    }
  }

  const handleCallSupport = () => {
    Linking.openURL('tel:0900000000').catch(() => {
      Alert.alert('Tổng đài Bảo hành', 'Liên hệ hotline kỹ thuật: 0900.000.000')
    })
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Text style={styles.headerTitle}>Bảo Hành Điện Tử</Text>
        <Text style={styles.headerSub}>Tra cứu thời hạn & lịch sử bảo hành máy 24/7</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 85 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Khung tìm kiếm */}
        <View style={styles.searchCard}>
          <Text style={styles.searchCardLabel}>Nhập số IMEI (15 số) hoặc Số điện thoại</Text>
          <View style={styles.searchRow}>
            <View style={styles.inputWrap}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="VD: 356891234567890 hoặc 0988..."
                placeholderTextColor="#94A3B8"
                value={keyword}
                onChangeText={setKeyword}
              />
            </View>
            <Pressable style={styles.searchBtn} onPress={() => handleSearch()}>
              <Text style={styles.searchBtnText}>Tra cứu</Text>
            </Pressable>
          </View>

          {/* Gợi ý tra cứu nhanh */}
          <View style={styles.suggestWrap}>
            <Text style={styles.suggestLabel}>Gợi ý thử nhanh:</Text>
            <View style={styles.suggestChips}>
              <Pressable
                style={styles.suggestChip}
                onPress={() => {
                  setKeyword('356891234567890')
                  handleSearch('356891234567890')
                }}
              >
                <Text style={styles.suggestChipText}>iPhone 15 Pro Max</Text>
              </Pressable>
              <Pressable
                style={styles.suggestChip}
                onPress={() => {
                  setKeyword('358901234567891')
                  handleSearch('358901234567891')
                }}
              >
                <Text style={styles.suggestChipText}>Galaxy S24 Ultra</Text>
              </Pressable>
              <Pressable
                style={styles.suggestChip}
                onPress={() => {
                  setKeyword('0988777666')
                  handleSearch('0988777666')
                }}
              >
                <Text style={styles.suggestChipText}>SĐT: 0988.777.666</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Kết quả tra cứu */}
        {searchResult ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark" size={26} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultStatusText}>
                  {searchResult.status === 'active' ? 'ĐANG TRONG HẠN BẢO HÀNH' : 'HẾT HẠN BẢO HÀNH'}
                </Text>
                <Text style={styles.resultRemainingText}>
                  Còn {searchResult.remainingDays} ngày bảo hành chính hãng
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Thiết bị:</Text>
                <Text style={styles.infoValue}>{searchResult.model}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Màu sắc:</Text>
                <Text style={styles.infoValue}>{searchResult.color}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Số IMEI:</Text>
                <Text style={[styles.infoValue, { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
                  {searchResult.imei.slice(0, 6)}******{searchResult.imei.slice(-3)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Khách hàng:</Text>
                <Text style={styles.infoValue}>{searchResult.customerName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày mua máy:</Text>
                <Text style={styles.infoValue}>{searchResult.purchaseDate}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hạn bảo hành:</Text>
                <Text style={[styles.infoValue, { color: '#7A0C10', fontWeight: '800' }]}>
                  {searchResult.warrantyExpiry}
                </Text>
              </View>
            </View>

            <View style={styles.packageBox}>
              <Text style={styles.packageTitle}>Gói bảo hành áp dụng:</Text>
              <Text style={styles.packageDesc}>{searchResult.warrantyPackage}</Text>
            </View>

            {searchResult.repairHistory && searchResult.repairHistory.length > 0 ? (
              <View style={styles.repairBox}>
                <Text style={styles.repairTitle}>Lịch sử hỗ trợ kỹ thuật:</Text>
                {searchResult.repairHistory.map((h, i) => (
                  <View key={i} style={styles.repairItem}>
                    <Text style={styles.repairDate}>{h.date}:</Text>
                    <Text style={styles.repairContent}>
                      {h.issue} — <Text style={{ color: '#059669', fontWeight: '700' }}>{h.result}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Pressable style={styles.supportBtn} onPress={handleCallSupport}>
              <Ionicons name="call" size={16} color="#FFFFFF" />
              <Text style={styles.supportBtnText}>YÊU CẦU HỖ TRỢ KỸ THUẬT</Text>
            </Pressable>
          </View>
        ) : hasSearched ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Không tìm thấy thông tin bảo hành</Text>
            <Text style={styles.emptyDesc}>
              Không tìm thấy máy có IMEI hoặc SĐT "{keyword}". Quý khách vui lòng kiểm tra lại dãy 15 số IMEI trên vỏ hộp / cài đặt máy, hoặc mang trực tiếp tới cửa hàng.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={handleCallSupport}>
              <Ionicons name="headset" size={18} color="#7A0C10" />
              <Text style={styles.emptyBtnText}>Gọi tổng đài hỗ trợ: 0900.000.000</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>Cách lấy số IMEI trên điện thoại:</Text>
            <View style={styles.guideStep}>
              <Text style={styles.guideNum}>1.</Text>
              <Text style={styles.guideText}>
                Mở ứng dụng gọi điện và bấm cú pháp: <Text style={styles.codeText}>*#06#</Text>
              </Text>
            </View>
            <View style={styles.guideStep}>
              <Text style={styles.guideNum}>2.</Text>
              <Text style={styles.guideText}>
                Hoặc vào: <Text style={{ fontWeight: '700' }}>Cài đặt → Cài đặt chung → Giới thiệu</Text> để xem số IMEI 15 chữ số.
              </Text>
            </View>
          </View>
        )}
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
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 10,
  },
  searchCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#191C1E',
    paddingVertical: 10,
  },
  searchBtn: {
    backgroundColor: '#7A0C10',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  suggestWrap: {
    marginTop: 4,
    gap: 6,
  },
  suggestLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  suggestChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  suggestChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultStatusText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.5,
  },
  resultRemainingText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  infoSection: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12.5,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  packageBox: {
    backgroundColor: '#FFF8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 12,
    gap: 4,
  },
  packageTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7A0C10',
  },
  packageDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  repairBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  repairTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191C1E',
  },
  repairItem: {
    flexDirection: 'row',
    gap: 6,
  },
  repairDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  repairContent: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
  },
  supportBtn: {
    backgroundColor: '#7A0C10',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  supportBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191C1E',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8F8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
  },
  emptyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A0C10',
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 10,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191C1E',
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  guideNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7A0C10',
  },
  guideText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  codeText: {
    color: '#7A0C10',
    fontWeight: '800',
  },
})
