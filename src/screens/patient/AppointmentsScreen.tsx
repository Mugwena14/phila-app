import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { bookingsApi } from '../../api/bookings'
import { Booking } from '../../types'
import { spacing, radius } from '../../theme/spacing'
import { ratingsApi } from '../../api/ratings'
import RatingModal from './RatingsModal'

// ════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════

const getBookingDateTime = (booking: Booking): Date | null => {
  if (!booking.slot_date || !booking.slot_start_time) return null
  const time = booking.slot_start_time.length >= 5 ? booking.slot_start_time.slice(0, 5) : '00:00'
  const dt = new Date(`${booking.slot_date}T${time}:00`)
  return Number.isNaN(dt.getTime()) ? null : dt
}

const getCountdownLabel = (dt: Date): string => {
  const now = new Date()
  const diffMs = dt.getTime() - now.getTime()
  const diffMin = Math.round(diffMs / 60000)

  if (diffMin < 0) return 'Now'
  if (diffMin < 1) return 'Now'
  if (diffMin < 60) return `In ${diffMin} min`

  const diffHours = Math.round(diffMin / 60)
  if (diffHours < 24) return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`

  const diffDays = Math.round(diffHours / 24)
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `In ${diffDays} days`

  const diffWeeks = Math.round(diffDays / 7)
  return `In ${diffWeeks} week${diffWeeks !== 1 ? 's' : ''}`
}

const formatDateLabel = (dt: Date): string => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'

  return dt.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })
}

const formatTimeLabel = (dt: Date): string => {
  return dt.toLocaleTimeString('en-ZA', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// ════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════

export default function AppointmentsScreen() {
  const { colors } = useThemeStore()
  const insets = useSafeAreaInsets()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [queuePositions, setQueuePositions] = useState<Record<string, any>>({})
  const [ratingBooking, setRatingBooking] = useState<{ id: string; name: string } | null>(null)
  const [ratedBookings, setRatedBookings] = useState<Set<string>>(new Set())
  const [expandedInfoIds, setExpandedInfoIds] = useState<Record<string, boolean>>({})

  const load = useCallback(async (): Promise<void> => {
    try {
      const data = await bookingsApi.getMyBookings()
      setBookings(data)
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const loadQueuePositions = async () => {
      const todayConfirmed = bookings.filter(b => b.status === 'confirmed')
      const positions: Record<string, any> = {}
      for (const b of todayConfirmed) {
        try {
          const pos = await ratingsApi.getQueuePosition(b.id)
          if (pos.is_today) positions[b.id] = pos
        } catch {}
      }
      setQueuePositions(positions)
    }
    if (bookings.length > 0) void loadQueuePositions()
  }, [bookings])

  const handleCancel = async (bookingId: string): Promise<void> => {
    setCancelling(bookingId)
    try {
      await bookingsApi.cancel(bookingId)
      await load()
    } finally {
      setCancelling(null)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedInfoIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // ── Coordinate-aware directions launcher ──
  const openDirections = (booking: Booking) => {
    if (!booking) return

    const destination = encodeURIComponent(
      `${booking.address ?? ''}, ${booking.city ?? ''}, ${booking.province ?? ''}, South Africa`
    )

    const url = Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${destination}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`

    Linking.openURL(url)
  }

  // ── Bookings sorted into 3 buckets ──
  const { upcoming, past, cancelled } = useMemo(() => {
    const upcomingList = bookings
      .filter(b => b.status === 'confirmed')
      .sort((a, b) => (getBookingDateTime(a)?.getTime() ?? 0) - (getBookingDateTime(b)?.getTime() ?? 0))

    const cancelledList = bookings
      .filter(b => b.status === 'cancelled')
      .sort((a, b) => (getBookingDateTime(b)?.getTime() ?? 0) - (getBookingDateTime(a)?.getTime() ?? 0))

    const pastList = bookings
      .filter(b => b.status === 'completed' || b.status === 'no_show')
      .sort((a, b) => (getBookingDateTime(b)?.getTime() ?? 0) - (getBookingDateTime(a)?.getTime() ?? 0))

    return { upcoming: upcomingList, past: pastList, cancelled: cancelledList }
  }, [bookings])

  // ════════════════════════════════════════════════
  // RENDER HERO CARD
  // ════════════════════════════════════════════════
  const renderHeroCard = (booking: Booking) => {
    const dt = getBookingDateTime(booking)
    const countdown = dt ? getCountdownLabel(dt) : ''
    const dateLabel = dt ? formatDateLabel(dt) : (booking.slot_date ?? '—')
    const timeLabel = dt ? formatTimeLabel(dt) : (booking.slot_start_time?.slice(0, 5) ?? '—')
    const queue = queuePositions[booking.id]
    const isExpanded = !!expandedInfoIds[booking.id]

    const lat = Number(booking.latitude)
    const lng = Number(booking.longitude)
    const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
    const hasLocationData = hasValidCoords || !!booking.address

    return (
      <View style={{
        backgroundColor: colors.bgSurface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: spacing.xl,
      }}>
        {/* Banner — pointerEvents="box-none" so banner doesn't intercept body taps */}
        <View
          pointerEvents="box-none"
          style={{ width: '100%', height: 140, backgroundColor: colors.bgElevated, position: 'relative' }}
        >
          <Image
            source={{ uri: `https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80` }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' }}
          />
          <View
            pointerEvents="none"
            style={{ position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md }}
          >
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: '#FFFFFF', opacity: 0.9 }}>
              {countdown}
            </Text>
            <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: '#FFFFFF', marginTop: 2 }}>
              {booking.practice_name ?? 'Appointment'}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={{ padding: spacing.lg, backgroundColor: colors.bgSurface }}>
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text }}>
            {dateLabel} at {timeLabel}
          </Text>

          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
            {booking.slot_duration_minutes ? `${booking.slot_duration_minutes} min` : '30 min'} · {booking.specialty ?? 'Service Details'}
          </Text>

          {/* Actions row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, gap: spacing.md }}>
            <TouchableOpacity
              onPress={() => openDirections(booking)}
              activeOpacity={0.7}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: colors.text }}>
                Get directions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleExpand(booking.id)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 38,
                height: 38,
                borderRadius: radius.pill,
                backgroundColor: colors.bgElevated,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name={isExpanded ? "chevron-up-outline" : "calendar-outline"}
                size={18}
                color={isExpanded ? colors.primary : colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Expandable details */}
          {isExpanded && (
            <View style={{ marginTop: spacing.lg, borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.md }}>
              {booking.intake_status && (
                <View style={{ alignSelf: 'flex-start', backgroundColor: booking.intake_status === 'complete' ? colors.primaryBg : colors.bgElevated, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: booking.intake_status === 'complete' ? colors.primaryBorder : colors.border, marginBottom: spacing.sm }}>
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 10, color: booking.intake_status === 'complete' ? colors.primary : colors.textFaint }}>
                    {booking.intake_status === 'complete' ? '✓ INTAKE DONE' : 'INTAKE PENDING'}
                  </Text>
                </View>
              )}

              {queue && (
                <View style={{ backgroundColor: colors.primaryBg, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.primaryBorder }}>
                  <Ionicons name="people-outline" size={16} color={colors.primary} />
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.primary, flex: 1 }}>You are #{queue.position} in the queue</Text>
                </View>
              )}

              {booking.intake_status === 'pending' && (
                <View style={{ backgroundColor: '#128C7E10', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md, flexDirection: 'row', gap: 6, alignItems: 'center', borderWidth: 1, borderColor: '#128C7E25' }}>
                  <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted, flex: 1 }}>
                    Check WhatsApp — our assistant has questions for your doctor.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => void handleCancel(booking.id)}
                disabled={cancelling === booking.id}
                style={{
                  width: '100%',
                  paddingVertical: 12,
                  borderRadius: radius.pill,
                  backgroundColor: cancelling === booking.id ? colors.bgElevated : colors.coralBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.coralBorder,
                  opacity: cancelling === booking.id ? 0.5 : 1,
                  marginTop: spacing.sm,
                }}
              >
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.coral }}>
                  {cancelling === booking.id ? 'Cancelling...' : 'Cancel Appointment'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    )
  }

  // ════════════════════════════════════════════════
  // RENDER COMPACT LIST CARD
  // ════════════════════════════════════════════════
  const renderCompactCard = (booking: Booking, isUpcomingList: boolean = false) => {
    const dt = getBookingDateTime(booking)
    const dateLabel = dt ? formatDateLabel(dt) : (booking.slot_date ?? '—')
    const timeLabel = dt ? formatTimeLabel(dt) : (booking.slot_start_time?.slice(0, 5) ?? '—')
    const isCompleted = booking.status === 'completed' || booking.status === 'no_show'
    const isCancelled = booking.status === 'cancelled'
    const isExpanded = !!expandedInfoIds[booking.id]

    return (
      <View key={booking.id} style={{ backgroundColor: colors.bgSurface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, overflow: 'hidden' }}>
        <View style={{ padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 18, color: colors.textMuted }}>
              {(booking.practice_name ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: colors.text }}>
              {booking.practice_name ?? 'Appointment'}
            </Text>
            <Text numberOfLines={1} style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              {dateLabel} at {timeLabel}
            </Text>
            <Text numberOfLines={1} style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint, marginTop: 2 }}>
              {booking.slot_duration_minutes ? `${booking.slot_duration_minutes} min` : '30 min'} · {booking.specialty}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
            {isCompleted ? (
              <TouchableOpacity style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong }}>
                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 12, color: colors.text }}>Rebook</Text>
              </TouchableOpacity>
            ) : isCancelled ? (
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.coralBg, borderWidth: 1, borderColor: colors.coralBorder }}>
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 9, color: colors.coral }}>CANCELLED</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => toggleExpand(booking.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
              >
                <Ionicons name={isExpanded ? "chevron-up-outline" : "calendar-outline"} size={16} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isUpcomingList && isExpanded && (
          <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.sm }}>
            {booking.intake_status === 'pending' && (
              <View style={{ backgroundColor: '#128C7E10', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textMuted, flex: 1 }}>
                  Check WhatsApp — assistant instructions pending.
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => void handleCancel(booking.id)}
              disabled={cancelling === booking.id}
              style={{ width: '100%', paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.coralBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.coralBorder }}
            >
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: colors.coral }}>
                {cancelling === booking.id ? 'Cancelling...' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isCompleted && !ratedBookings.has(booking.id) && (
          <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
            <TouchableOpacity onPress={() => setRatingBooking({ id: booking.id, name: booking.practice_name ?? 'Doctor' })} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#F59E0B15', borderRadius: radius.pill, paddingVertical: 8, borderWidth: 1, borderColor: '#F59E0B30' }}>
              <Ionicons name="star-outline" size={12} color="#F59E0B" />
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 11, color: '#F59E0B' }}>Rate experience</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  const renderListSectionHeader = (label: string, count: number) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md, marginTop: spacing.md }}>
      <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: colors.text }}>
        {label}
      </Text>
      {count > 0 && (
        <View style={{ backgroundColor: colors.bgElevated, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 1, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 11, color: colors.textMuted }}>{count}</Text>
        </View>
      )}
    </View>
  )

  const hasNoContent = upcoming.length === 0 && past.length === 0 && cancelled.length === 0

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>

      <View style={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + 20, paddingBottom: spacing.xs }}>
        <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 28, color: colors.text }}>
          Appointments
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} tintColor={colors.primary} />}
        >
          {hasNoContent ? (
            <View style={{ alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl }}>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.text, marginBottom: spacing.xs }}>No appointments discovered</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>Your history and schedule logs will clear and collect here.</Text>
            </View>
          ) : (
            <>
              {upcoming.length > 0 && (
                <>
                  {renderListSectionHeader('Upcoming', upcoming.length)}
                  {renderHeroCard(upcoming[0])}
                  {upcoming.slice(1).map(item => renderCompactCard(item, true))}
                </>
              )}

              {past.length > 0 && (
                <>
                  {renderListSectionHeader('Past', past.length)}
                  {past.map(item => renderCompactCard(item, false))}
                </>
              )}

              {cancelled.length > 0 && (
                <>
                  {renderListSectionHeader('Cancelled', cancelled.length)}
                  {cancelled.map(item => renderCompactCard(item, false))}
                </>
              )}
            </>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      <RatingModal
        visible={ratingBooking !== null}
        bookingId={ratingBooking?.id ?? ''}
        doctorName={ratingBooking?.name ?? ''}
        onClose={() => setRatingBooking(null)}
        onSuccess={() => {
          if (ratingBooking) {
            setRatedBookings(prev => new Set([...prev, ratingBooking.id]))
          }
          setRatingBooking(null)
        }}
      />
    </View>
  )
}