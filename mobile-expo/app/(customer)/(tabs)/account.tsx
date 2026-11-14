import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
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

import {
  fetchMyPurchases,
  fetchMyWarranties,
  type CustomerPurchaseItem,
  type CustomerWarrantyItem,
} from '@/api/warranty'
import { Radius } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'

export default function CustomerAccountScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, customer, logout } = useAuth()

  const initialName = customer?.name || user?.name || 'phạm quốc bảo'
  const initialPhone = customer?.phone || user?.phone || '0383435600'
  const memberTier = customer?.tier || 'Thành viên Bạc'
  const loyaltyPoints = customer?.loyalty_points ?? 0

  const [customerName, setCustomerName] = useState(initialName)
  const [customerPhone, setCustomerPhone] = useState(initialPhone)
  const [warranties, setWarranties] = useState<CustomerWarrantyItem[]>([])
  const [purchases, setPurchases] = useState<CustomerPurchaseItem[]>([])
  const [loadingWarranties, setLoadingWarranties] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [tempName, setTempName] = useState(customerName)
  const [tempPhone, setTempPhone] = useState(customerPhone)
  const [showPolicyModal, setShowPolicyModal] = useState(false)

  useEffect(() => {
    if (customer?.name) setCustomerName(customer.name)
    if (customer?.phone) setCustomerPhone(customer.phone)
    else if (user?.phone) setCustomerPhone(user.phone)
  }, [customer, user])

  const loadWarranties = useCallback(async (phoneTarget?: string) => {
    const p = phoneTarget || customerPhone || '0383435600'
    setLoadingWarranties(true)
    try {
      const [wList, pList] = await Promise.all([
        fetchMyWarranties(p),
        fetchMyPurchases(p),
      ])
      setWarranties(wList)
      setPurchases(pList)
    } catch (e) {
      console.warn('Lỗi tải danh sách bảo hành:', e)
    } finally {
      setLoadingWarranties(false)
    }
  }, [customerPhone])

  useEffect(() => {
    loadWarranties(customerPhone)
  }, [customerPhone, loadWarranties])

  const handleSaveProfile = () => {
    setCustomerName(tempName)
    setCustomerPhone(tempPhone)
    setShowEditModal(false)
    loadWarranties(tempPhone)
    Alert.alert('Thành công', 'Đã cập nhật thông tin và tải lại hồ sơ bảo hành!')
  }

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản khách hàng?', [
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
              {customerName ? customerName.charAt(0).toUpperCase() : 'B'}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.customerPhone}>SĐT liên kết: {customerPhone}</Text>
            <View style={styles.memberBadge}>
              <Ionicons name="sparkles" size={13} color="#D97706" />
              <Text style={styles.memberBadgeText}>{memberTier} · {loyaltyPoints} điểm tích lũy</Text>
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

        {/* ── SECTION: THIẾT BỊ CỦA TÔI & BẢO HÀNH ĐIỆN TỬ (OMNICHANNEL) ── */}
        <View style={styles.warrantySection}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="shield-checkmark" size={18} color="#7A0C10" />
              <Text style={styles.sectionTitle}>Thiết bị & Bảo hành điện tử</Text>
            </View>
            <Pressable
              style={styles.refreshBtn}
              onPress={() => loadWarranties(customerPhone)}
              hitSlop={8}
            >
              <Ionicons name="refresh" size={16} color="#7A0C10" />
              <Text style={styles.refreshBtnText}>Làm mới</Text>
            </Pressable>
          </View>

          {loadingWarranties ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#7A0C10" />
              <Text style={styles.loadingText}>Đang tra cứu thiết bị trên hệ thống Lieng Cloud...</Text>
            </View>
          ) : warranties.length > 0 ? (
            warranties.map((w) => (
              <View key={w.id || w.imei} style={styles.deviceCard}>
                <View style={styles.deviceHeader}>
                  <View style={styles.deviceIconCircle}>
                    <Ionicons name="phone-portrait" size={20} color="#7A0C10" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceName}>{w.deviceName}</Text>
                    <Text style={styles.deviceSub}>
                      IMEI: <Text style={styles.imeiCode}>{w.imei}</Text> · {w.color}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    w.status === 'active' ? styles.statusBadgeActive : styles.statusBadgeExpired,
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      w.status === 'active' ? styles.statusBadgeTextActive : styles.statusBadgeTextExpired,
                    ]}>
                      {w.statusBadge}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.deviceMetaRow}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Gói bảo hành</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>{w.package}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Hạn bảo hành</Text>
                    <Text style={styles.metaValue}>{w.endDate}</Text>
                  </View>
                </View>

                {w.orderCode ? (
                  <View style={styles.orderTagRow}>
                    <Ionicons name="receipt-outline" size={13} color="#64748B" />
                    <Text style={styles.orderTagText}>Mã hóa đơn gốc: {w.orderCode}</Text>
                  </View>
                ) : null}

                <View style={styles.deviceActionRow}>
                  <Pressable
                    style={styles.outlineActionBtn}
                    onPress={() => router.replace('/(customer)/(tabs)/warranty' as any)}
                  >
                    <Ionicons name="search-outline" size={14} color="#7A0C10" />
                    <Text style={styles.outlineActionText}>Tra cứu IMEI</Text>
                  </Pressable>

                  <Pressable
                    style={styles.primaryActionBtn}
                    onPress={() => {
                      Linking.openURL('tel:0900000000').catch(() => {
                        Alert.alert('Hotline Kỹ Thuật', 'Gọi ngay: 0900.000.000 để yêu cầu bảo hành nhanh tại quầy.')
                      })
                    }}
                  >
                    <Ionicons name="construct" size={14} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>Yêu cầu bảo hành</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyWarrantyCard}>
              <Ionicons name="shield-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Chưa có thiết bị bảo hành liên kết</Text>
              <Text style={styles.emptySub}>
                Khi quý khách mua máy tại Showroom Lieng Mobile và đăng ký SĐT {customerPhone}, thiết bị sẽ tự động xuất hiện tại đây.
              </Text>
              <Pressable
                style={styles.quickSearchBtn}
                onPress={() => router.replace('/(customer)/(tabs)/warranty' as any)}
              >
                <Ionicons name="search" size={14} color="#7A0C10" />
                <Text style={styles.quickSearchBtnText}>Tra cứu bằng 15 số IMEI</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ── SECTION: ĐƠN HÀNG & SẢN PHẨM MỚI MUA TẠI QUẦY (POS) ── */}
        {purchases.length > 0 ? (
          <View style={styles.warrantySection}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="receipt" size={18} color="#7A0C10" />
                <Text style={styles.sectionTitle}>Đơn hàng & Sản phẩm mới mua</Text>
              </View>
            </View>

            {purchases.map((order) => (
              <View key={order.id} style={styles.deviceCard}>
                <View style={styles.deviceHeader}>
                  <View style={[styles.deviceIconCircle, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="bag-check" size={20} color="#166534" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceName}>Mã đơn: {order.code}</Text>
                    <Text style={styles.deviceSub}>
                      {order.date} · {order.notes || 'Mua tại Showroom Lieng'}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    order.status === 'completed' ? styles.statusBadgeActive : styles.statusBadgeExpired,
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      order.status === 'completed' ? styles.statusBadgeTextActive : styles.statusBadgeTextExpired,
                    ]}>
                      {order.status_label}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {order.items.map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>{item.name}</Text>
                      <Text style={{ fontSize: 11, color: '#64748B' }}>Màu: {item.color} {item.imei ? `· IMEI: ${item.imei}` : ''}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#7A0C10' }}>
                      {item.price ? item.price.toLocaleString('vi-VN') + ' đ' : ''}
                    </Text>
                  </View>
                ))}

                <View style={[styles.deviceMetaRow, { marginTop: 4 }]}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Thanh toán</Text>
                    <Text style={[styles.metaValue, { color: order.payment_status === 'paid' ? '#15803D' : '#D97706' }]}>
                      {order.payment_status_label}
                    </Text>
                  </View>
                  <View style={[styles.metaCol, { alignItems: 'flex-end' }]}>
                    <Text style={styles.metaLabel}>Tổng thanh toán</Text>
                    <Text style={[styles.metaValue, { color: '#7A0C10', fontWeight: '900', fontSize: 14 }]}>
                      {order.total.toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

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
              <Text style={styles.menuTitle}>Tra cứu bảo hành toàn quốc</Text>
              <Text style={styles.menuSub}>Kiểm tra 15 số IMEI hoặc số điện thoại</Text>
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

        {/* Chuyển sang chế độ nhân viên & Đăng xuất */}
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
            <Text style={styles.logoutBtnText}>Đăng xuất tài khoản khách hàng</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal Sửa Hồ Sơ */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalBoxTitle}>Chỉnh sửa số điện thoại & thông tin</Text>
            <Text style={styles.modalBoxSub}>
              Hệ thống sẽ tự động đồng bộ máy và phiếu bảo hành điện tử theo số điện thoại này.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Họ và tên"
              value={tempName}
              onChangeText={setTempName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Số điện thoại đăng ký bảo hành"
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
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Lưu & Đồng bộ</Text>
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
  // Warranty Section
  warrantySection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191C1E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A0C10',
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#191C1E',
  },
  deviceSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  imeiCode: {
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeExpired: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadgeTextActive: {
    color: '#15803D',
  },
  statusBadgeTextExpired: {
    color: '#64748B',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  deviceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  orderTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderTagText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  deviceActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  outlineActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F8',
  },
  outlineActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A0C10',
  },
  primaryActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#7A0C10',
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyWarrantyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },
  quickSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginTop: 6,
  },
  quickSearchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A0C10',
  },
  // Menu Groups
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
  modalBoxSub: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
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
