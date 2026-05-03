import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '../../store/themeStore'
import apiClient from '../../api/client'

interface Patient {
  id: string
  full_name: string
  phone: string
  is_walk_in: boolean
  claimed: boolean
  claim_code: string | null
  created_at: string
}

interface Booking {
  id: string
  patient_id: string
  slot_date: string
  slot_start_time: string
  status: string
  risk_score: string
  crisis_flag: string | null
  intake_status: string
  intake_brief: any
  reason: string
}

export default function DoctorPatientsScreen() {
  const { colors } = useThemeStore()
  const insets = useSafeAreaInsets()

  const [patients, setPatients] = useState<Patient[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const load = useCallback(async () => {
    try {
      const [patientsRes, bookingsRes] = await Promise.all([
        apiClient.get('/patients/'),
        apiClient.get('/bookings/practice'),
      ])
      setPatients(patientsRes.data)
      setBookings(bookingsRes.data)
    } catch {}
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const getPatientBookings = (patientId: string) =>
    bookings.filter(b => b.patient_id === patientId)
      .sort((a, b) => (b.slot_date ?? '').localeCompare(a.slot_date ?? ''))

  const getPatientStats = (patientId: string) => {
    const pb = getPatientBookings(patientId)
    const maxRisk = pb.reduce((max, b) => Math.max(max, parseInt(b.risk_score || '0')), 0)
    const hasCrisis = pb.some(b => b.crisis_flag)
    const lastVisit = pb[0]?.slot_date ?? null
    return { total: pb.length, maxRisk, hasCrisis, lastVisit }
  }

  const getRiskColor = (score: number) => {
    if (score < 30) return colors.primary
    if (score < 65) return '#D97706'
    return '#DC2626'
  }

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.replace('WALKIN_', '').includes(search)
  )

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  const patientBookings = selectedPatient ? getPatientBookings(selectedPatient.id) : []

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>

      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: colors.bgSurface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {selectedPatient ? (
            <TouchableOpacity onPress={() => setSelectedPatient(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.primary }}>Patients</Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 20, color: colors.text }}>Patients</Text>
          )}
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>{filtered.length} total</Text>
        </View>

        {!selectedPatient && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgElevated, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Ionicons name="search-outline" size={16} color={colors.textFaint} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or phone..."
              placeholderTextColor={colors.textFaint}
              style={{ flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.text }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.textFaint} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {!selectedPatient ? (
        // ── PATIENT LIST ──
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        >
          {filtered.map(patient => {
            const stats = getPatientStats(patient.id)
            return (
              <TouchableOpacity
                key={patient.id}
                onPress={() => setSelectedPatient(patient)}
                style={{ backgroundColor: colors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.primary }}>
                    {patient.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.text }}>{patient.full_name}</Text>
                    {patient.is_walk_in && !patient.claimed && (
                      <View style={{ backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>
                        <Text style={{ fontSize: 9, color: '#2563EB', fontFamily: 'DMSans_500Medium' }}>WALK-IN</Text>
                      </View>
                    )}
                    {stats.hasCrisis && <Ionicons name="warning" size={13} color="#DC2626" />}
                  </View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textFaint }}>
                    {patient.phone.replace('WALKIN_', '')} · {stats.total} visit{stats.total !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  {stats.total > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: getRiskColor(stats.maxRisk) }} />
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: getRiskColor(stats.maxRisk) }}>
                        {stats.maxRisk < 30 ? 'Low' : stats.maxRisk < 65 ? 'Med' : 'High'}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      ) : (
        // ── PATIENT DETAIL ──
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        >
          {/* Patient header */}
          <View style={{ backgroundColor: colors.bgSurface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryBg, borderWidth: 2, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 20, color: colors.primary }}>
                  {selectedPatient.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text }}>{selectedPatient.full_name}</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>{selectedPatient.phone.replace('WALKIN_', '')}</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: 'Visits', value: patientBookings.length },
                { label: 'Completed', value: patientBookings.filter(b => b.status === 'completed').length },
                { label: 'No-shows', value: patientBookings.filter(b => b.status === 'no_show').length },
              ].map(stat => (
                <View key={stat.label} style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: 10, padding: 10, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 20, color: colors.text }}>{stat.value}</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: colors.textFaint, marginTop: 2 }}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {selectedPatient.is_walk_in && !selectedPatient.claimed && selectedPatient.claim_code && (
              <View style={{ marginTop: 12, backgroundColor: 'rgba(37,99,235,0.06)', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(37,99,235,0.2)' }}>
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: '#2563EB' }}>
                  Walk-in · Claim code: <Text style={{ fontFamily: 'JetBrainsMono_400Regular' }}>{selectedPatient.claim_code}</Text>
                </Text>
              </View>
            )}
          </View>

          {/* Visit history */}
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Visit history</Text>
          {patientBookings.length === 0 ? (
            <View style={{ backgroundColor: colors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted }}>No visits yet</Text>
            </View>
          ) : (
            patientBookings.map(b => (
              <View key={b.id} style={{ backgroundColor: colors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: b.crisis_flag ? 'rgba(220,38,38,0.3)' : colors.border, padding: 14, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text }}>{b.slot_date}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: b.status === 'completed' ? '#059669' : b.status === 'no_show' ? '#DC2626' : colors.primary }} />
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: b.status === 'completed' ? '#059669' : b.status === 'no_show' ? '#DC2626' : colors.primary }}>
                      {b.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                {b.reason && <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>{b.reason}</Text>}
                {b.intake_brief && (
                  <View style={{ backgroundColor: colors.bgElevated, borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: colors.primary }}>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.primary, marginBottom: 4 }}>AI INTAKE BRIEF</Text>
                    {b.intake_brief.main_concern && (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.text }}>
                        <Text style={{ color: colors.textFaint }}>Concern: </Text>{b.intake_brief.main_concern}
                      </Text>
                    )}
                    {b.intake_brief.severity && (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.text }}>
                        <Text style={{ color: colors.textFaint }}>Severity: </Text>{b.intake_brief.severity}/10
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  )
}