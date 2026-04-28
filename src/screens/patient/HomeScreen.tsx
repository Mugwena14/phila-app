import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { spacing } from '../../theme/spacing'
import { PatientTabParamList } from '../../types/index'

type Props = BottomTabScreenProps<PatientTabParamList, 'Home'>

export default function HomeScreen({ navigation: _navigation }: Props) {
  const { colors, toggleTheme, isDark } = useThemeStore()
  const { logout } = useAuthStore()

  const handleLogout = (): void => {
    void logout()
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bgBase,
        padding: spacing.lg,
        paddingTop: 60,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.xxl,
        }}
      >
        <Text
          style={{
            fontFamily: 'Syne_800ExtraBold',
            fontSize: 24,
            color: colors.gold,
          }}
        >
          Phila
        </Text>
        <TouchableOpacity
          onPress={toggleTheme}
          style={{
            backgroundColor: colors.bgElevated,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
              fontFamily: 'Syne_700Bold',
              fontSize: 11,
            }}
          >
            {isDark ? 'LIGHT' : 'DARK'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text
        style={{
          fontFamily: 'Syne_800ExtraBold',
          fontSize: 28,
          color: colors.text,
          marginBottom: 8,
        }}
      >
        Week 1 live ✓
      </Text>
      <Text
        style={{
          fontFamily: 'DMSans_400Regular',
          fontSize: 15,
          color: colors.textMuted,
          lineHeight: 24,
        }}
      >
        Auth, navigation, theme system and base components all running.
        Full home screen comes in Week 3.
      </Text>

      <TouchableOpacity
        onPress={handleLogout}
        style={{ marginTop: spacing.xl }}
      >
        <Text
          style={{
            color: colors.coral,
            fontFamily: 'DMSans_500Medium',
            fontSize: 14,
          }}
        >
          Sign out
        </Text>
      </TouchableOpacity>
    </View>
  )
}