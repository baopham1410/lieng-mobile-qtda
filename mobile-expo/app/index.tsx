import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'

import { Colors } from '@/constants/config'
import { useAuth } from '@/context/AuthContext'

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.canvas,
        }}
      >
        <ActivityIndicator color={Colors.amber} />
      </View>
    )
  }

  return <Redirect href={user ? '/home' : '/login'} />
}
