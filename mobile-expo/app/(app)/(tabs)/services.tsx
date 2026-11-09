import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Card, Eyebrow, Muted, PrimaryButton, ScreenTitle } from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'

export default function ServicesScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [imeiInput, setImeiInput] = useState('')

  const handleLookupImei = () => {
    if (!imeiInput.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập 15 số IMEI của máy để tra cứu.')
      return
    }
    Alert.alert(
      'Kết quả tra cứu IMEI: ' + imeiInput,
      'Thiết bị: iPhone 13 128GB Midnight\nTrạng thái: Chính hãng VN/A\nThời hạn bảo hành: Đến 15/12/2026\nLịch sử sửa chữa: Chưa từng sửa chữa.',
      [{ text: 'Đóng' }]
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}>
        <View style={styles.header}>
          <Eyebrow>DỊCH VỤ CỬA HÀNG</Eyebrow>
          <ScreenTitle>Bảo hành & Thẩm định</ScreenTitle>
          <Muted>Trung tâm tiếp nhận bảo hành máy, tra cứu IMEI và định giá thu cũ</Muted>
        </View>

        {/* Khung tra cứu nhanh IMEI */}
        <Card style={styles.lookupCard}>
          <View style={styles.lookupTitleRow}>
            <Ionicons name="barcode-outline" size={18} color={Colors.brand} />
            <Text style={styles.lookupTitle}>Tra cứu bảo hành nhanh theo IMEI</Text>
          </View>
          <Text style={styles.lookupDesc}>
            Nhập 15 ký tự số IMEI trên thân máy hoặc trong Cài đặt chung của khách.
          </Text>

          <View style={styles.lookupInputRow}>
            <TextInput
              style={styles.lookupInput}
              placeholder="Nhập số IMEI (VD: 35689100...)"
              placeholderTextColor={Colors.slate400}
              keyboardType="number-pad"
              maxLength={15}
              value={imeiInput}
              onChangeText={setImeiInput}
            />
            <Pressable onPress={handleLookupImei} style={styles.lookupBtn}>
              <Ionicons name="search" size={16} color={Colors.white} />
              <Text style={styles.lookupBtnText}>Kiểm tra</Text>
            </Pressable>
          </View>
        </Card>

        {/* 2 Phân hệ chính của Hub */}
        <View style={styles.servicesGrid}>
          {/* Phân hệ 1: Thẩm định máy cũ (AutoGrade #125) */}
          <Pressable
            onPress={() => router.push('/(app)/appraisal')}
            style={({ pressed }) => [styles.serviceBox, pressed && { opacity: 0.88 }]}
          >
            <View style={styles.serviceHeader}>
              <View style={[styles.serviceIconWrap, { backgroundColor: Colors.amber100 }]}>
                <Ionicons name="phone-portrait-outline" size={24} color={Colors.amber900} />
              </View>
              <View style={styles.devTag}>
                <Text style={styles.devTagText}>Mục #125</Text>
              </View>
            </View>

            <Text style={styles.serviceName}>Thẩm định máy cũ</Text>
            <Text style={styles.serviceDesc}>
              Định giá máy cũ khách mang đến quầy. Phân loại ngoại quan (99%, 98%), kiểm tra chức năng và đề xuất giá thu mua.
            </Text>

            <View style={styles.serviceActionRow}>
              <Text style={styles.serviceActionText}>Mở biểu mẫu thẩm định →</Text>
            </View>
          </Pressable>

          {/* Phân hệ 2: Bảo hành & Tiếp nhận sửa chữa (Warranty #124) */}
          <Pressable
            onPress={() =>
              Alert.alert(
                'Bảo hành máy (Mục #124)',
                'Chức năng quản lý phiếu tiếp nhận bảo hành máy đang được kết nối với API backend của Admin Liêng Mobile.',
                [{ text: 'Đã hiểu' }]
              )
            }
            style={({ pressed }) => [styles.serviceBox, pressed && { opacity: 0.88 }]}
          >
            <View style={styles.serviceHeader}>
              <View style={[styles.serviceIconWrap, { backgroundColor: Colors.blueSoft }]}>
                <Ionicons name="shield-checkmark-outline" size={24} color={Colors.blueDeep} />
              </View>
              <View style={[styles.devTag, { backgroundColor: Colors.blueSoft, borderColor: Colors.blueBorder }]}>
                <Text style={[styles.devTagText, { color: Colors.blueDeep }]}>Mục #124</Text>
              </View>
            </View>

            <Text style={styles.serviceName}>Tiếp nhận bảo hành</Text>
            <Text style={styles.serviceDesc}>
              Lập biên nhận bảo hành, ghi nhận tình trạng máy lỗi (màn hình, nguồn, pin), in phiếu hẹn ngày trả cho khách.
            </Text>

            <View style={styles.serviceActionRow}>
              <Text style={[styles.serviceActionText, { color: Colors.blueDeep }]}>
                Tạo phiếu tiếp nhận →
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
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
  header: {
    marginBottom: Space.xs,
  },
  lookupCard: {
    backgroundColor: Colors.white,
    padding: Space.md,
    borderRadius: Radius.xl,
    borderColor: Colors.border,
    borderWidth: 1,
    shadowColor: Colors.brand,
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  lookupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  lookupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
  },
  lookupDesc: {
    fontSize: 11,
    color: Colors.slate,
    lineHeight: 16,
    marginBottom: 10,
  },
  lookupInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lookupInput: {
    flex: 1,
    backgroundColor: Colors.panelWarm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.amber200,
    paddingHorizontal: 12,
    fontSize: 13,
    color: Colors.ink,
  },
  lookupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  lookupBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  servicesGrid: {
    gap: Space.md,
    marginTop: Space.xs,
  },
  serviceBox: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.brand,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devTag: {
    backgroundColor: Colors.amber100,
    borderColor: Colors.amber300,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  devTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.amber900,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.ink,
  },
  serviceDesc: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 4,
    lineHeight: 18,
  },
  serviceActionRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  serviceActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.brand,
  },
})
