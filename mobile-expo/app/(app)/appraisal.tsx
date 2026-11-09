import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  AlertBox,
  Card,
  Chip,
  Eyebrow,
  Field,
  MoneyField,
  Muted,
  PrimaryButton,
  ScreenTitle,
} from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { formatMoney, parseMoneyInput } from '@/utils/format'

export default function AppraisalScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [modalVisible, setModalVisible] = useState(false)
  const [brand, setBrand] = useState('Apple')
  const [model, setModel] = useState('')
  const [capacity, setCapacity] = useState('128GB')
  const [condition, setCondition] = useState<'like_new' | 'good' | 'fair'>('good')
  const [accessories, setAccessories] = useState('')
  const [note, setNote] = useState('')
  const [suggestedPrice, setSuggestedPrice] = useState('')

  const handleCreateMock = () => {
    Alert.alert(
      'Tính năng đang phát triển',
      'Chức năng thẩm định máy đang được hoàn thiện backend theo roadmap. Phiếu tạm của bạn chưa gửi lên máy chủ.',
      [{ text: 'Đã hiểu', onPress: () => setModalVisible(false) }]
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space.xxl }]}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color={Colors.ink} />
            <Text style={styles.backBtnText}>Quay lại</Text>
          </Pressable>

          <View style={styles.devBadge}>
            <Ionicons name="construct-outline" size={13} color={Colors.amber900} />
            <Text style={styles.devBadgeText}>ĐANG PHÁT TRIỂN</Text>
          </View>
        </View>

        {/* Title Block */}
        <View style={styles.header}>
          <Eyebrow>THU CŨ ĐỔI MỚI · ĐỊNH GIÁ</Eyebrow>
          <ScreenTitle>Thẩm định máy</ScreenTitle>
          <Muted>
            Hệ thống thẩm định tình trạng và đề xuất mức giá thu mua máy cũ cho quầy.
          </Muted>
        </View>

        {/* Notice Banner */}
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>Lộ trình phát triển (Roadmap TD-01)</Text>
            <Text style={styles.noticeSub}>
              Tính năng đang được chuẩn bị kết nối API với Admin Web Liêng Mobile. Bạn có thể xem trước biểu mẫu thẩm định bên dưới.
            </Text>
          </View>
        </View>

        {/* Empty list with CTA */}
        <Card style={styles.emptyCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="phone-portrait-outline" size={36} color={Colors.brand} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có phiếu thẩm định nào</Text>
          <Text style={styles.emptyHint}>
            Nhân viên quầy có thể tạo phiếu thẩm định để định giá máy cũ khách mang tới cửa hàng.
          </Text>

          <View style={{ marginTop: Space.md, width: '100%' }}>
            <PrimaryButton
              label="+ Tạo phiếu thẩm định thử nghiệm"
              tone="amber"
              icon="add-circle-outline"
              onPress={() => setModalVisible(true)}
            />
          </View>
        </Card>
      </ScrollView>

      {/* Modal Mock Form Thẩm định */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>PHIẾU THẨM ĐỊNH MÁY</Text>
                <Text style={styles.modalTitle}>Tạo phiếu định giá</Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={8}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={Colors.slate} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Field
                label="Hãng sản xuất"
                placeholder="VD: Apple, Samsung, Xiaomi..."
                value={brand}
                onChangeText={setBrand}
              />

              <View style={{ height: Space.sm }} />

              <Field
                label="Dòng máy / Model"
                placeholder="VD: iPhone 13 Pro Max, Galaxy S23..."
                value={model}
                onChangeText={setModel}
              />

              <View style={{ height: Space.sm }} />

              <Field
                label="Dung lượng bộ nhớ"
                placeholder="VD: 128GB, 256GB..."
                value={capacity}
                onChangeText={setCapacity}
              />

              <View style={{ height: Space.sm }} />

              <Text style={styles.fieldLabel}>Tình trạng ngoại quan</Text>
              <View style={styles.chipRow}>
                <Chip
                  label="Như mới (99%)"
                  active={condition === 'like_new'}
                  onPress={() => setCondition('like_new')}
                />
                <Chip
                  label="Đẹp (98%)"
                  active={condition === 'good'}
                  onPress={() => setCondition('good')}
                />
                <Chip
                  label="Cũ / Xước (Cần spa)"
                  active={condition === 'fair'}
                  onPress={() => setCondition('fair')}
                />
              </View>

              <View style={{ height: Space.sm }} />

              <Field
                label="Phụ kiện kèm theo"
                placeholder="Cáp sạc, hộp, củ sạc..."
                value={accessories}
                onChangeText={setAccessories}
              />

              <View style={{ height: Space.sm }} />

              <MoneyField
                label="Giá đề xuất thu mua (VNĐ)"
                placeholder="0"
                value={suggestedPrice}
                onChangeText={setSuggestedPrice}
              />

              <View style={{ height: Space.sm }} />

              <Field
                label="Ghi chú chi tiết lỗi / chức năng"
                placeholder="Màn hình zin, pin 85%, Face ID tốt..."
                value={note}
                onChangeText={setNote}
              />

              <View style={{ marginTop: Space.lg }}>
                <PrimaryButton
                  label="Lưu phiếu (Chờ backend thẩm định)"
                  tone="amber"
                  icon="checkmark-circle-outline"
                  onPress={handleCreateMock}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  content: {
    padding: Space.lg,
    gap: Space.md,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  devBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.amber100,
    borderColor: Colors.amber300,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  devBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.amber900,
    letterSpacing: 0.5,
  },
  header: {
    marginTop: Space.xs,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.panelWarm,
    borderWidth: 1,
    borderColor: Colors.amber200,
    borderRadius: Radius.xl,
    padding: Space.md,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink,
  },
  noticeSub: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
    lineHeight: 18,
  },
  emptyCard: {
    padding: Space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    backgroundColor: Colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.ink,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.slate,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    maxHeight: '90%',
    padding: Space.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Space.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.amber800,
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.ink,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalForm: {
    paddingTop: Space.md,
    paddingBottom: Space.xxl,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
})

