import React from 'react'
import { View, Text } from 'react-native'
import { useThemeStore } from '../../store/themeStore'

export default function ProfileScreen() {
  const { colors } = useThemeStore()
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.textMuted, fontFamily: 'DMSans_400Regular', fontSize: 15 }}>
        Profile — Week 3
      </Text>
    </View>
  )
}