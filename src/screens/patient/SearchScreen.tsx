import React from 'react'
import { View, Text } from 'react-native'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { useThemeStore } from '../../store/themeStore'
import { PatientTabParamList } from '../../types/index'

type Props = BottomTabScreenProps<PatientTabParamList, 'Search'>

export default function SearchScreen(_props: Props) {
  const { colors } = useThemeStore()

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bgBase,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: colors.textMuted,
          fontFamily: 'DMSans_400Regular',
          fontSize: 15,
        }}
      >
        Search — Week 3
      </Text>
    </View>
  )
}