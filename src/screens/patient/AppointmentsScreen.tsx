import React from 'react'
import { View, Text } from 'react-native'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { useThemeStore } from '../../store/themeStore'
import { PatientTabParamList } from '../../types/index'

type Props = BottomTabScreenProps<PatientTabParamList, 'Appointments'>

export default function AppointmentsScreen(_props: Props) {
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
        Appointments — Week 3
      </Text>
    </View>
  )
}