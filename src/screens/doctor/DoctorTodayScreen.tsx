import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import apiClient from '../../api/client'

interface QueueEntry {
  id: string
  display_name: string
  status: string
  slot_time: string
}

interface QueueState {
  practice_name: string
  now_seen: QueueEntry | null
  queue: QueueEntry[]
  total_waiting: number
}

interface Booking {
  id: string
  doctor_name: string
  slot_date: string
  slot_start_time: string
  status: string
  intake_status: string
  risk_score: string
  crisis_flag: string | null
  is_walk_in: boolean
  intake_brief: any
}

export default function DoctorTodayScreen() {
  const { colors } = useThemeStore()
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()

  const [queue, setQueue] = useState<QueueState | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [calling, setCalling] = useState(false)
  const [selectedBrief, setSelectedBrief] = useState<Booking | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    try {
      const [doctorRes, bookingsRes] = await Promise.all([
        apiClient.get('/doctors/today'),
        apiClient.get('/bookings/practice'),
      ])
      const doc = doctorRes.data.doctor ?? doctorRes.data
      setDoctorId(doc.id)

      const todayBookings = bookingsRes.data.filter(
        (b: Booking) => b.slot_date === today
      ).sort((a: Booking, b: Booking) =>
        (a.slot_start_time ?? '').localeCompare(b.slot_start_time ?? '')
      )
      setBookings(todayBookings)

      // Load queue state
      const queueRes = await apiClient.get('/waiting-room/queue')
      setQueue(queueRes.data)
    } catch {}
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [today])

  useEffect(() => { void load() }, [load])

  const callNext = async () => {
    setCalling(true)
    try {
      const res = await apiClient.post('/waiting-room/call-next')
      const name = res.data.now_seen?.display_name ?? 'Next patient'
      Alert.alert('✅ Called', `${name} has been called to the consultation room`)
      void load()
    } catch {
      Alert.alert('No patients', 'No more patients in the queue')
    } finally {
      setCalling(false)
    }
  }

  const getRiskColor = (score: string) => {
    const n = parseInt(score || '0')
    if (n < 30) return colors.primary
    if (n < 65) return '#D97706'
    return '#DC2626'
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      confirmed: colors.primary,
      arrived: '#0284C7',
      in_consultation: '#7C3AED',
      completed: '#059669',
      no_show: '#DC2626',
      cancelled: colors.textFaint,
    }
    return map[status] ?? colors.textFaint
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgBase },
    header: { paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.bgSurface, borderBottomWidth: 1, borderBottomColor: colors.border },
    greeting: { fontFamily: 'Syne_700Bold', fontSize: 20, color: colors.text, marginBottom: 2 },
    subtext: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted },
    section: { paddingHorizontal: 20, marginTop: 20 },
    sectionTitle: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    card: { backgroundColor: colors.bgSurface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 10 },
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.full_name?.split(' ')[0] ?? 'Doctor'

  if (loading) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.greeting}>{greeting}, Dr. {firstName} 👋</Text>
        <Text style={s.subtext}>
          {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── CALL NEXT BUTTON ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <TouchableOpacity
            onPress={callNext}
            disabled={calling}
            style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, opacity: calling ? 0.7 : 1 }}
          >
            <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: '#fff' }}>
              {calling ? 'Calling...' : 'Call next patient'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── NOW BEING SEEN ── */}
        {queue?.now_seen && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Now in consultation</Text>
            <View style={[s.card, { borderColor: colors.primaryBorder, backgroundColor: colors.primaryBg }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: '#fff' }}>
                    {queue.now_seen.display_name.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 17, color: colors.text }}>{queue.now_seen.display_name}</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.primary }}>{queue.now_seen.slot_time} · In consultation</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── STATS ROW ── */}
        <View style={[s.section, { flexDirection: 'row', gap: 10 }]}>
          {[
            { label: 'Total today', value: bookings.length },
            { label: 'Waiting', value: queue?.total_waiting ?? 0 },
            { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length },
            { label: 'Crisis', value: bookings.filter(b => b.crisis_flag).length, alert: true },
          ].map(stat => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: colors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: stat.alert && stat.value > 0 ? 'rgba(220,38,38,0.3)' : colors.border, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 22, color: stat.alert && stat.value > 0 ? '#DC2626' : colors.text }}>{stat.value}</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: colors.textFaint, marginTop: 2, textAlign: 'center' }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── TODAY'S PATIENTS ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Today's patients ({bookings.length})</Text>
          {bookings.length === 0 ? (
            <View style={[s.card, { alignItems: 'center', paddingVertical: 32 }]}>
              <Ionicons name="calendar-outline" size={36} color={colors.textFaint} />
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: colors.text, marginTop: 10 }}>No patients today</Text>
            </View>
          ) : (
            bookings.map(b => (
              <TouchableOpacity
                key={b.id}
                onPress={() => setSelectedBrief(selectedBrief?.id === b.id ? null : b)}
                style={[s.card, { borderColor: b.crisis_flag ? 'rgba(220,38,38,0.3)' : colors.border }]}
              >
                {/* Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.primary }}>
                      {b.doctor_name?.charAt(0)?.toUpperCase() ?? 'P'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text }}>{b.doctor_name}</Text>
                      {b.crisis_flag && <Ionicons name="warning" size={14} color="#DC2626" />}
                      {b.is_walk_in && (
                        <View style={{ backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 10, color: '#2563EB', fontFamily: 'DMSans_500Medium' }}>Walk-in</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>
                      {b.slot_start_time?.slice(0, 5)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: getStatusColor(b.status) }} />
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: getStatusColor(b.status) }}>
                        {b.status.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: b.intake_status === 'complete' ? colors.primary : colors.textFaint }}>
                      {b.intake_status === 'complete' ? '✓ Intake' : 'Pending'}
                    </Text>
                  </View>
                </View>

                {/* Expanded intake brief */}
                {selectedBrief?.id === b.id && b.intake_brief && (
                  <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>AI intake brief</Text>
                    {[
                      { label: 'Concern', value: b.intake_brief.main_concern },
                      { label: 'Duration', value: b.intake_brief.duration },
                      { label: 'Severity', value: b.intake_brief.severity ? `${b.intake_brief.severity}/10` : null },
                    ].map(item => item.value ? (
                      <View key={item.label} style={{ marginBottom: 6 }}>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>{item.label}</Text>
                        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text }}>{item.value}</Text>
                      </View>
                    ) : null)}
                    {b.intake_brief.medications?.length > 0 && (
                      <View style={{ marginTop: 4 }}>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint, marginBottom: 4 }}>Medications</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                          {b.intake_brief.medications.map((m: string) => (
                            <View key={m} style={{ backgroundColor: colors.primaryBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 11, color: colors.primary, fontFamily: 'DMSans_500Medium' }}>{m}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    {b.crisis_flag && (
                      <View style={{ marginTop: 8, backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="warning" size={14} color="#DC2626" />
                        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: '#DC2626', flex: 1 }}>Crisis flag — handle with care</Text>
                      </View>
                    )}
                  </View>
                )}

                {selectedBrief?.id === b.id && !b.intake_brief && (
                  <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textFaint }}>No intake brief yet</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}