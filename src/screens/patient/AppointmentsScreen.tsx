import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '../../store/themeStore'
import { bookingsApi } from '../../api/bookings'
import { Booking } from '../../types'
import { spacing, radius } from '../../theme/spacing'

type TabType = 'upcoming' | 'past' | 'cancelled'

export default function AppointmentsScreen() {
  const { colors } = useThemeStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<TabType>('upcoming')
  const [cancelling, setCancelling] = useState<string | null>(null)

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

  const handleCancel = async (bookingId: string): Promise<void> => {
    setCancelling(bookingId)
    try {
      await bookingsApi.cancel(bookingId)
      await load()
    } finally {
      setCancelling(null)
    }
  }

  const getTabBookings = () => {
    switch (activeTab) {
      case 'upcoming': return bookings.filter((b) => b.status === 'confirmed')
      case 'cancelled': return bookings.filter((b) => b.status === 'cancelled')
      case 'past': return bookings.filter((b) => b.status === 'completed' || b.status === 'no_show')
    }
  }

  const displayed = getTabBookings()
  const upcoming = bookings.filter((b) => b.status === 'confirmed')
  const cancelled = bookings.filter((b) => b.status === 'cancelled')
  const past = bookings.filter((b) => b.status === 'completed' || b.status === 'no_show')

  const TABS: { key: TabType; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { key: 'past', label: 'Past', count: past.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelled.length },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: colors.primaryBg, border: colors.primaryBorder, text: colors.primary, bar: colors.primary }
      case 'cancelled': return { bg: colors.coralBg, border: colors.coralBorder, text: colors.coral, bar: colors.coral }
      default: return { bg: colors.bgElevated, border: colors.border, text: colors.textMuted, bar: colors.textFaint }
    }
  }

  const getEmptyIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (activeTab) {
      case 'upcoming': return 'calendar-outline'
      case 'cancelled': return 'close-circle-outline'
      default: return 'checkmark-circle-outline'
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: 60 }}>
      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 17, color: colors.text, marginBottom: spacing.lg, textAlign: 'center' }}>
        Appointments
      </Text>

        {/* Tab row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 9,
                borderRadius: radius.pill,
                backgroundColor: activeTab === tab.key ? colors.primary : colors.bgSurface,
                borderWidth: 1,
                borderColor: activeTab === tab.key ? colors.primary : colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text style={{
                fontFamily: 'Syne_700Bold',
                fontSize: 13,
                color: activeTab === tab.key ? '#FFFFFF' : colors.textMuted,
              }}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={{
                  backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : colors.bgElevated,
                  borderRadius: 10,
                  minWidth: 20,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  alignItems: 'center',
                }}>
                  <Text style={{
                    fontFamily: 'Syne_700Bold',
                    fontSize: 10,
                    color: activeTab === tab.key ? '#FFFFFF' : colors.textFaint,
                  }}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void load() }}
              tintColor={colors.primary}
            />
          }
        >
          {displayed.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primaryBg,
                borderWidth: 1,
                borderColor: colors.primaryBorder,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.md,
              }}>
                <Ionicons name={getEmptyIcon()} size={36} color={colors.primary} />
              </View>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 17, color: colors.text, marginBottom: spacing.sm }}>
                {activeTab === 'upcoming' ? 'No upcoming appointments' : activeTab === 'cancelled' ? 'No cancelled appointments' : 'No past appointments'}
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
                {activeTab === 'upcoming' ? 'Book an appointment to get started' : 'They will appear here when available'}
              </Text>
            </View>
          ) : (
            displayed.map((booking) => {
              const statusStyle = getStatusColor(booking.status)
              return (
                <View
                  key={booking.id}
                  style={{
                    backgroundColor: colors.bgSurface,
                    borderRadius: radius.xl,
                    borderWidth: 1,
                    borderColor: statusStyle.border,
                    marginBottom: spacing.md,
                    overflow: 'hidden',
                  }}
                >
                  {/* Status bar */}
                  <View style={{ height: 3, backgroundColor: statusStyle.bar }} />

                  <View style={{ padding: spacing.lg }}>
                    {/* Doctor row */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md }}>
                      <View style={{
                        width: 52,
                        height: 52,
                        borderRadius: radius.lg,
                        backgroundColor: colors.primaryBg,
                        borderWidth: 1,
                        borderColor: colors.primaryBorder,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Ionicons name="person-outline" size={24} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.text, marginBottom: 2 }}>
                          {booking.practice_name ?? 'Appointment'}
                        </Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted }}>
                          {booking.specialty}
                        </Text>
                      </View>
                      {/* Status + intake badges stacked */}
                      <View style={{ alignItems: 'flex-end', gap: 5 }}>
                        <View style={{
                          backgroundColor: statusStyle.bg,
                          borderRadius: radius.pill,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderWidth: 1,
                          borderColor: statusStyle.border,
                        }}>
                          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 10, color: statusStyle.text }}>
                            {booking.status.toUpperCase()}
                          </Text>
                        </View>

                        {/* Intake status badge */}
                        {booking.intake_status && (
                          <View style={{
                            backgroundColor: booking.intake_status === 'complete'
                              ? colors.primaryBg
                              : colors.bgElevated,
                            borderRadius: radius.pill,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderWidth: 1,
                            borderColor: booking.intake_status === 'complete'
                              ? colors.primaryBorder
                              : colors.border,
                          }}>
                            <Text style={{
                              fontFamily: 'Syne_700Bold',
                              fontSize: 9,
                              color: booking.intake_status === 'complete'
                                ? colors.primary
                                : colors.textFaint,
                            }}>
                              {booking.intake_status === 'complete' ? '✓ INTAKE DONE' : 'INTAKE PENDING'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Date + time */}
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
                      <View style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.text }}>
                          {booking.slot_date ?? '—'}
                        </Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="time-outline" size={14} color={colors.primary} />
                        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.text }}>
                          {booking.slot_start_time?.slice(0, 5) ?? '—'}
                        </Text>
                      </View>
                    </View>

                    {/* Reason */}
                    {booking.reason !== null && booking.reason !== undefined && booking.reason !== '' && (
                      <View style={{ backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md, flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
                        <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted, flex: 1 }} numberOfLines={2}>
                          {booking.reason}
                        </Text>
                      </View>
                    )}

                    {/* WhatsApp intake note — only show if pending and confirmed */}
                    {booking.status === 'confirmed' && booking.intake_status === 'pending' && (
                      <View style={{
                        backgroundColor: '#128C7E10',
                        borderRadius: radius.md,
                        padding: spacing.sm,
                        marginBottom: spacing.md,
                        flexDirection: 'row',
                        gap: 6,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#128C7E25',
                      }}>
                        <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted, flex: 1 }}>
                          Check WhatsApp — our assistant has questions for your doctor.
                        </Text>
                      </View>
                    )}

                    {/* Actions — only for confirmed */}
                    {booking.status === 'confirmed' && (
                      <View style={{ gap: spacing.sm }}>
                        <TouchableOpacity
                          style={{
                            paddingVertical: 12,
                            borderRadius: radius.pill,
                            borderWidth: 1.5,
                            borderColor: colors.borderStrong,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                          disabled
                        >
                          <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
                          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.textMuted }}>
                            Reschedule
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => void handleCancel(booking.id)}
                          disabled={cancelling === booking.id}
                          style={{
                            paddingVertical: 12,
                            borderRadius: radius.pill,
                            backgroundColor: cancelling === booking.id ? colors.bgElevated : colors.coralBg,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 6,
                            borderWidth: 1,
                            borderColor: colors.coralBorder,
                            opacity: cancelling === booking.id ? 0.5 : 1,
                          }}
                        >
                          <Ionicons name="close-circle-outline" size={15} color={colors.coral} />
                          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.coral }}>
                            {cancelling === booking.id ? 'Cancelling...' : 'Cancel appointment'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )
            })
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </View>
  )
}