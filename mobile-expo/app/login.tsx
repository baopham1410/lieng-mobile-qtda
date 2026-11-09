import { Ionicons } from '@expo/vector-icons'
import { Redirect, router } from 'expo-router'
import { useState } from 'react'
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

// ─── Demo accounts ────────────────────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  {
    id: 'quan',
    label: 'Quản lý',
    email: 'quan@liengmobile.com',
    color: Colors.red,
    colorBg: Colors.redSoft,
    colorBorder: Colors.redBorder,
  },
  {
    id: 'banhang',
    label: 'Bán hàng',
    email: 'banhang@liengmobile.com',
    color: Colors.green,
    colorBg: Colors.greenSoft,
    colorBorder: Colors.greenBorder,
  },
  {
    id: 'admin',
    label: 'Admin',
    email: 'admin@liengmobile.com',
    color: Colors.blue,
    colorBg: Colors.blueSoft,
    colorBorder: Colors.blueBorder,
  },
]

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { user, loading, login } = useAuth()
  const { t, locale, setLocale } = useLocale()

  const [email, setEmail] = useState('quan@liengmobile.com')
  const [password, setPassword] = useState('password')
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!loading && user) return <Redirect href="/home" />

  async function onSubmit() {
    setSubmitting(true)
    setError('')
    try {
      await login(email, password)
      router.replace('/home')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('login.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  function quickLogin(acc: (typeof DEMO_ACCOUNTS)[0]) {
    if (submitting) return
    setEmail(acc.email)
    setPassword('password')
    setError('')
    // login ngay sau khi set state — dùng setTimeout để state kịp flush
    setTimeout(async () => {
      setSubmitting(true)
      try {
        await login(acc.email, 'password')
        router.replace('/home')
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
      {/* ── Vòng trang trí góc trên trái ── */}
      <View style={styles.circleTopLeft} pointerEvents="none" />
      {/* ── Vòng trang trí góc dưới phải ── */}
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
            {/* Logo box */}
            <View style={styles.logoBadge}>
              <Text style={styles.logoLetter}>L</Text>
            </View>

            <View style={styles.brandRow}>
              <Text style={styles.brandBlack}>LIENG </Text>
              <Text style={styles.brandRed}>MOBILE</Text>
            </View>

            <Text style={styles.tagline}>
              Hệ thống quản lý cửa hàng điện thoại
            </Text>

            {/* Chọn ngôn ngữ */}
            <View style={styles.langRow}>
              <LangChip code="vi" label={t('common.vietnamese')} />
              <LangChip code="lo" label={t('common.lao')} />
            </View>
          </View>

          {/* ── FORM CARD ── */}
          <View style={styles.card}>
            {/* Tiêu đề nhỏ */}
            <Text style={styles.formEyebrow}>HỆ THỐNG QUẢN LÝ</Text>
            <Text style={styles.formTitle}>Đăng nhập nhân viên</Text>

            <View style={{ height: Space.lg }} />

            {/* Email input */}
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

            {/* Password input */}
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
                onSubmitEditing={onSubmit}
                editable={!submitting}
              />
              <Pressable
                onPress={() => setShowPass(v => !v)}
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

            {/* Error */}
            {!!error && (
              <View style={{ marginTop: Space.md }}>
                <AlertBox message={error} tone="error" />
              </View>
            )}

            {/* Nút đăng nhập */}
            <View style={{ marginTop: Space.lg }}>
              <Pressable
                onPress={onSubmit}
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
                    <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Phân cách */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Đăng nhập nhanh</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Quick login chips */}
            <View style={styles.quickRow}>
              {DEMO_ACCOUNTS.map(acc => (
                <Pressable
                  key={acc.id}
                  onPress={() => quickLogin(acc)}
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

            <Text style={styles.demoHint}>
              Mật khẩu demo:{' '}
              <Text style={styles.demoCode}>password</Text>
            </Text>
          </View>
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

  // ── Vòng trang trí ──
  circleTopLeft: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: Colors.brand,
    opacity: 0.92,
    // gradient effect bằng shadow
    ...Platform.select({
      ios: {
        shadowColor: Colors.brandDeep,
        shadowOpacity: 0.5,
        shadowRadius: 40,
        shadowOffset: { width: 20, height: 20 },
      },
      android: { elevation: 10 },
      default: {},
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand,
        shadowOpacity: 0.4,
        shadowRadius: 40,
        shadowOffset: { width: -20, height: -20 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },

  // ── Content ──
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Space.xl,
    paddingTop: Space.xl,
    gap: Space.lg,
  },

  // ── Header block ──
  headerBlock: {
    alignItems: 'center',
    gap: Space.xs,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand,
        shadowOpacity: 0.45,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  logoLetter: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBlack: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: 2,
  },
  brandRed: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.red,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate,
    textAlign: 'center',
    marginTop: 2,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Space.sm,
  },
  langChip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(122,12,16,0.2)',
    backgroundColor: 'rgba(255,247,247,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  langChipOn: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  langText: {
    fontWeight: '800',
    fontSize: 12,
    color: Colors.slate,
  },
  langTextOn: { color: Colors.white },

  // ── Card ──
  card: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xxl,
    paddingHorizontal: Space.lg,
    paddingTop: Space.xl,
    paddingBottom: Space.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand,
        shadowOpacity: 0.14,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  formEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    color: Colors.slate400,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.ink,
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Input ──
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slate200,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    height: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.ink,
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingLeft: 8,
  },

  // ── Login button ──
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand,
    borderRadius: Radius.full,
    paddingVertical: 14,
    // gradient sẽ dùng màu thuần — React Native không hỗ trợ CSS gradient
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  loginBtnText: {
    color: Colors.white,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1.5,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: Space.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.slate200,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate400,
  },

  // ── Quick login ──
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  quickChipLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  quickChipSub: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.75,
  },

  // ── Demo hint ──
  demoHint: {
    marginTop: Space.sm,
    textAlign: 'center',
    fontSize: 11,
    color: Colors.slate400,
  },
  demoCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: Colors.slate100,
    color: Colors.slate600,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
})
