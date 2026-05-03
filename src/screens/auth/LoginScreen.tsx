import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { isAxiosError } from 'axios'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { spacing } from '../../theme/spacing'

export default function LoginScreen({ navigation }: any) {
  const { colors } = useThemeStore()
  const { setAuth } = useAuthStore()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (): Promise<void> => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      // 1. Get token
      const tokenData = await authApi.login({ email, password })

      // 2. Fetch real user with actual role ← this was missing
      const me = await authApi.me(tokenData.access_token)

      // 3. Store both — role now correctly set
      await setAuth(me, tokenData.access_token)

    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail
        setError(typeof detail === 'string' ? detail : 'Login failed. Check your details.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgBase }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 36, color: colors.gold }}>
            Phila
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.textMuted, marginTop: 4 }}>
            Your health, on your terms
          </Text>
        </View>

        <Input
          label="Email address"
          placeholder="you@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          containerStyle={{ marginBottom: spacing.md }}
        />
        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          containerStyle={{ marginBottom: spacing.base }}
        />

        {error !== '' && (
          <Text style={{ color: colors.coral, fontFamily: 'DMSans_400Regular', fontSize: 13, marginBottom: spacing.base }}>
            {error}
          </Text>
        )}

        <Button label="Sign in" onPress={() => void handleLogin()} loading={loading} fullWidth />

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg, gap: 4 }}>
          <Text style={{ color: colors.textMuted, fontFamily: 'DMSans_400Regular', fontSize: 14 }}>
            No account yet?
          </Text>
          <Text
            style={{ color: colors.gold, fontFamily: 'DMSans_500Medium', fontSize: 14 }}
            onPress={() => navigation.navigate('Register')}
          >
            Sign up
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}