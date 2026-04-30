import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { patientsApi, PatientProfile } from '../../api/patients'
import { spacing, radius } from '../../theme/spacing'

const SETTINGS = [
  { icon: '🔔', label: 'Notifications', sub: 'Appointment reminders' },
  { icon: '🌐', label: 'Language', sub: 'English' },
  { icon: '🔒', label: 'Privacy', sub: 'Manage your data' },
  { icon: '❓', label: 'Help & support', sub: 'FAQs, contact us' },
  { icon: '⭐', label: 'Rate Phila', sub: 'Tell us what you think' },
]

export default function ProfileScreen() {
  const { colors, toggleTheme, isDark } = useThemeStore()
  const { user, logout } = useAuthStore()
  const [healthProfile, setHealthProfile] = useState<PatientProfile | null>(null)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const data = await patientsApi.getProfile()
        setHealthProfile(data)
      } catch {
        // silent fail
      }
    }
    void load()
  }, [])

  const getAge = (): string => {
    if (!healthProfile?.date_of_birth) return '—'
    const birth = new Date(healthProfile.date_of_birth)
    const age = new Date().getFullYear() - birth.getFullYear()
    return String(age)
  }

  const HEALTH_STATS = [
    { label: 'Height', value: healthProfile?.height_cm ? `${healthProfile.height_cm}` : '—', unit: 'cm', icon: '📏' },
    { label: 'Weight', value: healthProfile?.weight_kg ? `${healthProfile.weight_kg}` : '—', unit: 'kg', icon: '⚖️' },
    { label: 'Age', value: getAge(), unit: 'yrs', icon: '🎂' },
    { label: 'Blood', value: healthProfile?.blood_type ?? '—', unit: 'type', icon: '🩸' },
  ]

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'P'

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgBase }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 26, color: colors.text }}>Profile</Text>
        <TouchableOpacity
          onPress={toggleTheme}
          style={{ backgroundColor: colors.bgElevated, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 11, color: colors.textMuted }}>
            {isDark ? '☀️ LIGHT' : '🌙 DARK'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile card */}
      <View style={{ marginHorizontal: spacing.lg, backgroundColor: colors.bgSurface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.lg, alignItems: 'center' }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.goldBg, borderWidth: 3, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
          <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 30, color: colors.gold }}>{initials}</Text>
        </View>
        <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 20, color: colors.text, marginBottom: 4 }}>
          {user?.full_name ?? 'Patient'}
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, marginBottom: spacing.md }}>
          {user?.email ?? ''}
        </Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <View style={{ backgroundColor: colors.tealBg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: colors.tealBorder }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 11, color: colors.teal }}>VERIFIED</Text>
          </View>
          <View style={{ backgroundColor: colors.goldBg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: colors.goldBorder }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 11, color: colors.gold }}>PATIENT</Text>
          </View>
        </View>
      </View>

      {/* Health stats */}
      <View style={{ marginHorizontal: spacing.lg, marginBottom: spacing.lg }}>
        <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text, marginBottom: spacing.md }}>Health info</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {HEALTH_STATS.map((stat) => (
            <View
              key={stat.label}
              style={{ width: '47.5%', backgroundColor: colors.bgSurface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontSize: 22 }}>{stat.icon}</Text>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text }}>{stat.value}</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Account info */}
      <View style={{ marginHorizontal: spacing.lg, backgroundColor: colors.bgSurface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, overflow: 'hidden' }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 11, color: colors.textFaint, letterSpacing: 1.5, textTransform: 'uppercase' }}>Account</Text>
        </View>
        {[
          { label: 'Full name', value: user?.full_name ?? '—', icon: '👤' },
          { label: 'Email', value: user?.email ?? '—', icon: '📧' },
          { label: 'Phone', value: user?.phone ?? '—', icon: '📱' },
          { label: 'Language', value: user?.language_pref ?? 'English', icon: '🌐' },
        ].map((item, i, arr) => (
          <View
            key={item.label}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 14, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border, gap: spacing.md }}
          >
            <Text style={{ fontSize: 18 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textFaint, marginBottom: 2 }}>{item.label}</Text>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text }}>{item.value}</Text>
            </View>
            <Text style={{ color: colors.textFaint }}>›</Text>
          </View>
        ))}
      </View>

      {/* Settings */}
      <View style={{ marginHorizontal: spacing.lg, backgroundColor: colors.bgSurface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, overflow: 'hidden' }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 11, color: colors.textFaint, letterSpacing: 1.5, textTransform: 'uppercase' }}>Settings</Text>
        </View>
        {SETTINGS.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 14, borderBottomWidth: i < SETTINGS.length - 1 ? 1 : 0, borderBottomColor: colors.border, gap: spacing.md }}
            activeOpacity={0.7}
          >
            <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text }}>{item.label}</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textFaint }}>{item.sub}</Text>
            </View>
            <Text style={{ color: colors.textFaint }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <TouchableOpacity
        onPress={() => void logout()}
        style={{ marginHorizontal: spacing.lg, backgroundColor: colors.coralBg, borderRadius: radius.xl, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.coralBorder, marginBottom: spacing.xl }}
      >
        <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.coral }}>Sign out</Text>
      </TouchableOpacity>

      {/* Branding */}
      <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
        <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: colors.gold, marginBottom: 4 }}>Phila</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textFaint }}>Your health, on your terms</Text>
      </View>
    </ScrollView>
  )
}