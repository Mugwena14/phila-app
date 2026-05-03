import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'

export default function DoctorProfileHomeScreen() {
  const { colors, isDark, toggleTheme } = useThemeStore()
  const { user, logout } = useAuthStore()
  const insets = useSafeAreaInsets()

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ])
  }

  const MenuItem = ({ icon, label, onPress, destructive = false }: { icon: string; label: string; onPress: () => void; destructive?: boolean }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: colors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 8 }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: destructive ? 'rgba(220,38,38,0.08)' : colors.bgElevated, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon as any} size={18} color={destructive ? '#DC2626' : colors.textMuted} />
      </View>
      <Text style={{ flex: 1, fontFamily: 'DMSans_500Medium', fontSize: 14, color: destructive ? '#DC2626' : colors.text }}>{label}</Text>
      {!destructive && <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />}
    </TouchableOpacity>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 40 }}>

        {/* Profile header */}
        <View style={{ backgroundColor: colors.bgSurface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 24, alignItems: 'center' }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryBg, borderWidth: 2, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 28, color: colors.primary }}>
              {user?.full_name?.charAt(0)?.toUpperCase() ?? 'D'}
            </Text>
          </View>
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text, marginBottom: 4 }}>
            Dr. {user?.full_name ?? 'Doctor'}
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>{user?.email}</Text>
          <View style={{ marginTop: 10, backgroundColor: colors.primaryBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: colors.primaryBorder }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.primary }}>Doctor account</Text>
          </View>
        </View>

        {/* Menu */}
        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Preferences</Text>

        <MenuItem
          icon={isDark ? 'sunny-outline' : 'moon-outline'}
          label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onPress={toggleTheme}
        />

        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 16 }}>Account</Text>

        <MenuItem icon="log-out-outline" label="Sign out" onPress={handleLogout} destructive />

        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textFaint, textAlign: 'center', marginTop: 24 }}>
          Phila Health · Doctor app
        </Text>
      </ScrollView>
    </View>
  )
}