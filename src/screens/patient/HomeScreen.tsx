import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { bookingsApi } from '../../api/bookings'
import { doctorsApi } from '../../api/doctors'
import { Booking, Doctor } from '../../types'
import { spacing, radius } from '../../theme/spacing'

const SPECIALTIES = [
  { label: 'General', icon: 'medical-outline' as const, specialty: 'General Practitioner' },
  { label: 'Cardiology', icon: 'heart-outline' as const, specialty: 'Cardiologist' },
  { label: 'Paediatric', icon: 'happy-outline' as const, specialty: 'Pediatrician' },
  { label: 'Neurology', icon: 'pulse-outline' as const, specialty: 'Neurologist' },
  { label: 'Dentist', icon: 'fitness-outline' as const, specialty: 'Dentist' },
  { label: 'Orthopaedic', icon: 'body-outline' as const, specialty: 'Orthopedic Surgeon' },
  { label: 'Dermatology', icon: 'color-palette-outline' as const, specialty: 'Dermatologist' },
  { label: 'Women', icon: 'rose-outline' as const, specialty: 'Gynecologist' },
]

export default function HomeScreen({ navigation }: any) {
  const { colors } = useThemeStore()
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [currentDoctorIndex, setCurrentDoctorIndex] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  const fadeAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(1)).current

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.full_name?.split(' ')[0] ?? 'there'
  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'P'

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const [bookingData, doctorData] = await Promise.all([
          bookingsApi.getMyBookings(),
          doctorsApi.search({}),
        ])
        setBookings(bookingData.filter((b) => b.status === 'confirmed'))
        setDoctors(doctorData)
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  useEffect(() => {
    if (doctors.length <= 1) return

    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -30, duration: 350, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 350, useNativeDriver: true }),
      ]).start(() => {
        setCurrentDoctorIndex((prev) => (prev + 1) % doctors.length)
        slideAnim.setValue(30)
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        ]).start()
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [doctors])

  const upcoming = bookings[0]
  const currentDoctor = doctors[currentDoctorIndex]

  const DOCTOR_BG_COLORS = [
    colors.primaryBg,
    'rgba(56,189,248,0.08)',
    'rgba(167,139,250,0.08)',
    'rgba(251,146,60,0.08)',
    'rgba(52,211,153,0.08)',
  ]

  const DOCTOR_ACCENT_COLORS = [
    colors.primary,
    '#38BDF8',
    '#A78BFA',
    '#FB923C',
    '#34D399',
  ]

  const accentColor = DOCTOR_ACCENT_COLORS[currentDoctorIndex % DOCTOR_ACCENT_COLORS.length]
  const bgColor = DOCTOR_BG_COLORS[currentDoctorIndex % DOCTOR_BG_COLORS.length]

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* ── HEADER ── */}
        <View style={{
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + 16,
          paddingBottom: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: colors.primaryBg,
                borderWidth: 2,
                borderColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.primary }}>
                {initials}
              </Text>
            </TouchableOpacity>
            <View>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.text }}>
                {user?.full_name ?? firstName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>
                  {greeting}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.bgSurface,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            <View style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.coral,
              borderWidth: 1.5,
              borderColor: colors.bgBase,
            }} />
          </TouchableOpacity>
        </View>

        {/* ── UPCOMING APPOINTMENT ── */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
          <Text style={{
            fontFamily: 'DMSans_500Medium',
            fontSize: 13,
            color: colors.textMuted,
            textAlign: 'center',
            marginBottom: spacing.md,
            letterSpacing: 0.5,
          }}>
            Upcoming Appointments
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : upcoming ? (
            // ── STACKED CARDS EFFECT ──
            <View style={{ paddingBottom: 14 }}>

              {/* Card 3 — furthest back */}
              <View style={{
                position: 'absolute',
                bottom: 0,
                left: 20,
                right: 20,
                height: '100%',
                backgroundColor: colors.bgSurface,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: 0.3,
              }} />

              {/* Card 2 — middle */}
              <View style={{
                position: 'absolute',
                bottom: 7,
                left: 10,
                right: 10,
                height: '100%',
                backgroundColor: colors.bgSurface,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                opacity: 0.6,
              }} />

              {/* Main card — front */}
              <View style={{
                backgroundColor: colors.bgSurface,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                padding: spacing.lg,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 8,
              }}>
                {/* Doctor row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.primaryBg,
                    borderWidth: 1,
                    borderColor: colors.primaryBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.md,
                  }}>
                    <Ionicons name="person-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text, marginBottom: 2 }}>
                      {upcoming.practice_name ?? 'Doctor appointment'}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>
                      {upcoming.specialty ?? 'Appointment'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.primary }}>
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Date + time */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>
                      {upcoming.slot_date ?? '—'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>
                      {upcoming.slot_start_time?.slice(0, 5) ?? '—'}
                    </Text>
                  </View>
                </View>

                {/* Buttons — stacked vertically */}
                <View style={{ gap: spacing.sm }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Appointments')}
                    style={{
                      paddingVertical: 12,
                      borderRadius: radius.pill,
                      borderWidth: 1.5,
                      borderColor: colors.borderStrong,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="calendar-outline" size={15} color={colors.text} />
                    <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.text }}>
                      Reschedule
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('Appointments')}
                    style={{
                      paddingVertical: 12,
                      borderRadius: radius.pill,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="eye-outline" size={15} color="#FFFFFF" />
                    <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: '#FFFFFF' }}>
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={{
              backgroundColor: colors.bgSurface,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.lg,
              alignItems: 'center',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm }}>
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              </View>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text, marginBottom: 4 }}>
                No upcoming appointments
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, marginBottom: spacing.md, textAlign: 'center' }}>
                Book your first appointment with a trusted doctor
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Search')}
                style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 24, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Ionicons name="search-outline" size={14} color="#FFFFFF" />
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: '#FFFFFF' }}>Find a doctor</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── DOCTOR SPECIALTY ── */}
        <View style={{ marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text }}>
              Doctor Specialty
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.primary }}>
                View Details
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
          >
            {SPECIALTIES.map((item, index) => {
              const isFirst = index === 0
              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => navigation.navigate('Search', { specialty: item.specialty })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: radius.pill,
                    backgroundColor: isFirst ? colors.primary : colors.bgSurface,
                    borderWidth: 1,
                    borderColor: isFirst ? colors.primary : colors.border,
                    shadowColor: isFirst ? colors.primary : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isFirst ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: isFirst ? 4 : 0,
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={isFirst ? '#FFFFFF' : colors.textMuted}
                  />
                  <Text style={{
                    fontFamily: 'Syne_700Bold',
                    fontSize: 13,
                    color: isFirst ? '#FFFFFF' : colors.textMuted,
                  }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* ── POPULAR DOCTOR ── */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text }}>
              Popular Doctor
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.primary }}>
                View Details
              </Text>
            </TouchableOpacity>
          </View>

          {loading || !currentDoctor ? (
            <View style={{ height: 200, backgroundColor: colors.bgSurface, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <Animated.View style={{
              opacity: fadeAnim,
              transform: [
                { translateX: slideAnim },
                { scale: scaleAnim },
              ],
            }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('DoctorProfile', { doctorId: currentDoctor.id })}
                activeOpacity={0.92}
                style={{
                  backgroundColor: colors.bgSurface,
                  borderRadius: radius.xl,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  overflow: 'hidden',
                  shadowColor: accentColor,
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.2,
                  shadowRadius: 24,
                  elevation: 10,
                }}
              >
                {/* Colored header area */}
                <View style={{
                  backgroundColor: bgColor,
                  padding: spacing.lg,
                  paddingBottom: spacing.xxl,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm }}>
                      <Ionicons name="star" size={14} color={accentColor} />
                      <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: accentColor }}>
                        {currentDoctor.rating > 0 ? currentDoctor.rating.toFixed(1) : '4.8'}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: colors.text, lineHeight: 26, marginBottom: 4 }}>
                      {currentDoctor.practice_name}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted }}>
                      {currentDoctor.specialty}
                    </Text>
                  </View>

                  {/* Avatar */}
                  <View style={{ position: 'relative' }}>
                    <View style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: accentColor + '20',
                      borderWidth: 3,
                      borderColor: accentColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: accentColor,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.4,
                      shadowRadius: 12,
                      elevation: 8,
                    }}>
                      <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 30, color: accentColor }}>
                        {currentDoctor.practice_name.charAt(0)}
                      </Text>
                    </View>
                    <View style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.bgSurface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Ionicons name="heart-outline" size={14} color={colors.textMuted} />
                    </View>
                  </View>
                </View>

                {/* Bottom info */}
                <View style={{ padding: spacing.lg }}>
                  <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>
                        {currentDoctor.city}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>
                        {currentDoctor.slot_duration_minutes}min
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="cash-outline" size={13} color={colors.primary} />
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.primary }}>
                        R{currentDoctor.consultation_fee}
                      </Text>
                    </View>
                  </View>

                  {/* Dot indicators + Book now */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', gap: 5 }}>
                      {doctors.slice(0, Math.min(doctors.length, 5)).map((_, i) => (
                        <View
                          key={i}
                          style={{
                            width: i === currentDoctorIndex % Math.min(doctors.length, 5) ? 20 : 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: i === currentDoctorIndex % Math.min(doctors.length, 5)
                              ? colors.primary
                              : colors.bgElevated,
                            borderWidth: 1,
                            borderColor: i === currentDoctorIndex % Math.min(doctors.length, 5)
                              ? colors.primary
                              : colors.border,
                          }}
                        />
                      ))}
                    </View>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('DoctorProfile', { doctorId: currentDoctor.id })}
                      style={{
                        backgroundColor: colors.primary,
                        borderRadius: radius.pill,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: '#FFFFFF' }}>Book now</Text>
                      <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}