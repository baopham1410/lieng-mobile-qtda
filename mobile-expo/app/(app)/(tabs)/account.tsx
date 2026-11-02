import { Text, View } from 'react-native'

import { Colors, Space } from '@/constants/config'

export default function StubScreen() {
  return (
    <View style={{ flex: 1, padding: Space.lg, backgroundColor: Colors.canvas }}>
      <Text style={{ fontSize: 22, fontWeight: '600', color: '#0f172a' }}>Tai khoan</Text>
      <Text style={{ marginTop: Space.sm, color: '#64748b' }}>
        Stub man hinh — UI that se day o Issue #72 (Hong PR10).
      </Text>
    </View>
  )
}