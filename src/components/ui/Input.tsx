import React, { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  ViewStyle,
  TextInputProps,
} from 'react-native'
import { useThemeStore } from '../../store/themeStore'
import { radius, spacing } from '../../theme/spacing'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  containerStyle?: ViewStyle
}

export default function Input({
  label,
  error,
  containerStyle,
  ...props
}: InputProps) {
  const { colors } = useThemeStore()
  const [focused, setFocused] = useState<boolean>(false)

  const borderColor =
    error !== undefined
      ? colors.coral
      : focused
      ? colors.gold
      : colors.borderStrong

  return (
    <View style={containerStyle}>
      {label !== undefined && (
        <Text
          style={{
            color: colors.textMuted,
            fontFamily: 'DMSans_500Medium',
            fontSize: 13,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}

      <TextInput
        style={{
          backgroundColor: colors.bgElevated,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor,
          paddingHorizontal: spacing.base,
          paddingVertical: 13,
          color: colors.text,
          fontFamily: 'DMSans_400Regular',
          fontSize: 15,
        }}
        placeholderTextColor={colors.textFaint}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />

      {error !== undefined && (
        <Text
          style={{
            color: colors.coral,
            fontSize: 12,
            fontFamily: 'DMSans_400Regular',
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  )
}