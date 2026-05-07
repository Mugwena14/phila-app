import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { doctorsApi } from '../../api/doctors'
import { Doctor, Slot } from '../../types'
import { spacing, radius } from '../../theme/spacing'
import { Ionicons } from '@expo/vector-icons'

const DATE_OPTIONS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() + i)
  return {
    dayName: d.toLocaleDateString('en-ZA', { weekday: 'short' }),
    dayNum: d.getDate(),
    month: d.toLocaleDateString('en-ZA', { month: 'short' }),
    value: d.toISOString().split('T')[0],
  }
})

const SLOTS_PER_PAGE = 9

export default function DoctorProfileScreen({ navigation, route }: any) {
  const { colors } = useThemeStore()
  const { doctorId } = route.params
  const insets = useSafeAreaInsets()
  const bottomPad = Math.max(insets.bottom, 16)

  const [doctor, setDoctor]           = useState<Doctor | null>(null)
  const [slots, setSlots]             = useState<Slot[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(DATE_OPTIONS[0].value)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [loading, setLoading]         = useState<boolean>(true)
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false)
  const [slotPage, setSlotPage]       = useState<number>(0)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const data = await doctorsApi.getById(doctorId)
        setDoctor(data)
        await loadSlots(data.id, selectedDate)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [doctorId])

  const loadSlots = async (id: string, date: string): Promise<void> => {
    setSlotsLoading(true)
    setSlotPage(0)
    try {
      const data = await doctorsApi.getSlots(id, date)
      setSlots(data)
      setSelectedSlot(null)
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleDateSelect = (date: string): void => {
    setSelectedDate(date)
    if (doctor) void loadSlots(doctor.id, date)
  }

  const formatTime = (timeStr: string): string => {
    const hour = parseInt(timeStr.slice(0, 2))
    const minutes = timeStr.slice(3, 5)
    const isPM = hour >= 12
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${isPM ? 'PM' : 'AM'}`
  }

  const totalPages = Math.ceil(slots.length / SLOTS_PER_PAGE)
  const pagedSlots = slots.slice(slotPage * SLOTS_PER_PAGE, (slotPage + 1) * SLOTS_PER_PAGE)

  if (loading || !doctor) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO HEADER ── */}
        <View style={{
          backgroundColor: colors.bgSurface,
          paddingBottom: spacing.xl,
          marginBottom: spacing.lg,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          borderBottomWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}>
          <View style={{ height: 3, backgroundColor: colors.primary }} />

          {/* Back button */}
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: 52, paddingBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={18} color={colors.text} />
            </TouchableOpacity>
            <View style={{ backgroundColor: colors.bgElevated, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>Doctor profile</Text>
            </View>
          </View>

          {/* Avatar + info */}
          <View style={{ alignItems: 'center', paddingHorizontal: spacing.lg }}>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryBg, borderWidth: 3, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
              <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 32, color: colors.primary }}>
                {doctor.practice_name.charAt(0)}
              </Text>
            </View>
            <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: colors.text, marginBottom: 4, textAlign: 'center' }}>
              {doctor.practice_name}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm }}>
              {doctor.specialty}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.lg }}>
              <Ionicons name="star" size={14} color={colors.primary} />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: colors.primary }}>4.8</Text>
              <Text style={{ color: colors.textFaint }}>·</Text>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>
                {doctor.city}, {doctor.province}
              </Text>
            </View>

            {/* Stats row */}
            <View style={{ flexDirection: 'row', gap: spacing.sm, width: '100%' }}>
              {[
                { label: 'Experience', value: `${doctor.years_experience}yrs` },
                { label: 'Fee',        value: `R${doctor.consultation_fee}` },
                { label: 'Duration',   value: `${doctor.slot_duration_minutes}min` },
              ].map((stat, i) => (
                <View key={stat.label} style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: i === 1 ? colors.primary : colors.text, marginBottom: 2 }}>
                    {stat.value}
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>

          {/* ── ABOUT ── */}
          {doctor.bio && (
            <View style={{ marginBottom: spacing.xl }}>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text, marginBottom: spacing.sm }}>About</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, lineHeight: 22 }}>
                {doctor.bio}
              </Text>
            </View>
          )}

          {/* ── MEDICAL AIDS ── */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text, marginBottom: spacing.sm }}>
              Medical aids accepted
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {doctor.medical_aids.map((aid) => (
                <View key={aid} style={{ backgroundColor: colors.primaryBg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: colors.primaryBorder }}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.primary }}>{aid}</Text>
                </View>
              ))}
              {doctor.medical_aids.length === 0 && (
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>Cash patients accepted</Text>
              )}
            </View>
          </View>

          {/* ── SELECT DATE ── */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text, marginBottom: spacing.md }}>
              Select date
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, paddingVertical: 4 }}
            >
              {DATE_OPTIONS.map((d) => {
                const isSelected = selectedDate === d.value
                return (
                  <TouchableOpacity
                    key={d.value}
                    onPress={() => handleDateSelect(d.value)}
                    activeOpacity={0.75}
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 52,
                      paddingVertical: 12,
                      borderRadius: 16,
                      backgroundColor: isSelected ? colors.primary : colors.bgSurface,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{
                      fontFamily: 'Syne_800ExtraBold',
                      fontSize: 20,
                      color: isSelected ? '#FFFFFF' : colors.text,
                      lineHeight: 24,
                    }}>
                      {d.dayNum}
                    </Text>
                    <Text style={{
                      fontFamily: 'DMSans_500Medium',
                      fontSize: 11,
                      color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textMuted,
                      marginTop: 2,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}>
                      {d.dayName}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* ── SELECT TIME ── */}
          <View style={{ marginBottom: spacing.md }}>

            {/* Header — slot count + arrows */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text }}>
                Select time
              </Text>
              {slots.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <TouchableOpacity
                    onPress={() => setSlotPage(p => Math.max(0, p - 1))}
                    disabled={slotPage === 0}
                    style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: slotPage === 0 ? colors.bgElevated : colors.primaryBg,
                      borderWidth: 1,
                      borderColor: slotPage === 0 ? colors.border : colors.primaryBorder,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={14}
                      color={slotPage === 0 ? colors.textFaint : colors.primary}
                    />
                  </TouchableOpacity>

                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.textMuted }}>
                    {slots.length} slot{slots.length !== 1 ? 's' : ''}
                  </Text>

                  <TouchableOpacity
                    onPress={() => setSlotPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={slotPage >= totalPages - 1}
                    style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: slotPage >= totalPages - 1 ? colors.bgElevated : colors.primaryBg,
                      borderWidth: 1,
                      borderColor: slotPage >= totalPages - 1 ? colors.border : colors.primaryBorder,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={slotPage >= totalPages - 1 ? colors.textFaint : colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {slotsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
            ) : slots.length === 0 ? (
              <View style={{ backgroundColor: colors.bgSurface, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Ionicons name="calendar-outline" size={28} color={colors.textFaint} style={{ marginBottom: 8 }} />
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>
                  No slots available on this day
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {pagedSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      onPress={() => setSelectedSlot(slot)}
                      activeOpacity={0.75}
                      style={{
                        width: '30.5%',
                        paddingVertical: 14,
                        borderRadius: radius.lg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : colors.bgSurface,
                      }}
                    >
                      <Text style={{
                        fontFamily: 'Syne_700Bold',
                        fontSize: 13,
                        color: isSelected ? '#FFFFFF' : colors.text,
                      }}>
                        {formatTime(slot.start_time)}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* ── STICKY BOOK CTA ── */}
      <View style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: colors.bgSurface,
        borderTopWidth: 1,
        borderTopColor: colors.borderStrong,
        padding: spacing.lg,
        paddingBottom: bottomPad + spacing.md,
      }}>
        {selectedSlot ? (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <View>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>Selected time</Text>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text }}>
                  {formatTime(selectedSlot.start_time)} — {formatTime(selectedSlot.end_time)}
                </Text>
              </View>
              <View>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted, textAlign: 'right' }}>Fee</Text>
                <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: colors.primary }}>
                  R{doctor.consultation_fee}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('BookingConfirm', { slotId: selectedSlot.id, doctor })}
              style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: '#FFFFFF' }}>
                Book appointment — R{doctor.consultation_fee}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.bgElevated, borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.textFaint }}>
              Select a time slot to continue
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}