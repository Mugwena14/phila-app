import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { useThemeStore } from '../../store/themeStore'
import { radius } from '../../theme/spacing'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  fullWidth?: boolean
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
}: ButtonProps) {
  const { colors } = useThemeStore()

  const handlePress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      paddingVertical: 13,
      paddingHorizontal: 24,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      opacity: disabled ? 0.5 : 1,
      ...(fullWidth && { alignSelf: 'stretch' }),
    }

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: colors.gold }
      case 'secondary':
        return {
          ...base,
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: colors.borderStrong,
        }
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        }
      case 'danger':
        return {
          ...base,
          backgroundColor: colors.coralBg,
          borderWidth: 1,
          borderColor: colors.coralBorder,
        }
    }
  }

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return '#09090B'
      case 'danger':
        return colors.coral
      default:
        return colors.text
    }
  }

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text
          style={{
            color: getTextColor(),
            fontFamily: 'Syne_700Bold',
            fontSize: 14,
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}