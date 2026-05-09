import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native'
import { isAxiosError } from 'axios'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '../../store/themeStore'
import { bookingsApi } from '../../api/bookings'
import { notificationsApi } from '../../api/notifications'
import { spacing, radius } from '../../theme/spacing'

export default function BookingConfirmScreen({ navigation, route }: any) {
  const { colors } = useThemeStore()
  const { slotId, doctor, slot } = route.params
  const insets = useSafeAreaInsets()
  const bottomPad = Math.max(insets.bottom, 16)

  const [reason, setReason]   = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError]     = useState<string>('')

  const handleBook = async (): Promise<void> => {
    setLoading(true)
    setError('')
    try {
      const booking = await bookingsApi.create({ slot_id: slotId, reason })

      notificationsApi.getUnreadCount().catch(() => {})

      navigation.replace('BookingSuccess', {
        booking: {
          ...booking,
          slot_date: slot?.date,
          slot_start_time: slot?.start_time,
          practice_name: doctor.practice_name,
          specialty: doctor.specialty,
        }
      })
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail
        setError(typeof detail === 'string' ? detail : 'Booking failed. Please try again.')
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: 60 }}>

        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </View>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 26, color: colors.text, marginBottom: 6 }}>
          Confirm booking
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, marginBottom: spacing.xl }}>
          Review your appointment details below
        </Text>

        {/* Doctor card */}
        <View style={{ backgroundColor: colors.bgSurface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.xl }}>
          <View style={{ height: 3, backgroundColor: colors.primary }} />
          <View style={{ padding: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
              <View style={{ width: 56, height: 56, borderRadius: radius.lg, backgroundColor: colors.primaryBg, borderWidth: 1.5, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: colors.primary }}>
                  {doctor.practice_name.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.text, marginBottom: 2 }}>
                  {doctor.practice_name}
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>
                  {doctor.specialty}
                </Text>
              </View>
            </View>

            {[
              { icon: 'location-outline',  label: 'Location',         value: `${doctor.city}, ${doctor.province}` },
              { icon: 'cash-outline',       label: 'Consultation fee', value: `R${doctor.consultation_fee}` },
              { icon: 'time-outline',       label: 'Duration',         value: `${doctor.slot_duration_minutes} minutes` },
              { icon: 'calendar-outline',   label: 'Date',             value: slot?.date ?? '—' },
              { icon: 'alarm-outline',      label: 'Time',             value: slot?.start_time?.slice(0, 5) ?? '—' },
            ].map((item, i, arr) => (
              <View
                key={item.label}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}
              >
                <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                <Text style={{ flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted }}>
                  {item.label}
                </Text>
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text }}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reason input */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text, marginBottom: spacing.sm }}>
            Reason for visit{' '}
            <Text style={{ color: colors.textFaint, fontFamily: 'DMSans_400Regular', fontSize: 13 }}>
              (optional)
            </Text>
          </Text>
          <TextInput
            style={{ backgroundColor: colors.bgSurface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderStrong, padding: spacing.base, color: colors.text, fontFamily: 'DMSans_400Regular', fontSize: 14, minHeight: 80, textAlignVertical: 'top' }}
            placeholder="Briefly describe your main concern..."
            placeholderTextColor={colors.textFaint}
            value={reason}
            onChangeText={setReason}
            multiline
          />
        </View>

        {error !== '' && (
          <View style={{ backgroundColor: colors.coralBg, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.coralBorder, marginBottom: spacing.base }}>
            <Text style={{ color: colors.coral, fontFamily: 'DMSans_400Regular', fontSize: 13 }}>{error}</Text>
          </View>
        )}

        <View style={{ height: 160 }} />
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
        <TouchableOpacity
          onPress={() => void handleBook()}
          disabled={loading}
          style={{
            backgroundColor: loading ? colors.bgElevated : colors.primary,
            borderRadius: radius.pill,
            paddingVertical: 17,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: '#FFFFFF' }}>
            {loading ? 'Booking...' : `Confirm — R${doctor.consultation_fee}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}