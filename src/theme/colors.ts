export const darkColors = {
  bgBase: '#080F0E',
  bgSurface: '#0D1614',
  bgElevated: '#142420',
  bgHover: '#1C302B',

  // Primary — teal (replaces gold)
  primary: '#14B8A6',
  primaryDim: '#0F8A7B',
  primaryBg: 'rgba(20,184,166,0.08)',
  primaryBorder: 'rgba(20,184,166,0.2)',

  // Keep teal alias so existing code works
  teal: '#14B8A6',
  tealDim: '#0F8A7B',
  tealBg: 'rgba(20,184,166,0.08)',
  tealBorder: 'rgba(20,184,166,0.2)',

  // Secondary blue accent
  blue: '#38BDF8',
  blueBg: 'rgba(56,189,248,0.08)',
  blueBorder: 'rgba(56,189,248,0.2)',

  // Keep gold as a subtle accent only
  gold: '#14B8A6',
  goldDim: '#0F8A7B',
  goldBg: 'rgba(20,184,166,0.08)',
  goldBorder: 'rgba(20,184,166,0.2)',

  coral: '#FF6B6B',
  coralBg: 'rgba(255,107,107,0.08)',
  coralBorder: 'rgba(255,107,107,0.2)',

  text: '#F0F4F3',
  textMuted: '#8FA89E',
  textFaint: '#4A6560',

  border: 'rgba(20,184,166,0.08)',
  borderStrong: 'rgba(20,184,166,0.16)',
} as const

export const lightColors = {
  bgBase: '#F0F7F5',
  bgSurface: '#FFFFFF',
  bgElevated: '#E4F0ED',
  bgHover: '#D4E8E3',

  primary: '#0F766E',
  primaryDim: '#0A5C56',
  primaryBg: 'rgba(15,118,110,0.07)',
  primaryBorder: 'rgba(15,118,110,0.2)',

  teal: '#0F766E',
  tealDim: '#0A5C56',
  tealBg: 'rgba(15,118,110,0.07)',
  tealBorder: 'rgba(15,118,110,0.2)',

  blue: '#0284C7',
  blueBg: 'rgba(2,132,199,0.07)',
  blueBorder: 'rgba(2,132,199,0.2)',

  gold: '#0F766E',
  goldDim: '#0A5C56',
  goldBg: 'rgba(15,118,110,0.07)',
  goldBorder: 'rgba(15,118,110,0.2)',

  coral: '#DC2626',
  coralBg: 'rgba(220,38,38,0.07)',
  coralBorder: 'rgba(220,38,38,0.2)',

  text: '#0A1410',
  textMuted: '#3D6058',
  textFaint: '#7A9E96',

  border: 'rgba(15,118,110,0.08)',
  borderStrong: 'rgba(15,118,110,0.16)',
} as const

export interface ColorTheme {
  bgBase: string
  bgSurface: string
  bgElevated: string
  bgHover: string
  primary: string
  primaryDim: string
  primaryBg: string
  primaryBorder: string
  teal: string
  tealDim: string
  tealBg: string
  tealBorder: string
  blue: string
  blueBg: string
  blueBorder: string
  gold: string
  goldDim: string
  goldBg: string
  goldBorder: string
  coral: string
  coralBg: string
  coralBorder: string
  text: string
  textMuted: string
  textFaint: string
  border: string
  borderStrong: string
}