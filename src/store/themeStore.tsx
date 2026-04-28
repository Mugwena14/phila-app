import React, { createContext, useContext, useState } from 'react'
import { darkColors, lightColors, ColorTheme } from '../theme/colors'

interface ThemeContextType {
  isDark: boolean
  colors: ColorTheme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  colors: darkColors,
  toggleTheme: () => {},
})

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDark, setIsDark] = useState<boolean>(true)

  const toggleTheme = (): void => {
    setIsDark((prev) => !prev)
  }

  const value: ThemeContextType = {
    isDark,
    colors: isDark ? darkColors : lightColors,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeStore(): ThemeContextType {
  return useContext(ThemeContext)
}