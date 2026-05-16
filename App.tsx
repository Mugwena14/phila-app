import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import {
  Syne_400Regular,
  Syne_700Bold,
  Syne_800ExtraBold,
} from '@expo-google-fonts/syne'
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans'
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, useThemeStore } from './src/store/themeStore'
import { AuthProvider } from './src/store/authStore'
import Navigation from './src/navigation/Index'

SplashScreen.preventAutoHideAsync()

function AppInner() {
  const { colors, isDark } = useThemeStore()

  const [fontsLoaded] = useFonts({
    Syne_400Regular,
    Syne_700Bold,
    Syne_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    JetBrainsMono_400Regular,
  })

  useEffect(() => {
    const prepare = async (): Promise<void> => {
      if (fontsLoaded) {
        await SplashScreen.hideAsync()
      }
    }
    void prepare()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Navigation />
    </GestureHandlerRootView>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}