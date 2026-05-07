import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { doctorsApi } from '../../api/doctors'
import { triageApi, TriageResult } from '../../api/triage'
import { Doctor } from '../../types'
import { spacing, radius } from '../../theme/spacing'
import NearbyDoctorsMap from './NearbyDoctorsMap' // ← new component (next step)

const SPECIALTIES = [
  { label: 'Neurology', icon: 'pulse-outline' as const },
  { label: 'Cardiology', icon: 'heart-outline' as const },
  { label: 'Orthopaedics', icon: 'body-outline' as const },
  { label: 'Pathology', icon: 'flask-outline' as const },
  { label: 'Ophthalmology', icon: 'eye-outline' as const },
  { label: 'Paediatrics', icon: 'happy-outline' as const },
  { label: 'Oncology', icon: 'ribbon-outline' as const },
  { label: 'Dermatology', icon: 'color-palette-outline' as const },
  { label: 'Gynaecology', icon: 'rose-outline' as const },
  { label: 'Gastroenterology', icon: 'fitness-outline' as const },
  { label: 'General Surgery', icon: 'medical-outline' as const },
  { label: 'Radiology', icon: 'scan-outline' as const },
]

type ActiveTab = 'search' | 'symptoms'

export default function SearchScreen({ navigation, route }: any) {
  const { colors } = useThemeStore()
  const insets = useSafeAreaInsets()

  // Search state
  const [query, setQuery] = useState<string>('')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searched, setSearched] = useState<boolean>(false)

  // Map modal state
  const [mapVisible, setMapVisible] = useState<boolean>(false)

  // Triage state
  const [activeTab, setActiveTab] = useState<ActiveTab>('search')
  const [symptoms, setSymptoms] = useState<string>('')
  const [triageLoading, setTriageLoading] = useState<boolean>(false)
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null)
  const [triageError, setTriageError] = useState<string>('')

  // AI pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [])

  // Live search — triggers on every keystroke
  const search = async (q: string): Promise<void> => {
    if (q.trim() === '') {
      setSearched(false)
      setDoctors([])
      void loadAll()
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const results = await doctorsApi.search({ q })
      setDoctors(results)
    } catch {
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  const handleQueryChange = (text: string): void => {
    setQuery(text)
    void search(text)
  }

  const searchBySpecialty = async (specialty: string): Promise<void> => {
    setQuery(specialty)
    setActiveTab('search')
    setLoading(true)
    setSearched(true)
    try {
      const results = await doctorsApi.search({ specialty })
      setDoctors(results)
    } catch {
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  const loadAll = async (): Promise<void> => {
    setLoading(true)
    setSearched(true)
    try {
      const results = await doctorsApi.search({})
      setDoctors(results)
    } catch {
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (route?.params?.specialty) {
      void searchBySpecialty(route.params.specialty)
    } else {
      void loadAll()
    }
  }, [route?.params?.specialty])

  const clearSearch = (): void => {
    setQuery('')
    setSearched(false)
    setDoctors([])
    void loadAll()
  }

  const handleTriage = async (): Promise<void> => {
    if (symptoms.trim() === '') return
    setTriageLoading(true)
    setTriageResult(null)
    setTriageError('')
    try {
      const result = await triageApi.assess(symptoms)
      setTriageResult(result)
    } catch {
      setTriageError('Could not assess symptoms. Please try again.')
    } finally {
      setTriageLoading(false)
    }
  }

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return { bg: colors.coralBg, border: colors.coralBorder, text: colors.coral, label: 'Emergency' }
      case 'urgent':
        return { bg: '#FEF3C715', border: '#F59E0B30', text: '#F59E0B', label: 'Urgent' }
      case 'soon':
        return { bg: colors.primaryBg, border: colors.primaryBorder, text: colors.primary, label: 'See doctor soon' }
      default:
        return { bg: colors.bgElevated, border: colors.border, text: colors.textMuted, label: 'Routine' }
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>

      {/* Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + 16, paddingBottom: spacing.md, backgroundColor: colors.bgBase }}>
        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 17, color: colors.text, marginBottom: spacing.md, textAlign: 'center' }}>
          Find your doctor
        </Text>

        {/* Tab toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.bgSurface, borderRadius: radius.lg, padding: 4, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border }}>
          <TouchableOpacity
            onPress={() => setActiveTab('search')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: activeTab === 'search' ? colors.bgElevated : 'transparent', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
          >
            <Ionicons name="search-outline" size={15} color={activeTab === 'search' ? colors.text : colors.textFaint} />
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: activeTab === 'search' ? colors.text : colors.textFaint }}>
              Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('symptoms')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: activeTab === 'symptoms' ? colors.primary : 'transparent', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
          >
            <Animated.View style={{ transform: [{ scale: activeTab === 'symptoms' ? pulseAnim : 1 }] }}>
              <Ionicons
                name="hardware-chip-outline"
                size={15}
                color={activeTab === 'symptoms' ? '#FFFFFF' : colors.primary}
              />
            </Animated.View>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: activeTab === 'symptoms' ? '#FFFFFF' : colors.primary }}>
              AI Triage
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── SEARCH INPUT (full width, live) ── */}
        {activeTab === 'search' && (
          <>
            {/* Full-width search input */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.bgSurface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              paddingHorizontal: spacing.base,
              gap: spacing.sm,
              marginBottom: spacing.sm,
            }}>
              <Ionicons name="search-outline" size={18} color={colors.textFaint} />
              <TextInput
                style={{ flex: 1, color: colors.text, fontFamily: 'DMSans_400Regular', fontSize: 14, paddingVertical: 13 }}
                placeholder="Doctor name, specialty, city..."
                placeholderTextColor={colors.textFaint}
                value={query}
                onChangeText={handleQueryChange}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <Ionicons name="close-circle" size={18} color={colors.textFaint} />
                </TouchableOpacity>
              )}
            </View>

            {/* Location button — opens map feature */}
            {/* <TouchableOpacity
              onPress={() => setMapVisible(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: colors.bgSurface,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: spacing.base,
                paddingVertical: 12,
              }}
            >
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.primaryBg,
                borderWidth: 1,
                borderColor: colors.primaryBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="location-outline" size={15} color={colors.primary} />
              </View>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, flex: 1 }}>
                Find doctors near you...
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
            </TouchableOpacity> */}
          </>
        )}

        {/* ── SYMPTOMS INPUT ── */}
        {activeTab === 'symptoms' && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, backgroundColor: colors.primaryBg, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.primaryBorder }}>
              <Animated.View style={{
                transform: [{ scale: pulseAnim }],
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="hardware-chip-outline" size={18} color="#FFFFFF" />
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.primary, marginBottom: 2 }}>
                  Phila AI Triage Agent
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>
                  Describe your symptoms — I'll recommend the right doctor
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: colors.bgSurface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderStrong, padding: spacing.base, marginBottom: spacing.sm }}>
              <TextInput
                style={{ color: colors.text, fontFamily: 'DMSans_400Regular', fontSize: 14, minHeight: 80, textAlignVertical: 'top', lineHeight: 22 }}
                placeholder="e.g. I have been having chest pain and shortness of breath for 2 days..."
                placeholderTextColor={colors.textFaint}
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity
              onPress={() => void handleTriage()}
              disabled={triageLoading || symptoms.trim() === ''}
              style={{ backgroundColor: symptoms.trim() === '' ? colors.bgElevated : colors.primary, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, opacity: triageLoading ? 0.7 : 1 }}
            >
              {triageLoading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: '#FFFFFF' }}>Analysing symptoms...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="hardware-chip-outline" size={16} color={symptoms.trim() === '' ? colors.textFaint : '#FFFFFF'} />
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: symptoms.trim() === '' ? colors.textFaint : '#FFFFFF' }}>
                    Assess my symptoms
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── TRIAGE RESULTS ── */}
        {activeTab === 'symptoms' && (
          <View style={{ paddingHorizontal: spacing.lg }}>
            {triageError !== '' && (
              <View style={{ backgroundColor: colors.coralBg, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.coralBorder, marginBottom: spacing.md }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.coral }}>{triageError}</Text>
              </View>
            )}

            {triageResult && (
              <View style={{ marginBottom: spacing.xl }}>
                {triageResult.urgency === 'emergency' && (
                  <View style={{ backgroundColor: colors.coralBg, borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.coralBorder, padding: spacing.lg, marginBottom: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="warning-outline" size={22} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.coral, marginBottom: 2 }}>Emergency — seek help now</Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>Do not wait for a booking</Text>
                      </View>
                    </View>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.md }}>
                      {triageResult.emergency_message ?? triageResult.urgency_explanation}
                    </Text>
                    <View style={{ backgroundColor: colors.bgSurface, borderRadius: radius.md, padding: spacing.md, gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="call-outline" size={16} color={colors.coral} />
                        <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: colors.coral }}>Emergency: 10177</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="call-outline" size={16} color={colors.coral} />
                        <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: colors.coral }}>Ambulance: 10111</Text>
                      </View>
                    </View>
                  </View>
                )}

                {triageResult.urgency !== 'emergency' && (() => {
                  const urgencyStyle = getUrgencyStyle(triageResult.urgency)
                  return (
                    <View style={{ backgroundColor: colors.bgSurface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderStrong, overflow: 'hidden', marginBottom: spacing.md }}>
                      <View style={{ height: 3, backgroundColor: colors.primary }} />
                      <View style={{ padding: spacing.lg }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
                          <Animated.View style={{
                            transform: [{ scale: pulseAnim }],
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: colors.primaryBg,
                            borderWidth: 2,
                            borderColor: colors.primaryBorder,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Ionicons name="hardware-chip-outline" size={22} color={colors.primary} />
                          </Animated.View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted, marginBottom: 2 }}>Phila AI recommends</Text>
                            <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: colors.text }}>{triageResult.specialty}</Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                          <View style={{ backgroundColor: urgencyStyle.bg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: urgencyStyle.border, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: urgencyStyle.text }} />
                            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: urgencyStyle.text }}>{urgencyStyle.label}</Text>
                          </View>
                        </View>

                        <View style={{ backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md }}>
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, lineHeight: 20 }}>{triageResult.reasoning}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: spacing.lg }}>
                          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} style={{ marginTop: 1 }} />
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, flex: 1, lineHeight: 20 }}>{triageResult.urgency_explanation}</Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => void searchBySpecialty(triageResult.specialty)}
                          style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                        >
                          <Ionicons name="search-outline" size={16} color="#FFFFFF" />
                          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: '#FFFFFF' }}>Find a {triageResult.specialty}</Text>
                          <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                })()}

                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: spacing.sm }}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={colors.textFaint} style={{ marginTop: 1 }} />
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint, flex: 1, lineHeight: 17 }}>
                    This is an AI assessment, not a medical diagnosis. Always consult a qualified healthcare professional.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── SEARCH RESULTS ── */}
        {activeTab === 'search' && (
          <View style={{ paddingHorizontal: spacing.lg }}>

            {/* Specialty grid — shown when no search active */}
            {!searched && (
              <View style={{ marginBottom: spacing.xl }}>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.md }}>
                  Browse by specialty
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {SPECIALTIES.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => void searchBySpecialty(item.label)}
                      style={{ width: '30.5%', backgroundColor: colors.bgSurface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center', gap: spacing.sm }}
                      activeOpacity={0.8}
                    >
                      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={item.icon} size={22} color={colors.primary} />
                      </View>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 14 }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />}

            {!loading && searched && doctors.length === 0 && (
              <View style={{ alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
                  <Ionicons name="search-outline" size={36} color={colors.textFaint} />
                </View>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text, marginBottom: spacing.sm }}>No doctors found</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg }}>
                  Try searching by name, specialty, or city
                </Text>
                <TouchableOpacity
                  onPress={clearSearch}
                  style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 24, paddingVertical: 12 }}
                >
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: '#FFFFFF' }}>Browse all doctors</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && doctors.length > 0 && (
              <View>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, marginBottom: spacing.md }}>
                  {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found
                </Text>
                {doctors.map((doctor) => (
                  <View
                    key={doctor.id}
                    style={{ backgroundColor: colors.bgSurface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md }}
                  >
                    <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
                      <View style={{ width: 60, height: 60, borderRadius: radius.lg, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: colors.primary }}>
                          {doctor.practice_name.charAt(0)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text, marginBottom: 2 }}>
                          {doctor.practice_name}
                        </Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm }}>
                          {doctor.specialty}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                          <Ionicons name="star" size={12} color={colors.primary} />
                          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.text }}>4.8</Text>
                          <Text style={{ color: colors.textFaint, fontSize: 12 }}>·</Text>
                          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>{doctor.city}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                        <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.primary }}>R{doctor.consultation_fee}</Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>per visit</Text>
                      </View>
                    </View>

                    {doctor.medical_aids.length > 0 && (
                      <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginBottom: spacing.md }}>
                        {doctor.medical_aids.slice(0, 3).map((aid) => (
                          <View key={aid} style={{ backgroundColor: colors.bgElevated, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textMuted }}>{aid}</Text>
                          </View>
                        ))}
                        {doctor.medical_aids.length > 3 && (
                          <View style={{ backgroundColor: colors.bgElevated, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>+{doctor.medical_aids.length - 3} more</Text>
                          </View>
                        )}
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>
                        {doctor.slot_duration_minutes}min slots · {doctor.years_experience} yrs exp
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="star" size={12} color={colors.primary} />
                        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.primary }}>4.8</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => navigation.navigate('DoctorProfile', { doctorId: doctor.id })}
                      style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                    >
                      <Ionicons name="calendar-outline" size={15} color="#FFFFFF" />
                      <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: '#FFFFFF' }}>Book now</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
        {/* ── Floating Map button ── */}
      </ScrollView>
      {activeTab === 'search' && (
        <View style={{
          position: 'absolute',
          bottom: 10,
          alignSelf: 'center',
          zIndex: 20,
        }}>
          <TouchableOpacity
            onPress={() => setMapVisible(true)}
            activeOpacity={0.9}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              paddingHorizontal: 20,
              paddingVertical: 13,
              borderRadius: 999,
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            <Ionicons name="map-outline" size={16} color="#FFFFFF" />
            <Text style={{
              fontFamily: 'Syne_700Bold',
              fontSize: 14,
              color: '#FFFFFF',
            }}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── MAP MODAL ── */}
      <NearbyDoctorsMap
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onDoctorSelect={(doctorId: string) => {
          setMapVisible(false)
          navigation.navigate('DoctorProfile', { doctorId })
        }}
      />
    </View>
  )
}