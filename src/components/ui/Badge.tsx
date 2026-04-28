import React from 'react'
import { View, Text } from 'react-native'
import { useThemeStore } from '../../store/themeStore'
import { radius } from '../../theme/spacing'

type BadgeVariant = 'gold' | 'teal' | 'coral' | 'gray'

interface BadgeColors {
  bg: string
  text: string
  border: string
  dot: string
}

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  dot?: boolean
}

export default function Badge({
  label,
  variant = 'gray',
  dot = false,
}: BadgeProps) {
  const { colors } = useThemeStore()

  const getColors = (): BadgeColors => {
    switch (variant) {
      case 'gold':
        return {
          bg: colors.goldBg,
          text: colors.gold,
          border: colors.goldBorder,
          dot: colors.gold,
        }
      case 'teal':
        return {
          bg: colors.tealBg,
          text: colors.teal,
          border: colors.tealBorder,
          dot: colors.teal,
        }
      case 'coral':
        return {
          bg: colors.coralBg,
          text: colors.coral,
          border: colors.coralBorder,
          dot: colors.coral,
        }
      case 'gray':
        return {
          bg: colors.bgElevated,
          text: colors.textMuted,
          border: colors.border,
          dot: colors.textFaint,
        }
    }
  }

  const c = getColors()

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: c.bg,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: radius.sm,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: 'flex-start',
      }}
    >
      {dot && (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: c.dot,
          }}
        />
      )}
      <Text
        style={{
          color: c.text,
          fontSize: 11,
          fontFamily: 'Syne_700Bold',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  )
}