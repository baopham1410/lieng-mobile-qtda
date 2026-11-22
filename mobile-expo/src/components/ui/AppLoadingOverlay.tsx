import { useEffect, useRef } from 'react'
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { Colors, Radius, Space } from '@/constants/config'
import { LIENG_LOGO } from '@/constants/assets'

interface AppLoadingOverlayProps {
  visible: boolean
  title?: string
  message?: string
}

export function AppLoadingOverlay({
  visible,
  title = 'Liêng Mobile',
  message = 'Đang tải dữ liệu...',
}: AppLoadingOverlayProps) {
  const spinOuter = useRef(new Animated.Value(0)).current
  const spinInner = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      spinOuter.setValue(0)
      spinInner.setValue(0)

      const outerAnim = Animated.loop(
        Animated.timing(spinOuter, {
          toValue: 1,
          duration: 950,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
        })
      )

      const innerAnim = Animated.loop(
        Animated.timing(spinInner, {
          toValue: 1,
          duration: 750,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
        })
      )

      outerAnim.start()
      innerAnim.start()

      return () => {
        outerAnim.stop()
        innerAnim.stop()
      }
    }
  }, [visible, spinOuter, spinInner])

  const spinOuterDeg = spinOuter.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const spinInnerDeg = spinInner.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  })

  if (!visible) return null

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View style={styles.overlayBackdrop}>
        <View style={styles.loadingCard}>
          {/* Spinner đồng bộ 100% với Web Admin */}
          <View style={styles.spinnerBox}>
            {/* Vòng xoay ngoài */}
            <Animated.View
              style={[
                styles.ringOuter,
                { transform: [{ rotate: spinOuterDeg }] },
              ]}
            />
            {/* Vòng xoay trong */}
            <Animated.View
              style={[
                styles.ringInner,
                { transform: [{ rotate: spinInnerDeg }] },
              ]}
            />
            {/* Logo quán chính giữa */}
            <View style={styles.coreLogoWrap}>
              <Image
                source={LIENG_LOGO}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Tiêu đề & Thông điệp */}
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(253, 242, 242, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space.lg,
  },
  loadingCard: {
    minWidth: 230,
    paddingVertical: 26,
    paddingHorizontal: 30,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#7A0C10',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  spinnerBox: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  ringOuter: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3.5,
    borderColor: 'transparent',
    borderTopColor: '#DC2626',
    borderRightColor: 'rgba(220, 38, 38, 0.35)',
  },
  ringInner: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: 'transparent',
    borderBottomColor: '#7A0C10',
    borderLeftColor: 'rgba(122, 12, 16, 0.35)',
  },
  coreLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A0C10',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  logoImage: {
    width: 30,
    height: 30,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7A0C10',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
})
