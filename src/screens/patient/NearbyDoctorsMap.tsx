import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { spacing, radius } from '../../theme/spacing'
import { doctorsApi, NearbyDoctor } from '../../api/doctors'

type AvailabilityStatus = 'available_today' | 'available_week' | 'unavailable'

interface NearbyDoctorsMapProps {
  visible: boolean
  onClose: () => void
  onDoctorSelect: (doctorId: string) => void
}

type ViewMode = 'map' | 'list'

const STATUS_COLORS: Record<AvailabilityStatus, string> = {
  available_today: '#10B981',
  available_week: '#F59E0B',
  unavailable: '#9CA3AF',
}

const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available_today: 'Available today',
  available_week: 'Available this week',
  unavailable: 'Fully booked',
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DoctorPin({ status, isSelected }: {
  status: AvailabilityStatus
  isSelected: boolean
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current
  const color = STATUS_COLORS[status]

  useEffect(() => {
    if (status !== 'available_today') return
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [status])

  return (
    <View pointerEvents="none" style={{ alignItems: 'center' }}>
      {status === 'available_today' && (
        <Animated.View style={{
          position: 'absolute',
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: `${color}30`,
          transform: [{ scale: pulseAnim }],
        }} />
      )}
      <View style={{
        width: isSelected ? 32 : 26,
        height: isSelected ? 32 : 26,
        borderRadius: isSelected ? 16 : 13,
        backgroundColor: color,
        borderWidth: isSelected ? 3 : 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
      }}>
        <Ionicons name="medical-outline" size={isSelected ? 14 : 11} color="#FFFFFF" />
      </View>
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 6,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderTopColor: color, marginTop: -1,
      }} />
    </View>
  )
}

