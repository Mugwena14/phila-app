export interface ColorTheme {
  bgBase: string
  bgSurface: string
  bgElevated: string
  bgHover: string
  gold: string
  goldDim: string
  goldBg: string
  goldBorder: string
  teal: string
  tealDim: string
  tealBg: string
  tealBorder: string
  coral: string
  coralBg: string
  coralBorder: string
  text: string
  textMuted: string
  textFaint: string
  border: string
  borderStrong: string
}

export const darkColors: ColorTheme = {
  bgBase: '#09090B',
  bgSurface: '#111114',
  bgElevated: '#18181C',
  bgHover: '#222228',
  gold: '#F0C040',
  goldDim: '#C8960A',
  goldBg: 'rgba(240,192,64,0.08)',
  goldBorder: 'rgba(240,192,64,0.18)',
  teal: '#00D4AA',
  tealDim: '#009E80',
  tealBg: 'rgba(0,212,170,0.08)',
  tealBorder: 'rgba(0,212,170,0.18)',
  coral: '#FF6B4A',
  coralBg: 'rgba(255,107,74,0.08)',
  coralBorder: 'rgba(255,107,74,0.18)',
  text: '#F2F2F0',
  textMuted: '#AAAAAA',
  textFaint: '#666662',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
}

export const lightColors: ColorTheme = {
  bgBase: '#F7F6F2',
  bgSurface: '#EFEEEA',
  bgElevated: '#E7E6E0',
  bgHover: '#DDDCD6',
  gold: '#B07800',
  goldDim: '#8A5C00',
  goldBg: 'rgba(176,120,0,0.07)',
  goldBorder: 'rgba(176,120,0,0.2)',
  teal: '#007A60',
  tealDim: '#005A46',
  tealBg: 'rgba(0,122,96,0.07)',
  tealBorder: 'rgba(0,122,96,0.2)',
  coral: '#C84020',
  coralBg: 'rgba(200,64,32,0.07)',
  coralBorder: 'rgba(200,64,32,0.2)',
  text: '#0D0D0B',
  textMuted: '#5A5A56',
  textFaint: '#9A9A94',
  border: 'rgba(0,0,0,0.07)',
  borderStrong: 'rgba(0,0,0,0.13)',
}