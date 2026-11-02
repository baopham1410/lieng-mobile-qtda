import { Redirect, router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AlertBox, Eyebrow, Field, PrimaryButton } from '@/components/ui'
import { Colors, Radius, Space } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import type { AppLocale } from '@/i18n/messages'

const loginBg = require('../assets/images/login-bg.png')

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { user, loading, login } = useAuth()
  const { t, locale, setLocale } = useLocale()
  const [email, setEmail] = useState('quan@liengmobile.com')
  const [password, setPassword] = useState('password')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!loading && user) return <Redirect href="/quay" />

  async function onSubmit() {
    setSubmitting(true)
    setError('')
    try {
      await login(email, password)
      router.replace('/quay')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('login.failed'))
    } finally {
      setSubmitting(false)
    }
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
    <View style={styles.root}>
      {/* Nền cố định — không co theo keyboard / content */}
      <Image source={loginBg} style={styles.bgImage} resizeMode="cover" />

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
            {
              paddingTop: insets.top + 12,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <View style={styles.stack}>
            <View style={styles.topBlock}>
              <Text style={styles.brandTop}>{t('app.brand')}</Text>
              <Text style={styles.brand}>{t('app.name')}</Text>
              <Text style={styles.sub}>{t('app.tagline')}</Text>

              <View style={styles.langRow}>
                <LangChip code="vi" label={t('common.vietnamese')} />
                <LangChip code="lo" label={t('common.lao')} />
              </View>
            </View>

            <View style={styles.card}>
              <Eyebrow>{t('login.title')}</Eyebrow>
              <Text style={styles.cardTitle}>{t('login.staffArea')}</Text>

              <View style={{ height: Space.lg }} />
              <Field
                label={t('login.email')}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="email@..."
              />
              <View style={{ height: Space.md }} />
              <Field
                label={t('login.password')}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                onSubmitEditing={onSubmit}
              />

              {!!error && (
                <View style={{ marginTop: Space.md }}>
                  <AlertBox message={error} />
                </View>
              )}

              <View style={{ marginTop: Space.xl }}>
                {submitting ? (
                  <View style={styles.btnBusy}>
                    <ActivityIndicator color="#fff" />
                  </View>
                ) : (
                  <PrimaryButton label={t('login.submit')} onPress={onSubmit} />
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5EFE6',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Space.xl,
  },
  stack: {
    gap: Space.lg,
    width: '100%',
  },
  topBlock: {
    alignItems: 'center',
  },
  brandTop: {
    color: Colors.brand,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  brand: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.ink,
    marginTop: 6,
  },
  sub: {
    color: Colors.slate,
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: Space.md,
  },
  langChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(122,12,16,0.18)',
    backgroundColor: 'rgba(255,247,247,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  langChipOn: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  langText: { fontWeight: '800', fontSize: 13, color: Colors.slate },
  langTextOn: { color: Colors.white },
  card: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xxl,
    paddingHorizontal: Space.lg,
    paddingTop: Space.xl,
    paddingBottom: Space.xl + 4,
    minHeight: 340,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.brand,
        shadowOpacity: 0.16,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.ink,
    marginTop: 4,
  },
  btnBusy: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
})
