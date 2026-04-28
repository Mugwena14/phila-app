import { TextStyle } from 'react-native'

export const typography: Record<string, TextStyle> = {
  displayXl: {
    fontSize: 32,
    fontFamily: 'Syne_800ExtraBold',
    lineHeight: 36,
  },
  displayLg: {
    fontSize: 24,
    fontFamily: 'Syne_700Bold',
    lineHeight: 28,
  },
  displayMd: {
    fontSize: 20,
    fontFamily: 'Syne_700Bold',
    lineHeight: 24,
  },
  displaySm: {
    fontSize: 16,
    fontFamily: 'Syne_700Bold',
    lineHeight: 20,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Syne_700Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  labelSm: {
    fontSize: 10,
    fontFamily: 'Syne_700Bold',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  bodyLg: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 26,
  },
  bodyMd: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 22,
  },
  bodySm: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 18,
  },
  bodyMedium: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    lineHeight: 22,
  },
  mono: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono_400Regular',
  },
}
