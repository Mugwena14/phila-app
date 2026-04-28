import React from 'react'
import { View, ViewStyle, TouchableOpacity } from 'react-native'
import { useThemeStore } from '../../store/themeStore'
import { radius, spacing } from '../../theme/spacing'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  onPress?: () => void
  padded?: boolean
}

export default function Card({
  children,
  style,
  onPress,
  padded = true,
}: CardProps) {
  const { colors } = useThemeStore()

  const cardStyle: ViewStyle = {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...(padded && { padding: spacing.base }),
    ...style,
  }

  if (onPress !== undefined) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return <View style={cardStyle}>{children}</View>
}