import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
  Platform,
} from 'react-native'
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps'
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import * as Location from 'expo-location'

import { useThemeStore } from '../../store/themeStore'
import { doctorsApi } from '../../api/doctors'
import { triageApi, TriageResult } from '../../api/triage'
import { Doctor } from '../../types'
import { spacing, radius } from '../../theme/spacing'
import DoctorSearchCard from './DoctorSearchCard'

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

const DEFAULT_REGION: Region = {
  latitude: -33.3107,
  longitude: 26.5198,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
}

type ActiveTab = 'search' | 'symptoms'

const getValidCoords = (doctor: Doctor): { latitude: number; longitude: number } | null => {
  const lat = Number(doctor.latitude)
  const lng = Number(doctor.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat === 0 && lng === 0) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { latitude: lat, longitude: lng }
}

// ════════════════════════════════════════════════
// MapPin — tear-drop pin built from RN views
// ════════════════════════════════════════════════
interface MapPinProps {
  selected: boolean
  colors: any
}
const MapPin = ({ selected, colors }: MapPinProps) => {
  const fill = selected ? colors.text : colors.primary
  return (
    <View style={{ alignItems: 'center', width: 36, height: 44 }}>
      {/* Pin head (circle) */}
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: fill,
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
      }}>
        <Ionicons name="medical" size={15} color="#FFFFFF" />
      </View>
      {/* Pin tail — triangle pointing down */}
      <View style={{
        width: 0,
        height: 0,
        marginTop: -4,
        borderLeftWidth: 7,
        borderRightWidth: 7,
        borderTopWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: fill,
      }} />
      {/* White outline under triangle (cleaner edge) */}
      <View style={{
        position: 'absolute',
        top: 28,
        width: 0,
        height: 0,
        borderLeftWidth: 8.5,
        borderRightWidth: 8.5,
        borderTopWidth: 14,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#FFFFFF',
        zIndex: -1,
      }} />
    </View>
  )
}

export default function SearchScreen({ navigation, route }: any) {
  const { colors } = useThemeStore()
  const insets = useSafeAreaInsets()

  const [activeTab, setActiveTab] = useState<ActiveTab>('search')

  const [query, setQuery] = useState<string>('')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searched, setSearched] = useState<boolean>(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)

  const mapRef = useRef<MapView>(null)
  const [mapReady, setMapReady] = useState<boolean>(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  const sheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['18%', '55%', '92%'], [])

  const [symptoms, setSymptoms] = useState<string>('')
  const [triageLoading, setTriageLoading] = useState<boolean>(false)
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null)
  const [triageError, setTriageError] = useState<string>('')

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

  useEffect(() => {
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') return
        const loc = await Location.getCurrentPositionAsync({})
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
      } catch (e) {
        console.log('[SearchScreen] Location error:', e)
      }
    })()
  }, [])

  const mappableDoctors = useMemo(() => {
    return doctors
      .map(d => ({ doctor: d, coords: getValidCoords(d) }))
      .filter((x): x is { doctor: Doctor; coords: { latitude: number; longitude: number } } => x.coords !== null)
  }, [doctors])

  // ── List shown in sheet ──
  // If a pin is selected, only that doctor shows. Otherwise, all results.
  const visibleDoctors = useMemo(() => {
    if (selectedDoctorId) {
      const match = doctors.find(d => d.id === selectedDoctorId)
      return match ? [match] : doctors
    }
    return doctors
  }, [doctors, selectedDoctorId])

  // ── Fit map to current results ──
  // Skip auto-fit when a single pin is selected (we'd fight the marker-tap zoom)
  const fitMapToResults = useCallback(() => {
    if (!mapRef.current || !mapReady) return
    if (selectedDoctorId) return

    if (mappableDoctors.length === 0) {
      if (userLocation) {
        mapRef.current.animateToRegion({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 600)
      }
      return
    }

    if (mappableDoctors.length === 1) {
      const c = mappableDoctors[0].coords
      mapRef.current.animateToRegion({
        latitude: c.latitude - 0.005,
        longitude: c.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 700)
      return
    }

    const coords = mappableDoctors.map(d => d.coords)
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: {
        top: insets.top + 140,
        bottom: 220,
        left: 50,
        right: 50,
      },
      animated: true,
    })
  }, [mappableDoctors, mapReady, userLocation, insets.top, selectedDoctorId])

  useEffect(() => {
    fitMapToResults()
  }, [fitMapToResults])

  // ── Doctor fetch logic ──
  const search = async (q: string): Promise<void> => {
    if (q.trim() === '') {
      setSearched(false)
      void loadAll()
      return
    }
    setSelectedDoctorId(null) // clear any pin selection on new search
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
    setSelectedDoctorId(null)
    setLoading(true)
    setSearched(true)
    sheetRef.current?.snapToIndex(1)
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
    setSelectedDoctorId(null)
    void loadAll()
  }

  // ── Clear pin selection → go back to full results ──
  const clearPinSelection = (): void => {
    setSelectedDoctorId(null)
    // Re-fit happens automatically via the useEffect on fitMapToResults
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

  const handleMarkerPress = (doctorId: string, coords: { latitude: number; longitude: number }) => {
    setSelectedDoctorId(doctorId)
    sheetRef.current?.snapToIndex(1)
    mapRef.current?.animateToRegion({
      latitude: coords.latitude - 0.008,
      longitude: coords.longitude,
      latitudeDelta: 0.025,
      longitudeDelta: 0.025,
    }, 500)
  }

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={2}
        disappearsOnIndex={1}
        opacity={0.4}
      />
    ),
    []
  )

  // ════════════════════════════════════════════════
  // RENDER: TRIAGE TAB
  // ════════════════════════════════════════════════
  if (activeTab === 'symptoms') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + 16, paddingBottom: spacing.md, backgroundColor: colors.bgBase }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 17, color: colors.text, marginBottom: spacing.md, textAlign: 'center' }}>
            Find your doctor
          </Text>

          <View style={{ flexDirection: 'row', backgroundColor: colors.bgSurface, borderRadius: radius.lg, padding: 4, borderWidth: 1, borderColor: colors.border }}>
            <TouchableOpacity
              onPress={() => setActiveTab('search')}
              style={{ flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: 'transparent', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
            >
              <Ionicons name="search-outline" size={15} color={colors.textFaint} />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.textFaint }}>
                Search
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('symptoms')}
              style={{ flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="hardware-chip-outline" size={15} color="#FFFFFF" />
              </Animated.View>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: '#FFFFFF' }}>
                AI Triage
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, backgroundColor: colors.primaryBg, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.primaryBorder }}>
            <Animated.View style={{
              transform: [{ scale: pulseAnim }],
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: colors.primary,
              alignItems: 'center', justifyContent: 'center',
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
              style={{ color: colors.text, fontFamily: 'DMSans_400Regular', fontSize: 14, minHeight: 100, textAlignVertical: 'top', lineHeight: 22 }}
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
            style={{ backgroundColor: symptoms.trim() === '' ? colors.bgElevated : colors.primary, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, opacity: triageLoading ? 0.7 : 1, marginBottom: spacing.lg }}
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
                          width: 48, height: 48, borderRadius: 24,
                          backgroundColor: colors.primaryBg,
                          borderWidth: 2, borderColor: colors.primaryBorder,
                          alignItems: 'center', justifyContent: 'center',
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
        </ScrollView>
      </View>
    )
  }

  // ════════════════════════════════════════════════
  // RENDER: SEARCH TAB
  // ════════════════════════════════════════════════
