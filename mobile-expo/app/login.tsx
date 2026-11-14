import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AlertBox } from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import type { AppLocale } from '@/i18n/messages'
import type { AppUser } from '@/types'

const REMEMBER_EMAIL_KEY = 'lieng_remember_email'

const DEMO_ACCOUNTS = [
  {
    id: 'banhang',
    label: 'Bán hàng (POS)',
    email: 'banhang@liengmobile.com',
    color: Colors.greenDeep,
    colorBg: Colors.greenSoft,
    colorBorder: Colors.greenBorder,
  },
  {
    id: 'kho',
    label: 'Thủ kho (IMEI)',
    email: 'kho@liengmobile.com',
    color: Colors.amber900,
    colorBg: Colors.amber100,
    colorBorder: Colors.amber200,
  },
  {
    id: 'admin',
    label: 'Quản trị viên',
    email: 'admin@liengmobile.com',
    color: Colors.redDeep,
    colorBg: Colors.redSoft,
    colorBorder: Colors.redBorder,
  },
  {
    id: 'quan',
    label: 'Chủ quán (Quản lý)',
    email: 'quan@liengmobile.com',
    color: Colors.blueDeep,
    colorBg: Colors.blueSoft,
    colorBorder: Colors.blueBorder,
  },
]

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { user, loading, login } = useAuth()
  const { t, locale, setLocale } = useLocale()

  const [mode, setMode] = useState<'customer' | 'staff'>('customer')

  // Customer state
  const [customerPhone, setCustomerPhone] = useState('0988.777.666')
  const [customerName, setCustomerName] = useState('Trần Quốc Bảo')

  // Staff state
  const [email, setEmail] = useState('banhang@liengmobile.com')
  const [password, setPassword] = useState('password')
  const [remember, setRemember] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    AsyncStorage.getItem(REMEMBER_EMAIL_KEY).then((saved) => {
      if (saved) {
        setEmail(saved)
        setRemember(true)
      }
    })
  }, [])

  function handleCustomerLogin() {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      router.replace('/(customer)/(tabs)/home' as any)
    }, 300)
  }

  function handleGuestBrowse() {
    router.replace('/(customer)/(tabs)/home' as any)
  }

  async function onStaffSubmit() {
    setSubmitting(true)
    setError('')
    try {
      if (remember) {
        await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, email)
      } else {
        await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY)
      }
      const loggedUser = await login(email, password)
      router.replace('/(app)/(tabs)/home' as any)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('login.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  function quickStaffLogin(acc: (typeof DEMO_ACCOUNTS)[0]) {
    if (submitting) return
    setEmail(acc.email)
    setPassword('password')
    setError('')
    setTimeout(async () => {
      setSubmitting(true)
      try {
        const loggedUser = await login(acc.email, 'password')
        router.replace('/(app)/(tabs)/home' as any)
      } catch (e) {
        setError(e instanceof Error ? e.message : t('login.failed'))
      } finally {
        setSubmitting(false)
      }
    }, 50)
  }

  function LangChip({ code, label }: { code: AppLocale; label: string }) {
    const on = locale === code
    return (
      <Pressable
        onPress={() => setLocale(code)}
        style={[styles.langChip, on && styles.langChipOn]}
      >
        <Text style={[styles.langText, on && styles.langTextOn]}>{label}</Text>
      </Pressable>
    )
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.circleTopLeft} pointerEvents="none" />
      <View style={styles.circleBottomRight} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          bounces={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 16, 32) },
          ]}
        >
          {/* ── HEADER: Logo + Brand ── */}
          <View style={styles.headerBlock}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoLetter}>L</Text>
            </View>

            <View style={styles.brandRow}>
              <Text style={styles.brandBlack}>LIENG </Text>
              <Text style={styles.brandRed}>MOBILE</Text>
            </View>

            <Text style={styles.tagline}>
              Hệ thống bán lẻ điện thoại & dịch vụ thu cũ đổi mới
            </Text>

            <View style={styles.langRow}>
              <LangChip code="vi" label={t('common.vietnamese')} />
              <LangChip code="lo" label={t('common.lao')} />
            </View>
          </View>

          {/* ── TABS CHUYỂN ĐỔI CHẾ ĐỘ: KHÁCH HÀNG VS NHÂN VIÊN ── */}
          <View style={styles.modeSwitchWrap}>
            <Pressable
              style={[styles.modeTab, mode === 'customer' && styles.modeTabActive]}
              onPress={() => {
                setMode('customer')
                setError('')
              }}
            >
              <Ionicons
                name="person"
                size={16}
                color={mode === 'customer' ? '#7A0C10' : '#64748B'}
              />
              <Text
                style={[
                  styles.modeTabText,
                  mode === 'customer' && styles.modeTabTextActive,
                ]}
              >
                Khách hàng
              </Text>
            </Pressable>

            <Pressable
              style={[styles.modeTab, mode === 'staff' && styles.modeTabActive]}
              onPress={() => {
                setMode('staff')
                setError('')
              }}
            >
              <Ionicons
                name="briefcase"
                size={16}
                color={mode === 'staff' ? '#7A0C10' : '#64748B'}
              />
              <Text
                style={[
                  styles.modeTabText,
                  mode === 'staff' && styles.modeTabTextActive,
                ]}
              >
                Nhân viên nội bộ
              </Text>
            </Pressable>
          </View>

          {/* ── CHẾ ĐỘ 1: KHÁCH HÀNG (B2C) ── */}
          {mode === 'customer' ? (
            <View style={styles.card}>
              <Text style={styles.formEyebrow}>CỬA HÀNG & DỊCH VỤ</Text>
              <Text style={styles.formTitle}>Trải nghiệm khách hàng</Text>

              <Text style={styles.customerNotice}>
                Đăng nhập để xem danh sách máy đang giữ, theo dõi phiếu thu cũ đổi mới và bảo hành điện tử.
              </Text>

              <View style={{ height: Space.md }} />

              <View style={styles.inputWrap}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={Colors.slate400}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số điện thoại của bạn"
                  placeholderTextColor={Colors.slate400}
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                />
              </View>

              <View style={{ height: Space.sm }} />

              <View style={styles.inputWrap}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={Colors.slate400}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Họ và tên (tùy chọn)"
                  placeholderTextColor={Colors.slate400}
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>

              <View style={{ marginTop: Space.md }}>
                <Pressable
                  onPress={handleCustomerLogin}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.loginBtn,
                    pressed && { opacity: 0.88 },
                  ]}
                >
                  <Ionicons name="arrow-forward-circle" size={18} color="#fff" />
                  <Text style={styles.loginBtnText}>TIẾP TỤC VỚI SỐ ĐIỆN THOẠI</Text>
                </Pressable>
              </View>

              {/* Nút xem vãng lai không cần đăng nhập */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Hoặc xem trực tiếp</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                onPress={handleGuestBrowse}
                style={({ pressed }) => [
                  styles.guestBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="storefront" size={18} color="#7A0C10" />
                <Text style={styles.guestBtnText}>XEM CỬA HÀNG (KHÁCH VÃNG LAI)</Text>
              </Pressable>
            </View>
          ) : (
            /* ── CHẾ ĐỘ 2: NHÂN VIÊN SHOWROOM (B2B) ── */
            <View style={styles.card}>
              <Text style={styles.formEyebrow}>HỆ THỐNG NỘI BỘ</Text>
              <Text style={styles.formTitle}>Đăng nhập nhân viên</Text>

              <View style={{ height: Space.lg }} />

              <View style={styles.inputWrap}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={Colors.slate400}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email nhân viên"
                  placeholderTextColor={Colors.slate400}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  editable={!submitting}
                />
              </View>

              <View style={{ height: Space.sm }} />

              <View style={styles.inputWrap}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={Colors.slate400}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Mật khẩu"
                  placeholderTextColor={Colors.slate400}
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={onStaffSubmit}
                  editable={!submitting}
                />
                <Pressable
                  onPress={() => setShowPass((v) => !v)}
                  hitSlop={8}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.slate400}
                  />
                </Pressable>
              </View>

              <View style={styles.rememberRow}>
                <Pressable
                  onPress={() => setRemember(!remember)}
                  style={styles.rememberPressable}
                >
                  <View style={[styles.checkbox, remember && styles.checkboxActive]}>
                    {remember && <Ionicons name="checkmark" size={12} color={Colors.white} />}
                  </View>
                  <Text style={styles.rememberText}>Ghi nhớ tài khoản</Text>
                </Pressable>
              </View>

              {!!error && (
                <View style={{ marginTop: Space.md }}>
                  <AlertBox message={error} tone="error" />
                </View>
              )}

              <View style={{ marginTop: Space.lg }}>
                <Pressable
                  onPress={onStaffSubmit}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.loginBtn,
                    pressed && { opacity: 0.88 },
                    submitting && { opacity: 0.65 },
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="log-in-outline" size={18} color="#fff" />
                      <Text style={styles.loginBtnText}>ĐĂNG NHẬP NỘI BỘ</Text>
                    </>
                  )}
                </Pressable>
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Tài khoản demo nội bộ</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.quickRow}>
                {DEMO_ACCOUNTS.map((acc) => (
                  <Pressable
                    key={acc.id}
                    onPress={() => quickStaffLogin(acc)}
                    disabled={submitting}
                    style={({ pressed }) => [
                      styles.quickChip,
                      {
                        backgroundColor: acc.colorBg,
                        borderColor: acc.colorBorder,
                      },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Text style={[styles.quickChipLabel, { color: acc.color }]}>
                      {acc.label}
                    </Text>
                    <Text style={[styles.quickChipSub, { color: acc.color }]}>
                      {acc.email.split('@')[0]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  flex: { flex: 1 },
  circleTopLeft: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: Colors.brand,
    opacity: 0.92,
  },
  circleBottomRight: {
    position: 'absolute',
    bottom: -140,
    right: -140,
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: Colors.brandSoft,
    opacity: 0.85,
  },
  content: {
    paddingHorizontal: Space.xl,
    paddingTop: Space.xxl,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: Space.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  logoLetter: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.brand,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandBlack: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: 0.5,
  },
  brandRed: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 12.5,
    color: Colors.slate500,
    marginTop: Space.xs,
    textAlign: 'center',
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Space.md,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#ECEEF0',
  },
  langChipOn: {
    backgroundColor: Colors.brand,
  },
  langText: {
    fontSize: 12,
    color: Colors.slate600,
    fontWeight: '600',
  },
  langTextOn: {
    color: Colors.white,
    fontWeight: '700',
  },
  modeSwitchWrap: {
    flexDirection: 'row',
    backgroundColor: '#ECEEF0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#7A0C10',
    fontWeight: '800',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  formEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.brand,
    letterSpacing: 1,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.ink,
    marginTop: 2,
  },
  customerNotice: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginTop: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.ink,
  },
  eyeBtn: {
    padding: 8,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Space.md,
  },
  rememberPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.slate400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  rememberText: {
    fontSize: 12.5,
    color: Colors.slate600,
  },
  loginBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ECEEF0',
  },
  dividerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  guestBtn: {
    backgroundColor: '#FFF8F8',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  guestBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7A0C10',
    letterSpacing: 0.5,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  quickChip: {
    flex: 1,
    minWidth: '47%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickChipLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickChipSub: {
    fontSize: 10.5,
    opacity: 0.75,
    marginTop: 2,
  },
})
