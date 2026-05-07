import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { spacing, radius } from '../../theme/spacing'
import { notificationsApi, AppNotification } from '../../api/notifications'

// ─── Notification config ──────────────────────────────────────────────────────

const NOTIF_CONFIG: Record<string, {
  icon: any
  color: (colors: any) => string
  bg: (colors: any) => string
}> = {
  booking_confirmed:    { icon: 'checkmark-circle-outline', color: c => c.primary,   bg: c => c.primaryBg },
  new_booking:          { icon: 'calendar-outline',         color: c => c.primary,   bg: c => c.primaryBg },
  booking_cancelled:    { icon: 'close-circle-outline',      color: c => c.coral,     bg: c => c.coralBg   },
  appointment_reminder: { icon: 'alarm-outline',             color: c => '#F59E0B',   bg: c => '#FEF3C715' },
  patient_checkin:      { icon: 'person-outline',            color: c => c.primary,   bg: c => c.primaryBg },
  no_show:              { icon: 'warning-outline',           color: c => c.coral,     bg: c => c.coralBg   },
  slots_low:            { icon: 'time-outline',              color: c => '#F59E0B',   bg: c => '#FEF3C715' },
  daily_summary:        { icon: 'bar-chart-outline',         color: c => c.primary,   bg: c => c.primaryBg },
  document_ready:       { icon: 'document-text-outline',     color: c => c.primary,   bg: c => c.primaryBg },
  triage_summary:       { icon: 'hardware-chip-outline',     color: c => c.primary,   bg: c => c.primaryBg },
  new_doctor_nearby:    { icon: 'location-outline',          color: c => '#10B981',   bg: c => '#10B98115' },
}

