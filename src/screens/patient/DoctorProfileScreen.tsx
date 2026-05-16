import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { doctorsApi } from '../../api/doctors'
import { Doctor, Slot, WorkingHour } from '../../types'
import { spacing, radius } from '../../theme/spacing'
import { Ionicons } from '@expo/vector-icons'
import { ratingsApi, Rating } from '../../api/ratings'
import DoctorBookingPanel from './DoctorBookingPanel'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80'

const formatHour = (timeStr: string): string => timeStr.slice(0, 5)

type Mode = 'profile' | 'booking'

export default function DoctorProfileScreen({ navigation, route }: any) {
  const { colors } = useThemeStore()
  const { doctorId } = route.params
  const insets = useSafeAreaInsets()
  const bottomPad = Math.max(insets.bottom, 16)

  const [doctor, setDoctor]           = useState<Doctor | null>(null)
  const [loading, setLoading]         = useState<boolean>(true)
  const [reviews, setReviews]         = useState<Rating[]>([])
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0)
  const [mode, setMode]               = useState<Mode>('profile')

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const [data, reviewData] = await Promise.all([
          doctorsApi.getById(doctorId),
          ratingsApi.getDoctorRatings(doctorId),
        ])
        setDoctor(data)
        setReviews(reviewData)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [doctorId])

  const handleImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    setActiveImageIndex(idx)
  }

  const openDirections = () => {
    if (!doctor) return
    const destination = encodeURIComponent(
      `${doctor.address}, ${doctor.city}, ${doctor.province}, South Africa`
    )
    const url = Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${destination}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
    Linking.openURL(url)
  }

  const handleBookingConfirm = (slot: Slot) => {
    if (!doctor) return
    navigation.navigate('BookingConfirm', { slotId: slot.id, doctor, slot })
  }

  if (loading || !doctor) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  // Use real images — fallback to placeholder if none uploaded yet
  const galleryImages = doctor.practice_images && doctor.practice_images.length > 0
    ? doctor.practice_images
    : [FALLBACK_IMAGE]

  // Sort working hours Mon→Sun
  const sortedHours = [...(doctor.working_hours || [])].sort((a, b) => a.day_of_week - b.day_of_week)

  // Today's index (0=Monday ... 6=Sunday)
  const todayIndex = (new Date().getDay() + 6) % 7

  if (mode === 'booking') {
    return (
      <DoctorBookingPanel
        doctor={doctor}
        onBack={() => setMode('profile')}
        onConfirm={handleBookingConfirm}
      />
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── PHOTO GALLERY ── */}
        <View style={{ position: 'relative' }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleImageScroll}
            scrollEventThrottle={16}
          >
            {galleryImages.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={{ width: SCREEN_WIDTH, height: 320 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Pagination dots */}
          {galleryImages.length > 1 && (
            <View style={{
              position: 'absolute', bottom: spacing.md, alignSelf: 'center',
              flexDirection: 'row', gap: 6,
              backgroundColor: 'rgba(0,0,0,0.4)',
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
            }}>
              {galleryImages.map((_, i) => (
                <View key={i} style={{
                  width: i === activeImageIndex ? 16 : 6,
                  height: 6, borderRadius: 3,
                  backgroundColor: i === activeImageIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                }} />
              ))}
            </View>
          )}

          {/* Image counter */}
          {galleryImages.length > 1 && (
            <View style={{
              position: 'absolute', bottom: spacing.md, right: spacing.md,
              backgroundColor: 'rgba(0,0,0,0.5)',
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
            }}>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: '#FFFFFF' }}>
                {activeImageIndex + 1}/{galleryImages.length}
              </Text>
            </View>
          )}

          {/* Top action buttons */}
          <View style={{
            position: 'absolute', top: insets.top + 8,
            left: spacing.md, right: spacing.md,
            flexDirection: 'row', justifyContent: 'space-between',
          }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 }}
            >
              <Ionicons name="arrow-back" size={18} color="#000" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 }}>
                <Ionicons name="share-outline" size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 }}>
                <Ionicons name="heart-outline" size={18} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>

          {/* ── NAME + RATING ── */}
          <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 26, color: colors.text, marginBottom: 6 }}>
            {doctor.practice_name}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            {doctor.total_reviews > 0 ? (
              <>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: colors.text }}>
                  {doctor.rating.toFixed(1)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 1 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons
                      key={star}
                      name={star <= Math.round(doctor.rating) ? 'star' : 'star-outline'}
                      size={13}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.primary }}>
                  ({doctor.total_reviews})
                </Text>
              </>
            ) : (
              <View style={{ backgroundColor: colors.bgElevated, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.textMuted }}>New doctor</Text>
              </View>
            )}
          </View>

          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm }}>
            {doctor.specialty} · {doctor.city}, {doctor.province}
          </Text>

          {/* HPCSA badge */}
          {doctor.is_verified && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: colors.primaryBg, borderRadius: radius.pill,
              paddingHorizontal: 12, paddingVertical: 5,
              borderWidth: 1, borderColor: colors.primaryBorder,
              alignSelf: 'flex-start', marginBottom: spacing.lg,
            }}>
              <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 11, color: colors.primary }}>
                HPCSA VERIFIED
              </Text>
            </View>
          )}

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }}>
            {[
              { label: 'Experience', value: `${doctor.years_experience}yrs` },
              { label: 'Fee',        value: `R${doctor.consultation_fee}` },
              { label: 'Duration',   value: `${doctor.slot_duration_minutes}min` },
            ].map((stat, i) => (
              <View key={stat.label} style={{ flex: 1, backgroundColor: colors.bgSurface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: i === 1 ? colors.primary : colors.text, marginBottom: 2 }}>
                  {stat.value}
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* ── ABOUT ── */}
          {doctor.bio && (
            <View style={{ marginBottom: spacing.xl }}>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text, marginBottom: spacing.sm }}>About</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, lineHeight: 22 }}>
                {doctor.bio}
              </Text>
            </View>
          )}

          {/* ── MEDICAL AIDS ── */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text, marginBottom: spacing.sm }}>
              Medical aids accepted
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {doctor.medical_aids.length > 0 ? (
                doctor.medical_aids.map(aid => (
                  <View key={aid} style={{ backgroundColor: colors.primaryBg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: colors.primaryBorder }}>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.primary }}>{aid}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>Cash patients accepted</Text>
              )}
            </View>
          </View>

          {/* ── OPENING TIMES — real data from backend ── */}
          {sortedHours.length > 0 && (
            <View style={{ marginBottom: spacing.xl }}>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text, marginBottom: spacing.md }}>
                Opening times
              </Text>
              {sortedHours.map((wh, i) => {
                const isToday = wh.day_of_week === todayIndex
                return (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: spacing.sm }}>
                    <View style={{
                      width: 10, height: 10, borderRadius: 5,
                      backgroundColor: wh.is_active ? '#10B981' : colors.border,
                    }} />
                    <Text style={{
                      flex: 1,
                      fontFamily: isToday ? 'Syne_700Bold' : 'DMSans_400Regular',
                      fontSize: 14,
                      color: wh.is_active ? colors.text : colors.textFaint,
                    }}>
                      {DAY_NAMES[wh.day_of_week]}
                      {isToday && (
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.primary }}> (today)</Text>
                      )}
                    </Text>
                    <Text style={{
                      fontFamily: isToday ? 'Syne_700Bold' : 'DMSans_400Regular',
                      fontSize: 14,
                      color: wh.is_active ? colors.text : colors.textFaint,
                    }}>
                      {wh.is_active
                        ? `${formatHour(wh.start_time)} - ${formatHour(wh.end_time)}`
                        : 'Closed'
                      }
                    </Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* ── PATIENT REVIEWS ── */}
          {reviews.length > 0 && (
            <View style={{ marginBottom: spacing.xl }}>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text, marginBottom: spacing.md }}>
                Patient reviews
              </Text>
              <View style={{ gap: spacing.sm }}>
                {reviews.slice(0, 5).map(review => (
                  <View key={review.id} style={{ backgroundColor: colors.bgSurface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={13} color="#F59E0B" />
                      ))}
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint, marginLeft: 4 }}>
                        {new Date(review.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    {review.comment ? (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, lineHeight: 18 }}>
                        {review.comment}
                      </Text>
                    ) : (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textFaint, fontStyle: 'italic' }}>
                        No comment left
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── LOCATION ── */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text, marginBottom: spacing.md }}>
              Location
            </Text>
            <TouchableOpacity
              onPress={openDirections}
              activeOpacity={0.85}
              style={{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSurface }}
            >
              {doctor.latitude && doctor.longitude ? (
                <Image
                  source={{
                    uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${doctor.latitude},${doctor.longitude}&zoom=15&size=600x300&markers=${doctor.latitude},${doctor.longitude},red`,
                  }}
                  style={{ width: '100%', height: 180 }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgElevated }}>
                  <Ionicons name="location-outline" size={32} color={colors.textFaint} />
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted, marginTop: 6 }}>
                    Location preview unavailable
                  </Text>
                </View>
              )}
              <View style={{ padding: spacing.md }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.text, marginBottom: 4 }}>
                  {doctor.address}, {doctor.city}, {doctor.province}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="navigate-outline" size={14} color={colors.primary} />
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.primary }}>Get directions</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── STICKY BOOK NOW ── */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: colors.bgSurface,
        borderTopWidth: 1, borderTopColor: colors.borderStrong,
        padding: spacing.lg, paddingBottom: bottomPad + spacing.md,
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>
            Consultation fee
          </Text>
          <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: colors.text }}>
            R{doctor.consultation_fee}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setMode('booking')}
          style={{ backgroundColor: colors.text, borderRadius: radius.pill, paddingVertical: 16, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.bgBase }}>Book now</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.bgBase} />
        </TouchableOpacity>
      </View>
    </View>
  )
}