return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>

      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        onMapReady={() => setMapReady(true)}
      >
        {mappableDoctors.map(({ doctor, coords }) => {
          const isSelected = doctor.id === selectedDoctorId
          return (
            <Marker
              key={doctor.id}
              coordinate={coords}
              onPress={() => handleMarkerPress(doctor.id, coords)}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
            >
              <MapPin selected={isSelected} colors={colors} />
            </Marker>
          )
        })}
      </MapView>

      <View style={{
        position: 'absolute',
        top: insets.top + 8,
        left: spacing.md,
        right: spacing.md,
        gap: spacing.sm,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.bgBase,
          borderRadius: 999,
          paddingHorizontal: spacing.base,
          gap: spacing.sm,
          height: 52,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 6,
        }}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={{ flex: 1, color: colors.text, fontFamily: 'DMSans_400Regular', fontSize: 14 }}
            placeholder="Doctors, specialty, city..."
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={handleQueryChange}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.textFaint} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setActiveTab('symptoms')}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: colors.primaryBg,
                borderWidth: 1, borderColor: colors.primaryBorder,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="hardware-chip-outline" size={16} color={colors.primary} />
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: spacing.md }}
        >
          {SPECIALTIES.slice(0, 6).map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => void searchBySpecialty(item.label)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: colors.bgBase,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Ionicons name={item.icon} size={13} color={colors.primary} />
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.text }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        onPress={() => {
          if (userLocation) {
            mapRef.current?.animateToRegion({
              latitude: userLocation.lat,
              longitude: userLocation.lng,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }, 600)
          }
        }}
        style={{
          position: 'absolute',
          right: spacing.md,
          bottom: '22%',
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: colors.bgBase,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        <Ionicons name="navigate" size={18} color={colors.primary} />
      </TouchableOpacity>

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.bgBase }}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
      >
        {/* ── Sheet header ── */}
        <View style={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{ flex: 1 }}>
            {selectedDoctorId ? (
              <>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text }}>
                  Selected practice
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  Tap × to see all results
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text }}>
                  {loading ? 'Searching...' : `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''} found`}
                </Text>
                {query !== '' && (
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                    for "{query}"
                  </Text>
                )}
              </>
            )}
          </View>

          {selectedDoctorId && (
            <TouchableOpacity
              onPress={clearPinSelection}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.bgElevated,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.xxl,
          }}
        >
          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}

          {!loading && visibleDoctors.length === 0 && searched && (
            <View style={{ alignItems: 'center', paddingTop: spacing.xl, paddingHorizontal: spacing.xl }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
                <Ionicons name="search-outline" size={28} color={colors.textFaint} />
              </View>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.text, marginBottom: spacing.xs }}>No doctors found</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md }}>
                Try a different name, specialty, or city
              </Text>
              <TouchableOpacity
                onPress={clearSearch}
                style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 10 }}
              >
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: '#FFFFFF' }}>Browse all doctors</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && visibleDoctors.length > 0 && visibleDoctors.map((doctor, index) => {
            const isSelected = doctor.id === selectedDoctorId
            const coords = getValidCoords(doctor)
            return (
              <DoctorSearchCard
                key={doctor.id}
                doctor={doctor}
                index={index}
                isSelected={isSelected}
                colors={colors}
                onPress={() => {
                  setSelectedDoctorId(doctor.id)
                  if (coords) {
                    mapRef.current?.animateToRegion({
                      latitude: coords.latitude - 0.008,
                      longitude: coords.longitude,
                      latitudeDelta: 0.025,
                      longitudeDelta: 0.025,
                    }, 500)
                    sheetRef.current?.snapToIndex(0)
                  }
                }}
                onView={() => navigation.navigate('DoctorProfile', { doctorId: doctor.id })}
              />
            )
          })}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  )
}