const DEFAULT_CONFIG = {
  icon: 'notifications-outline',
  color: (c: any) => c.textMuted,
  bg: (c: any) => c.bgElevated,
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const now = new Date()
  const then = new Date(dateStr)
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diff < 60)  return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return then.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({
  notif,
  colors,
  onPress,
}: {
  notif: AppNotification
  colors: any
  onPress: () => void
}) {
  const config = NOTIF_CONFIG[notif.type] ?? DEFAULT_CONFIG
  const iconColor = config.color(colors)
  const iconBg    = config.bg(colors)

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: notif.is_read ? 'transparent' : colors.primaryBg + '40',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: iconBg,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        borderWidth: 1,
        borderColor: iconColor + '30',
      }}>
        <Ionicons name={config.icon} size={20} color={iconColor} />
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
          <Text style={{
            fontFamily: notif.is_read ? 'DMSans_400Regular' : 'Syne_700Bold',
            fontSize: 14,
            color: colors.text,
            flex: 1,
            marginRight: 8,
          }}>
            {notif.title}
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint, flexShrink: 0 }}>
            {relativeTime(notif.created_at)}
          </Text>
        </View>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, lineHeight: 18 }}>
          {notif.body}
        </Text>
      </View>

      {!notif.is_read && (
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.primary,
          marginTop: 6,
          flexShrink: 0,
        }} />
      )}
    </TouchableOpacity>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen({ navigation }: any) {
  const { colors } = useThemeStore()
  const insets = useSafeAreaInsets()

  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  // Modal & Sync State
  const [showBrief, setShowBrief] = useState(false)
  const [selectedBrief, setSelectedBrief] = useState<any>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const unreadCount = notifications.filter(n => !n.is_read).length

  const load = useCallback(async () => {
    try {
      const data = await notificationsApi.getAll()
      setNotifications(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const onRefresh = () => {
    setRefreshing(true)
    void load()
  }

  const handlePress = async (notif: AppNotification) => {
    if (!notif.is_read) {
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      )
      void notificationsApi.markRead(notif.id)
    }

    // 2. Behavioral Logic
    if (notif.type === 'booking_confirmed' || notif.type === 'new_booking') {
      let currentBrief = notif.action_data?.brief
      
      if (!currentBrief) {
        setShowBrief(true) 
        setIsSyncing(true)
        try {
          const freshData = await notificationsApi.getAll() // Re-fetch all or use a getOne if available
          const updatedNotif = freshData.find((n: any) => n.id === notif.id)
          currentBrief = updatedNotif?.action_data?.brief
          setNotifications(freshData)
        } catch (err) {
          console.error('Failed to sync brief:', err)
        } finally {
          setIsSyncing(false)
        }
      } else {
        setShowBrief(true)
      }

      setSelectedBrief(currentBrief || null)
    } 
    else if (notif.type === 'booking_cancelled') {
      navigation.navigate('MainTabs', {
        screen: 'Appointments',
        params: {
          initialTab: 'Cancelled',
          booking_id: notif.action_data?.booking_id,
        },
      })
    } 
    else if (notif.action_type) {
      try {
        if (['Home', 'Search', 'Profile'].includes(notif.action_type)) {
          navigation.navigate('MainTabs', {
            screen: notif.action_type,
            params: notif.action_data ?? {},
          })
        } else {
          navigation.navigate(notif.action_type, notif.action_data ?? {})
        }
      } catch (err) {
        navigation.navigate('MainTabs')
      }
    }
  }

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      await notificationsApi.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {
      // silent
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.bgSurface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: colors.bgElevated,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: colors.border,
          }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 18, color: colors.text }}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>
              {unreadCount} unread
            </Text>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAll}
            disabled={markingAll}
            style={{
              paddingHorizontal: 12, paddingVertical: 7,
              borderRadius: radius.pill,
              borderWidth: 1, borderColor: colors.primaryBorder,
              backgroundColor: colors.primaryBg,
            }}
          >
            {markingAll
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: colors.primary }}>
                  Mark all read
                </Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {notifications.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xl }}>
              <View style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: colors.bgSurface,
                borderWidth: 1, borderColor: colors.border,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: spacing.md,
              }}>
                <Ionicons name="notifications-outline" size={32} color={colors.textFaint} />
              </View>
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 18, color: colors.text }}>All caught up</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
                Your notifications will appear here when there's something new
              </Text>
            </View>
          ) : (
            notifications.map(notif => (
              <NotifRow
                key={notif.id}
                notif={notif}
                colors={colors}
                onPress={() => void handlePress(notif)}
              />
            ))
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* Intake Brief Modal */}
      <Modal visible={showBrief} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ 
            backgroundColor: colors.bgSurface, 
            borderTopLeftRadius: radius.xl, 
            borderTopRightRadius: radius.xl, 
            padding: spacing.xl,
            paddingBottom: insets.bottom + spacing.xl
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg }}>
                <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: colors.text }}>Intake Summary</Text>
                <TouchableOpacity onPress={() => setShowBrief(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: colors.bgElevated, borderRadius: radius.lg, padding: spacing.md, minHeight: 100, justifyContent: 'center' }}>
                {isSyncing ? (
                  <ActivityIndicator color={colors.primary} />
                ) : selectedBrief ? (
                  <View style={{ gap: spacing.md }}>
                    <View>
                      <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 11, color: colors.primary, textTransform: 'uppercase' }}>Main Concern</Text>
                      <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.text, fontSize: 15 }}>{selectedBrief.main_concern}</Text>
                    </View>
                    <View>
                      <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 11, color: colors.primary, textTransform: 'uppercase' }}>Severity</Text>
                      <Text style={{ fontFamily: 'DMSans_500Medium', color: colors.text, fontSize: 15 }}>{selectedBrief.severity}/10</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
                    <Ionicons name="document-text-outline" size={24} color={colors.textMuted} style={{ marginBottom: 8 }} />
                    <Text style={{ 
                      fontFamily: 'DMSans_500Medium', 
                      color: colors.textMuted, 
                      textAlign: 'center',
                      fontSize: 14,
                      lineHeight: 20
                    }}>
                      No brief yet. Fill in the brief from our sent message from our assistance.
                    </Text>
                  </View>
                )}
            </View>

            <TouchableOpacity 
              onPress={() => setShowBrief(false)}
              style={{ 
                backgroundColor: colors.primary, 
                padding: 16, 
                borderRadius: radius.pill, 
                marginTop: spacing.xl, 
                alignItems: 'center' 
              }}
            >
              <Text style={{ fontFamily: 'Syne_700Bold', color: '#FFF' }}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}