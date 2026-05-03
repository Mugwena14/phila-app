import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '../../store/themeStore'
import apiClient from '../../api/client'

interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
  status: 'available' | 'booked' | 'blocked'
  blocked_reason?: string
}

interface Booking {
  id: string
  slot_id: string
  doctor_name: string
  status: string
  intake_status: string
  risk_score: string
  crisis_flag: string | null
  is_walk_in: boolean
  intake_brief: any
  reason: string
}

export default function DoctorScheduleScreen() {
  const { colors } = useThemeStore()
  const insets = useSafeAreaInsets()

  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const doctorRes = await apiClient.get('/doctors/today')
      const doctor = doctorRes.data.doctor ?? doctorRes.data

      const [slotsRes, bookingsRes] = await Promise.all([
        apiClient.get(`/doctors/${doctor.id}/slots`, { params: { date: selectedDate, dashboard: true } }),
        apiClient.get('/bookings/practice'),
      ])

      const allSlots: Slot[] = slotsRes.data
      const allBookings: Booking[] = bookingsRes.data
      const slotIds = new Set(allSlots.map(s => s.id))
      setSlots(allSlots)
      setBookings(allBookings.filter(b => slotIds.has(b.slot_id)))
    } catch {}
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedDate])

  useEffect(() => { void load() }, [load])

  const getBookingForSlot = (slotId: string) => bookings.find(b => b.slot_id === slotId)

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      confirmed: colors.primary, arrived: '#0284C7',
      in_consultation: '#7C3AED', completed: '#059669',
      no_show: '#DC2626', cancelled: colors.textFaint,
    }
    return map[status] ?? colors.textFaint
  }

  // Date selector — show 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date().toISOString().split('T')[0]
    if (dateStr === today) return 'Today'
    return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>

      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: colors.bgSurface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 20, color: colors.text, marginBottom: 12 }}>Schedule</Text>

        {/* Date selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {dates.map(date => (
              <TouchableOpacity
                key={date}
                onPress={() => setSelectedDate(date)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: selectedDate === date ? colors.primary : colors.bgElevated, borderWidth: 1, borderColor: selectedDate === date ? colors.primary : colors.border }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: selectedDate === date ? '#fff' : colors.textMuted }}>
                  {formatDateLabel(date)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      >
        {slots.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Ionicons name="calendar-outline" size={40} color={colors.textFaint} />
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: colors.text, marginTop: 12 }}>No slots for this day</Text>
          </View>
        ) : (
          slots.map(slot => {
            const booking = getBookingForSlot(slot.id)
            const isExpanded = expandedSlot === slot.id

            return (
              <TouchableOpacity
                key={slot.id}
                onPress={() => setExpandedSlot(isExpanded ? null : slot.id)}
                style={{ backgroundColor: colors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: booking?.crisis_flag ? 'rgba(220,38,38,0.3)' : colors.border, padding: 14, marginBottom: 8 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {/* Time */}
                  <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: colors.text, width: 44 }}>
                    {slot.start_time.slice(0, 5)}
                  </Text>

                  {/* Status dot */}
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: slot.status === 'available' ? colors.textFaint : slot.status === 'blocked' ? colors.textFaint : booking ? getStatusColor(booking.status) : colors.primary }} />

                  {/* Content */}
                  <View style={{ flex: 1 }}>
                    {slot.status === 'available' && (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textFaint }}>Open slot</Text>
                    )}
                    {slot.status === 'blocked' && (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textFaint }}>Blocked — {slot.blocked_reason || 'No reason'}</Text>
                    )}
                    {slot.status === 'booked' && booking && (
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text }}>{booking.doctor_name}</Text>
                          {booking.crisis_flag && <Ionicons name="warning" size={13} color="#DC2626" />}
                          {booking.is_walk_in && (
                            <View style={{ backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>
                              <Text style={{ fontSize: 10, color: '#2563EB', fontFamily: 'DMSans_500Medium' }}>Walk-in</Text>
                            </View>
                          )}
                        </View>
                        {booking.reason && (
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>{booking.reason}</Text>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Right side */}
                  {slot.status === 'booked' && booking && (
                    <View style={{ alignItems: 'flex-end', gap: 3 }}>
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: getStatusColor(booking.status) }}>
                        {booking.status.replace('_', ' ')}
                      </Text>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: booking.intake_status === 'complete' ? colors.primary : colors.textFaint }}>
                        {booking.intake_status === 'complete' ? '✓ Intake' : 'Pending'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Expanded intake brief */}
                {isExpanded && slot.status === 'booked' && booking && (
                  <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
                    {booking.intake_brief ? (
                      <>
                        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>AI intake brief</Text>
                        {[
                          { label: 'Concern', value: booking.intake_brief.main_concern },
                          { label: 'Duration', value: booking.intake_brief.duration },
                          { label: 'Severity', value: booking.intake_brief.severity ? `${booking.intake_brief.severity}/10` : null },
                          { label: 'Language', value: booking.intake_brief.language_used },
                        ].map(item => item.value ? (
                          <View key={item.label} style={{ marginBottom: 8 }}>
                            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>{item.label}</Text>
                            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text }}>{item.value}</Text>
                          </View>
                        ) : null)}
                        {booking.intake_brief.medications?.length > 0 && (
                          <View style={{ marginTop: 4 }}>
                            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint, marginBottom: 6 }}>Medications</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                              {booking.intake_brief.medications.map((m: string) => (
                                <View key={m} style={{ backgroundColor: colors.primaryBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                                  <Text style={{ fontSize: 11, color: colors.primary, fontFamily: 'DMSans_500Medium' }}>{m}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                        {booking.intake_brief.allergies?.length > 0 && (
                          <View style={{ marginTop: 8 }}>
                            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint, marginBottom: 6 }}>Allergies</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                              {booking.intake_brief.allergies.map((a: string) => (
                                <View key={a} style={{ backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                                  <Text style={{ fontSize: 11, color: '#DC2626', fontFamily: 'DMSans_500Medium' }}>{a}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                        {booking.intake_brief.additional_notes && (
                          <View style={{ marginTop: 8, backgroundColor: colors.bgElevated, borderRadius: 8, padding: 10 }}>
                            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.text, lineHeight: 18 }}>
                              {booking.intake_brief.additional_notes}
                            </Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textFaint, textAlign: 'center', paddingVertical: 8 }}>
                        No intake brief yet
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}