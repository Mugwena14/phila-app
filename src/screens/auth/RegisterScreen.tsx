import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { isAxiosError } from 'axios'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { spacing } from '../../theme/spacing'
import { RootStackParamList, User } from '../../types/index'

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>

export default function RegisterScreen({ navigation }: any) {
  const { colors } = useThemeStore()
  const { setAuth } = useAuthStore()

  const [fullName, setFullName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleRegister = async (): Promise<void> => {
    if (
      fullName.trim() === '' ||
      email.trim() === '' ||
      phone.trim() === '' ||
      password.trim() === ''
    ) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const newUser = await authApi.register({
        full_name: fullName,
        email,
        phone,
        password,
      })

      const tokenData = await authApi.login({ email, password })

      const user: User = {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        language_pref: 'en',
      }

      await setAuth(user, tokenData.access_token)
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail
        setError(
          typeof detail === 'string' ? detail : 'Registration failed.'
        )
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
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: spacing.xl }}>
          <Text
            style={{
              fontFamily: 'Syne_800ExtraBold',
              fontSize: 28,
              color: colors.text,
              marginBottom: 6,
            }}
          >
            Create account
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 15,
              color: colors.textMuted,
            }}
          >
            Join Phila — it takes 30 seconds
          </Text>
        </View>

        <Input
          label="Full name"
          placeholder="Thabo Dlamini"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          autoComplete="name"
          containerStyle={{ marginBottom: spacing.md }}
        />
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
          label="Phone number (WhatsApp)"
          placeholder="+27 82 000 0000"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          containerStyle={{ marginBottom: spacing.md }}
        />
        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          containerStyle={{ marginBottom: spacing.base }}
        />

        {error !== '' && (
          <Text
            style={{
              color: colors.coral,
              fontFamily: 'DMSans_400Regular',
              fontSize: 13,
              marginBottom: spacing.base,
            }}
          >
            {error}
          </Text>
        )}

        <Button
          label="Create account"
          onPress={() => void handleRegister()}
          loading={loading}
          fullWidth
        />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: spacing.lg,
            gap: 4,
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
              fontFamily: 'DMSans_400Regular',
              fontSize: 14,
            }}
          >
            Already have an account?
          </Text>
          <Text
            style={{
              color: colors.gold,
              fontFamily: 'DMSans_500Medium',
              fontSize: 14,
            }}
            onPress={() => navigation.navigate('Login')}
          >
            Sign in
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}