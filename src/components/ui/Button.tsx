import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '../../store/themeStore'
import { radius } from '../../theme/spacing'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  fullWidth?: boolean
  size?: ButtonSize
  icon?: keyof typeof Ionicons.glyphMap
  iconPosition?: 'left' | 'right'
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
  size = 'md',
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const { colors } = useThemeStore()

  const handlePress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: 9, paddingHorizontal: 18 }
      case 'lg': return { paddingVertical: 17, paddingHorizontal: 32 }
      default: return { paddingVertical: 14, paddingHorizontal: 26 }
    }
  }

  const getFontSize = () => {
    switch (size) {
      case 'sm': return 13
      case 'lg': return 16
      default: return 15
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 14
      case 'lg': return 20
      default: return 17
    }
  }

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      ...getPadding(),
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      opacity: disabled ? 0.45 : 1,
      ...(fullWidth && { alignSelf: 'stretch' }),
    }

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: colors.primary }
      case 'secondary':
        return {
          ...base,
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: colors.borderStrong,
        }
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
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
      case 'primary': return '#FFFFFF'
      case 'outline': return colors.primary
      case 'danger': return colors.coral
      default: return colors.text
    }
  }

  const textColor = getTextColor()

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={getIconSize()} color={textColor} />
          )}
          <Text style={{
            color: textColor,
            fontFamily: 'Syne_700Bold',
            fontSize: getFontSize(),
            letterSpacing: 0.2,
          }}>
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={getIconSize()} color={textColor} />
          )}
        </>
      )}
    </TouchableOpacity>
  )
}