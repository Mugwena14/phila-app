import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Animated, TouchableOpacity, Platform, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Calendar from 'expo-calendar'
import { useThemeStore } from '../../store/themeStore'
import { spacing, radius } from '../../theme/spacing'


export default function BookingSuccessScreen({ navigation, route }: any) {
  const { colors } = useThemeStore()
  const { booking } = route.params
  const [calendarAdded, setCalendarAdded] = useState(false)

  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(40)).current

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start()
  }, [])

  const addToCalendar = async () => {
    try {
      if (!booking.slot_date || !booking.slot_start_time) {
        Alert.alert('Missing info', 'Could not read appointment date and time.')
        return
      }

      const { status } = await Calendar.requestCalendarPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow calendar access to add this appointment.')
        return
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)
      const writable  = calendars.find(c => c.allowsModifications)
      if (!writable) {
        Alert.alert('No calendar found', 'No writable calendar found on this device.')
        return
      }

      const startDate = new Date(`${booking.slot_date}T${booking.slot_start_time}`)
      const endDate   = new Date(startDate.getTime() + 30 * 60 * 1000)

      if (isNaN(startDate.getTime())) {
        Alert.alert('Error', 'Invalid appointment date or time.')
        return
      }

      await Calendar.createEventAsync(writable.id, {
        title:     `Appointment — ${booking.practice_name ?? 'Doctor'}`,
        startDate,
        endDate,
        notes:     `Phila Health appointment with ${booking.practice_name}`,
        alarms:    [{ relativeOffset: -60 }],
      })

      setCalendarAdded(true)
    } catch (e) {
      console.log('Calendar error:', e)
      Alert.alert('Error', 'Could not add to calendar. Please try again.')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase, padding: spacing.lg, paddingTop: 80 }}>

      {/* Success icon */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', marginBottom: spacing.xl }}>
        <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: colors.primaryBg, borderWidth: 2, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 30, color: colors.text, marginBottom: 8, textAlign: 'center' }}>
          You're booked!
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xxl, lineHeight: 24 }}>
          Your appointment is confirmed. We'll send you a WhatsApp reminder before your visit.
        </Text>

        {/* Booking card */}
        <View style={{ backgroundColor: colors.bgSurface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.primaryBorder, overflow: 'hidden', marginBottom: spacing.lg }}>
          <View style={{ height: 3, backgroundColor: colors.primary }} />
          <View style={{ padding: spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.text }}>
                {booking.practice_name ?? 'Appointment confirmed'}
              </Text>
              <View style={{ backgroundColor: colors.primaryBg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.primaryBorder }}>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 10, color: colors.primary }}>CONFIRMED</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>Date</Text>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text }}>{booking.slot_date ?? '—'}</Text>
                </View>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>Time</Text>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text }}>{booking.slot_start_time?.slice(0, 5) ?? '—'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Add to calendar */}
        <TouchableOpacity
          onPress={() => void addToCalendar()}
          disabled={calendarAdded}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            backgroundColor: calendarAdded ? colors.primaryBg : colors.bgSurface,
            borderRadius: radius.pill, paddingVertical: 14,
            borderWidth: 1.5, borderColor: calendarAdded ? colors.primary : colors.border,
            marginBottom: spacing.md,
          }}
        >
          <Ionicons name={calendarAdded ? 'checkmark-circle' : 'calendar-outline'} size={18} color={calendarAdded ? colors.primary : colors.textMuted} />
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: calendarAdded ? colors.primary : colors.textMuted }}>
            {calendarAdded ? 'Added to calendar ✓' : 'Add to calendar'}
          </Text>
        </TouchableOpacity>


        {/* WhatsApp note */}
        <View style={{ backgroundColor: '#128C7E15', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: '#128C7E30', flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: spacing.xl }}>
          <Ionicons name="logo-whatsapp" size={22} color="#25D366" style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.text, marginBottom: 4 }}>
              Intake assistant incoming
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, lineHeight: 20 }}>
              Our AI assistant will WhatsApp you shortly with a few quick questions to prepare your doctor for the visit.
            </Text>
          </View>
        </View>

        {/* CTAs */}
        <TouchableOpacity
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
          style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center', marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
        >
          <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: '#FFFFFF' }}>View my appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
          style={{ backgroundColor: 'transparent', borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary }}
        >
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.primary }}>Back to home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}