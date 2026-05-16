import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { doctorsApi } from '../../api/doctors'
import { Doctor, Slot } from '../../types'
import { spacing, radius } from '../../theme/spacing'
import { Image } from 'react-native'

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

const formatTime = (timeStr: string): string => {
  const hour = parseInt(timeStr.slice(0, 2))
  const minutes = timeStr.slice(3, 5)
  const isPM = hour >= 12
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${minutes} ${isPM ? 'PM' : 'AM'}`
}

interface DoctorBookingPanelProps {
  doctor: Doctor
  onBack: () => void
  onConfirm: (slot: Slot) => void
}

export default function DoctorBookingPanel({ doctor, onBack, onConfirm }: DoctorBookingPanelProps) {
  const { colors } = useThemeStore()
  const insets = useSafeAreaInsets()
  const bottomPad = Math.max(insets.bottom, 16)

  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(DATE_OPTIONS[0].value)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false)
  const [slotPage, setSlotPage] = useState<number>(0)

  const loadSlots = async (date: string): Promise<void> => {
    setSlotsLoading(true)
    setSlotPage(0)
    try {
      const data = await doctorsApi.getSlots(doctor.id, date)
      setSlots(data)
      setSelectedSlot(null)
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  useEffect(() => {
    void loadSlots(selectedDate)
  }, [selectedDate])

  const openDirections = () => {
    const destination = encodeURIComponent(
      `${doctor.address}, ${doctor.city}, ${doctor.province}, South Africa`
    )
    const url = Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${destination}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
    Linking.openURL(url)
  }

  const totalPages = Math.ceil(slots.length / SLOTS_PER_PAGE)
  const pagedSlots = slots.slice(slotPage * SLOTS_PER_PAGE, (slotPage + 1) * SLOTS_PER_PAGE)

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + 16, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <TouchableOpacity
            onPress={onBack}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>Book appointment</Text>
            <Text numberOfLines={1} style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.text }}>
              {doctor.practice_name}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>

          {/* Select date */}
          <View style={{ marginBottom: spacing.xl, marginTop: spacing.sm }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text, marginBottom: spacing.md }}>
              Select date
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 4 }}>
              {DATE_OPTIONS.map((d) => {
                const isSelected = selectedDate === d.value
                return (
                  <TouchableOpacity
                    key={d.value}
                    onPress={() => setSelectedDate(d.value)}
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
                    <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: isSelected ? '#FFFFFF' : colors.text, lineHeight: 24 }}>
                      {d.dayNum}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {d.dayName}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* Select time */}
          <View style={{ marginBottom: spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text }}>
                Select time
              </Text>
              {slots.length > SLOTS_PER_PAGE && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <TouchableOpacity
                    onPress={() => setSlotPage(p => Math.max(0, p - 1))}
                    disabled={slotPage === 0}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: slotPage === 0 ? colors.bgElevated : colors.primaryBg, borderWidth: 1, borderColor: slotPage === 0 ? colors.border : colors.primaryBorder, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="chevron-back" size={14} color={slotPage === 0 ? colors.textFaint : colors.primary} />
                  </TouchableOpacity>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.textMuted }}>
                    {slots.length} slots
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSlotPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={slotPage >= totalPages - 1}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: slotPage >= totalPages - 1 ? colors.bgElevated : colors.primaryBg, borderWidth: 1, borderColor: slotPage >= totalPages - 1 ? colors.border : colors.primaryBorder, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="chevron-forward" size={14} color={slotPage >= totalPages - 1 ? colors.textFaint : colors.primary} />
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
                      <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: isSelected ? '#FFFFFF' : colors.text }}>
                        {formatTime(slot.start_time)}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>

          {/* Medical aids reminder */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text, marginBottom: spacing.sm }}>
              Medical aids accepted
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {doctor.medical_aids.length > 0 ? (
                doctor.medical_aids.map((aid) => (
                  <View key={aid} style={{ backgroundColor: colors.primaryBg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: colors.primaryBorder }}>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.primary }}>{aid}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>Cash patients accepted</Text>
              )}
            </View>
          </View>

          {/* Map preview + directions */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text, marginBottom: spacing.sm }}>
              Location
            </Text>
            <TouchableOpacity
              onPress={openDirections}
              activeOpacity={0.85}
              style={{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSurface }}
            >
                {doctor.practice_images && doctor.practice_images.length > 0 ? (
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    style={{ height: 200 }}
                  >
                    {doctor.practice_images.map((img, i) => (
                      <Image
                        key={i}
                        source={{ uri: img }}
                        style={{ width: 360, height: 200, backgroundColor: colors.bgElevated }}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <View style={{ height: 160, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="image-outline" size={32} color={colors.textFaint} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textFaint, marginTop: 4 }}>
                      No photos yet
                    </Text>
                  </View>
                )}
              <View style={{ padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.text, flex: 1 }}>
                  {doctor.address}, {doctor.city}
                </Text>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: colors.primary }}>
                  Get directions
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Sticky CTA */}
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
              onPress={() => onConfirm(selectedSlot)}
              style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: '#FFFFFF' }}>
                Confirm booking — R{doctor.consultation_fee}
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