function DoctorDetailModal({ doctor, colors, onBook, onClose }: {
  doctor: NearbyDoctor | null
  colors: any
  onBook: () => void
  onClose: () => void
}) {
  const slideAnim = useRef(new Animated.Value(600)).current
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (doctor) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 11 }).start()
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start()
    }
  }, [doctor])

  if (!doctor) return null

  const statusColor = STATUS_COLORS[doctor.availability_status]

  return (
    <Modal visible={!!doctor} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: '#00000060' }}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        transform: [{ translateY: slideAnim }],
        backgroundColor: colors.bgSurface,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingBottom: insets.bottom + 16,
        borderTopWidth: 1, borderColor: colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15, shadowRadius: 16, elevation: 20,
      }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 12, marginBottom: spacing.md }} />
        <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 20, right: spacing.lg, padding: 4, zIndex: 10 }}>
          <Ionicons name="close" size={22} color={colors.textFaint} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }} showsVerticalScrollIndicator={false}>
          {/* Avatar + name */}
          <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, alignItems: 'center' }}>
            <View style={{
              width: 64, height: 64, borderRadius: radius.lg,
              backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 26, color: colors.primary }}>
                {doctor.practice_name.charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 18, color: colors.text, marginBottom: 2 }}>
                {doctor.practice_name}
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted }}>
                {doctor.specialty}
              </Text>
            </View>
          </View>

          {/* Status badge */}
          <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: `${statusColor}15`, borderRadius: radius.pill,
              paddingHorizontal: 12, paddingVertical: 6,
              borderWidth: 1, borderColor: `${statusColor}30`,
            }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: statusColor }} />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: statusColor }}>
                {STATUS_LABELS[doctor.availability_status]}
              </Text>
            </View>
          </View>

          {/* Info grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
            <View style={{ flex: 1, minWidth: '45%', backgroundColor: colors.bgElevated, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 4 }}>
              <Ionicons name="cash-outline" size={16} color={colors.textMuted} />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.primary }}>R{doctor.consultation_fee}</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>per consultation</Text>
            </View>
            <View style={{ flex: 1, minWidth: '45%', backgroundColor: colors.bgElevated, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 4 }}>
              <Ionicons name="car-outline" size={16} color={colors.textMuted} />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text }}>{doctor.travel_time_minutes} min</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>drive away</Text>
            </View>
            <View style={{ flex: 1, minWidth: '45%', backgroundColor: colors.bgElevated, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 4 }}>
              <Ionicons name="ribbon-outline" size={16} color={colors.textMuted} />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text }}>{doctor.years_experience} yrs</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>experience</Text>
            </View>
            <View style={{ flex: 1, minWidth: '45%', backgroundColor: colors.bgElevated, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 4 }}>
              <Ionicons name="location-outline" size={16} color={colors.textMuted} />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text }}>{doctor.distance_km} km</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>from you</Text>
            </View>
          </View>

          {/* Next slot */}
          {doctor.next_available_slot && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: colors.primaryBg, borderRadius: radius.lg, padding: spacing.md,
              borderWidth: 1, borderColor: colors.primaryBorder, marginBottom: spacing.md,
            }}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <View>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textMuted }}>Next available slot</Text>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: colors.primary }}>{doctor.next_available_slot}</Text>
              </View>
            </View>
          )}

          {/* Medical aids */}
          {doctor.medical_aids.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: spacing.sm }}>
                Medical aids accepted
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {doctor.medical_aids.map((aid) => (
                  <View key={aid} style={{ backgroundColor: colors.bgElevated, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>{aid}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Book button */}
          <TouchableOpacity
            onPress={onBook}
            disabled={doctor.availability_status === 'unavailable'}
            style={{
              backgroundColor: doctor.availability_status === 'unavailable' ? colors.bgElevated : colors.primary,
              borderRadius: radius.pill, paddingVertical: 16,
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
            }}
          >
            <Ionicons name="calendar-outline" size={16} color={doctor.availability_status === 'unavailable' ? colors.textFaint : '#FFFFFF'} />
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: doctor.availability_status === 'unavailable' ? colors.textFaint : '#FFFFFF' }}>
              {doctor.availability_status === 'unavailable' ? 'Fully booked' : 'Book now'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Modal>
  )
}

// ─── Bottom Card ──────────────────────────────────────────────────────────────

function DoctorBottomCard({ doctor, colors, onViewDetail, onDismiss }: {
  doctor: NearbyDoctor
  colors: any
  onViewDetail: () => void
  onDismiss: () => void
}) {
  const slideAnim = useRef(new Animated.Value(200)).current
  const statusColor = STATUS_COLORS[doctor.availability_status]

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start()
  }, [doctor.id])

  return (
    <Animated.View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      transform: [{ translateY: slideAnim }],
      backgroundColor: colors.bgSurface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: spacing.lg, paddingBottom: spacing.xl + 8,
      borderTopWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1, shadowRadius: 12, elevation: 10,
    }}>
      <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md }} />
      <TouchableOpacity onPress={onDismiss} style={{ position: 'absolute', top: 20, right: spacing.lg, padding: 4 }}>
        <Ionicons name="close" size={20} color={colors.textFaint} />
      </TouchableOpacity>

      <TouchableOpacity onPress={onViewDetail} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
          <View style={{
            width: 56, height: 56, borderRadius: radius.lg,
            backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: colors.primary }}>
              {doctor.practice_name.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text }}>{doctor.practice_name}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textFaint} />
            </View>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>{doctor.specialty}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: `${statusColor}15`, borderRadius: radius.pill,
                paddingHorizontal: 8, paddingVertical: 3,
                borderWidth: 1, borderColor: `${statusColor}30`,
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 11, color: statusColor }}>{STATUS_LABELS[doctor.availability_status]}</Text>
              </View>
              {doctor.travel_time_minutes !== null && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="car-outline" size={12} color={colors.textMuted} />
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>{doctor.travel_time_minutes} min drive</Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.primary }}>R{doctor.consultation_fee}</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>per visit</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TouchableOpacity
          onPress={onViewDetail}
          style={{ flex: 1, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.primary }}
        >
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: colors.primary }}>View details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onViewDetail}
          disabled={doctor.availability_status === 'unavailable'}
          style={{
            flex: 1, borderRadius: radius.pill, paddingVertical: 13,
            alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
            backgroundColor: doctor.availability_status === 'unavailable' ? colors.bgElevated : colors.primary,
          }}
        >
          <Ionicons name="calendar-outline" size={14} color={doctor.availability_status === 'unavailable' ? colors.textFaint : '#FFFFFF'} />
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: doctor.availability_status === 'unavailable' ? colors.textFaint : '#FFFFFF' }}>
            {doctor.availability_status === 'unavailable' ? 'Fully booked' : 'Book now'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

// ─── List Card ────────────────────────────────────────────────────────────────

function DoctorListCard({ doctor, colors, onPress }: {
  doctor: NearbyDoctor
  colors: any
  onPress: () => void
}) {
  const statusColor = STATUS_COLORS[doctor.availability_status]

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ backgroundColor: colors.bgSurface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
        <View style={{ width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: colors.primary }}>{doctor.practice_name.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: colors.text }}>{doctor.practice_name}</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.textFaint} />
          </View>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>{doctor.specialty}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: `${statusColor}15`, borderRadius: radius.pill,
              paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${statusColor}30`,
            }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: statusColor }} />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 10, color: statusColor }}>{STATUS_LABELS[doctor.availability_status]}</Text>
            </View>
            {doctor.travel_time_minutes !== null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="car-outline" size={11} color={colors.textMuted} />
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textMuted }}>{doctor.travel_time_minutes} min</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.primary }}>R{doctor.consultation_fee}</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>per visit</Text>
        </View>
      </View>
      <View style={{
        backgroundColor: doctor.availability_status === 'unavailable' ? colors.bgElevated : colors.primary,
        borderRadius: radius.pill, paddingVertical: 12,
        alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
      }}>
        <Ionicons name="calendar-outline" size={14} color={doctor.availability_status === 'unavailable' ? colors.textFaint : '#FFFFFF'} />
        <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: doctor.availability_status === 'unavailable' ? colors.textFaint : '#FFFFFF' }}>
          {doctor.availability_status === 'unavailable' ? 'Fully booked' : 'Tap to view & book'}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function NearbyDoctorsMap({ visible, onClose, onDoctorSelect }: NearbyDoctorsMapProps) {
  const { colors } = useThemeStore()
  const insets = useSafeAreaInsets()
  const mapRef = useRef<MapView>(null)
  const markerPressedRef = useRef(false)

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string>('')
  const [doctors, setDoctors] = useState<NearbyDoctor[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedDoctor, setSelectedDoctor] = useState<NearbyDoctor | null>(null)
  const [detailDoctor, setDetailDoctor] = useState<NearbyDoctor | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [nearestLoading, setNearestLoading] = useState<boolean>(false)

  const init = useCallback(async () => {
    setLoading(true)
    setLocationError('')
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setLocationError('Location permission denied. Enable it in settings to find nearby doctors.')
      setLoading(false)
      return
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
    setLocation(coords)
    try {
      const nearby = await doctorsApi.getNearby({ lat: coords.latitude, lng: coords.longitude, radius_km: 20 })
      setDoctors(nearby)
    } catch {
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (visible) { void init() }
    else { setSelectedDoctor(null); setDetailDoctor(null); setViewMode('map') }
  }, [visible])

  const goToNearestAvailable = async () => {
    setNearestLoading(true)
    setSelectedDoctor(null)
    const available = doctors
      .filter(d => d.availability_status === 'available_today')
      .sort((a, b) => (a.travel_time_minutes ?? 999) - (b.travel_time_minutes ?? 999))
    if (available.length === 0) { setNearestLoading(false); return }
    const nearest = available[0]
    mapRef.current?.animateToRegion({ latitude: nearest.latitude, longitude: nearest.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 800)
    setTimeout(() => { setSelectedDoctor(nearest); setNearestLoading(false) }, 900)
  }

  const Legend = () => (
    <View style={{
      position: 'absolute', top: insets.top + 70, right: spacing.md,
      backgroundColor: colors.bgSurface, borderRadius: radius.lg,
      padding: spacing.sm, borderWidth: 1, borderColor: colors.border,
      gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    }}>
      {(Object.keys(STATUS_COLORS) as AvailabilityStatus[]).map((s) => (
        <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: STATUS_COLORS[s] }} />
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textMuted }}>{STATUS_LABELS[s]}</Text>
        </View>
      ))}
    </View>
  )

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bgBase }}>

        {/* Top bar */}
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          paddingTop: insets.top + 8, paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
          flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
          backgroundColor: colors.bgSurface, borderBottomWidth: 1, borderColor: colors.border,
        }}>
          <TouchableOpacity onPress={onClose} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.text }}>Doctors near you</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>
              {loading ? 'Finding doctors...' : `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''} found`}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: colors.bgElevated, borderRadius: radius.lg, padding: 3, borderWidth: 1, borderColor: colors.border }}>
            <TouchableOpacity onPress={() => setViewMode('map')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md, backgroundColor: viewMode === 'map' ? colors.primary : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="map-outline" size={13} color={viewMode === 'map' ? '#FFFFFF' : colors.textMuted} />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: viewMode === 'map' ? '#FFFFFF' : colors.textMuted }}>Map</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setViewMode('list'); setSelectedDoctor(null) }} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md, backgroundColor: viewMode === 'list' ? colors.primary : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="list-outline" size={13} color={viewMode === 'list' ? '#FFFFFF' : colors.textMuted} />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: viewMode === 'list' ? '#FFFFFF' : colors.textMuted }}>List</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading */}
        {loading && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted }}>Finding doctors near you...</Text>
          </View>
        )}

        {/* Location error */}
        {!loading && locationError !== '' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm }}>
              <Ionicons name="location-outline" size={32} color={colors.textFaint} />
            </View>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text, textAlign: 'center' }}>Location needed</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>{locationError}</Text>
            <TouchableOpacity onPress={() => void init()} style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 28, paddingVertical: 13 }}>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: '#FFFFFF' }}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Map view */}
        {!loading && locationError === '' && viewMode === 'map' && location && (
          <View style={{ flex: 1 }}>
            <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
            showsUserLocation
            showsMyLocationButton={false}
            onPress={() => {
                if (markerPressedRef.current) return
                setSelectedDoctor(null)
            }}
            >
            {doctors.map((doctor) => (
            <Marker
                key={doctor.id}
                coordinate={{ latitude: doctor.latitude, longitude: doctor.longitude }}
                tracksViewChanges={false}
                onPress={() => {
                markerPressedRef.current = true
                setSelectedDoctor(doctor)
                setTimeout(() => { markerPressedRef.current = false }, 300)
                }}
            >
                <DoctorPin
                status={doctor.availability_status}
                isSelected={selectedDoctor?.id === doctor.id}
                />
            </Marker>
            ))}
            </MapView>

            <Legend />

            {/* Nearest available now */}
            <View style={{ position: 'absolute', bottom: selectedDoctor ? 220 : 32, alignSelf: 'center' }}>
              <TouchableOpacity
                onPress={() => void goToNearestAvailable()}
                disabled={nearestLoading}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 13, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 }}
              >
                {nearestLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="locate-outline" size={16} color="#FFFFFF" />}
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: '#FFFFFF' }}>
                  {nearestLoading ? 'Finding...' : 'Nearest available now'}
                </Text>
              </TouchableOpacity>
            </View>

            {selectedDoctor && (
              <DoctorBottomCard
                doctor={selectedDoctor}
                colors={colors}
                onViewDetail={() => setDetailDoctor(selectedDoctor)}
                onDismiss={() => setSelectedDoctor(null)}
              />
            )}
          </View>
        )}

        {/* List view */}
        {!loading && locationError === '' && viewMode === 'list' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + 70, paddingHorizontal: spacing.lg, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {[...doctors]
              .sort((a, b) => (a.travel_time_minutes ?? 999) - (b.travel_time_minutes ?? 999))
              .map((doctor) => (
                <DoctorListCard key={doctor.id} doctor={doctor} colors={colors} onPress={() => setDetailDoctor(doctor)} />
              ))
            }
            {doctors.length === 0 && (
              <View style={{ alignItems: 'center', paddingTop: spacing.xxl }}>
                <Ionicons name="location-outline" size={48} color={colors.textFaint} />
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text, marginTop: spacing.md }}>No doctors nearby</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }}>Try expanding your search radius</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <DoctorDetailModal
        doctor={detailDoctor}
        colors={colors}
        onClose={() => setDetailDoctor(null)}
        onBook={() => {
          setDetailDoctor(null)
          setSelectedDoctor(null)
          if (detailDoctor) onDoctorSelect(detailDoctor.id)
        }}
      />
    </Modal>
  )
}