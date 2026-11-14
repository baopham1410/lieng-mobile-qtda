import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
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

import { Radius } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'

export default function CustomerAccountScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, logout } = useAuth()

  const [customerName, setCustomerName] = useState(user?.name || 'Quý khách hàng')
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '0988.777.666')
  const [showEditModal, setShowEditModal] = useState(false)
  const [tempName, setTempName] = useState(customerName)
  const [tempPhone, setTempPhone] = useState(customerPhone)
  const [showPolicyModal, setShowPolicyModal] = useState(false)

  const handleSaveProfile = () => {
    setCustomerName(tempName)
    setCustomerPhone(tempPhone)
    setShowEditModal(false)
    Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân!')
  }

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/login')
        },
      },
    ])
  }

  const handleSwitchToStaff = () => {
    Alert.alert(
      'Chuyển sang Chế độ Nhân viên',
      'Bạn sẽ được chuyển về màn hình đăng nhập nội bộ dành cho nhân viên bán hàng, kho và quản trị.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chuyển ngay',
          onPress: () => {
            router.replace('/login')
          },
        },
      ],
    )
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Text style={styles.headerTitle}>Tài Khoản Khách Hàng</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 85 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarLetter}>
              {customerName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.customerPhone}>SĐT: {customerPhone}</Text>
            <View style={styles.memberBadge}>
              <Ionicons name="sparkles" size={13} color="#D97706" />
              <Text style={styles.memberBadgeText}>Hội viên Vàng · 450 điểm</Text>
            </View>
          </View>

          <Pressable
            style={styles.editBtn}
            onPress={() => {
              setTempName(customerName)
              setTempPhone(customerPhone)
              setShowEditModal(true)
            }}
          >
            <Ionicons name="create-outline" size={18} color="#7A0C10" />
          </Pressable>
        </View>

        {/* Lối tắt dịch vụ */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupTitle}>Tiện ích của bạn</Text>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.replace('/(customer)/(tabs)/trade-in' as any)}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="repeat" size={20} color="#7A0C10" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Phiếu thu cũ đổi mới của tôi</Text>
              <Text style={styles.menuSub}>Theo dõi tiến độ thẩm định máy cũ</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.replace('/(customer)/(tabs)/warranty' as any)}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Máy & Bảo hành của tôi</Text>
              <Text style={styles.menuSub}>Tra cứu 15 số IMEI chính hãng</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.replace('/(customer)/(tabs)/catalog' as any)}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="bookmark" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Sản phẩm đang giữ & Yêu cầu</Text>
              <Text style={styles.menuSub}>Xem lại các máy đã đăng ký giữ tại quầy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>
        </View>

        {/* Hỗ trợ & Thông tin */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupTitle}>Hỗ trợ & Chính sách</Text>

          <Pressable
            style={styles.menuItem}
            onPress={() => {
              Linking.openURL('tel:0900000000').catch(() => {
                Alert.alert('Hotline Lieng Mobile', 'Gọi ngay: 0900.000.000')
              })
            }}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="call" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Hotline CSKH & Kỹ thuật</Text>
              <Text style={styles.menuSub}>0900.000.000 (08:00 - 21:30)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => setShowPolicyModal(true)}>
            <View style={[styles.menuIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="document-text" size={20} color="#9333EA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Chính sách Bảo hành & Đổi trả</Text>
              <Text style={styles.menuSub}>Cam kết 1 đổi 1 trong 30 ngày</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>
        </View>

        {/* Chuyển sang chế độ nhân viên */}
        <View style={styles.menuGroup}>
          <Pressable style={styles.switchStaffCard} onPress={handleSwitchToStaff}>
            <Ionicons name="briefcase-outline" size={22} color="#7A0C10" />
            <View style={{ flex: 1 }}>
              <Text style={styles.switchStaffTitle}>Chế độ Nhân viên Showroom</Text>
              <Text style={styles.switchStaffSub}>Dành cho nhân viên bán hàng, thủ kho & quản trị</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={22} color="#7A0C10" />
          </Pressable>

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal Sửa Hồ Sơ */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalBoxTitle}>Chỉnh sửa thông tin cá nhân</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Họ và tên"
              value={tempName}
              onChangeText={setTempName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Số điện thoại"
              keyboardType="phone-pad"
              value={tempPhone}
              onChangeText={setTempPhone}
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={{ color: '#475569', fontWeight: '700' }}>Hủy</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, { backgroundColor: '#7A0C10' }]}
                onPress={handleSaveProfile}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Lưu thông tin</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Chính sách */}
      <Modal visible={showPolicyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '80%' }]}>
            <View style={styles.policyHeader}>
              <Text style={styles.modalBoxTitle}>Chính Sách Lieng Mobile</Text>
              <Pressable onPress={() => setShowPolicyModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.policyContent}>
                <Text style={styles.policySection}>1. Chính sách 1 đổi 1 trong 30 ngày</Text>
                <Text style={styles.policyText}>
                  Nếu máy phát sinh lỗi phần cứng từ nhà sản xuất trong vòng 30 ngày đầu, quý khách được đổi ngay 1 máy khác cùng model, màu sắc và tình trạng tương đương hoàn toàn miễn phí.
                </Text>

                <Text style={styles.policySection}>2. Chính sách Bảo hành 12 tháng</Text>
                <Text style={styles.policyText}>
                  Bảo hành toàn diện 12 tháng bao gồm: Mainboard, Nguồn, Màn hình cảm ứng, FaceID / Cảm biến vân tay, Camera và Loa thoại.
                </Text>

                <Text style={styles.policySection}>3. Cam kết Thu Cũ Đổi Mới</Text>
                <Text style={styles.policyText}>
                  Thu mua giá cao nhất thị trường. Hỗ trợ trợ giá lên đời đến 2.000.000 đ. Kiểm tra minh bạch bằng hệ thống thị giác AI AutoGrade.
                </Text>
              </View>
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
  content: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7A0C10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191C1E',
  },
  customerPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  memberBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF8F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 10,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#191C1E',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  switchStaffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF8F8',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  switchStaffTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7A0C10',
  },
  switchStaffSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalBoxTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191C1E',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#191C1E',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalBtn: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
    paddingBottom: 10,
    marginBottom: 8,
  },
  policyContent: {
    gap: 10,
    paddingVertical: 6,
  },
  policySection: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#7A0C10',
  },
  policyText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
})
