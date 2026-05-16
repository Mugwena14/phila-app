import React from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Doctor } from '../../types'
import { spacing, radius } from '../../theme/spacing'

// Placeholder images — rotated by index so cards don't all look the same
const PRACTICE_IMAGES = [
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?auto=format&fit=crop&w=600&q=80',
]

interface DoctorSearchCardProps {
  doctor: Doctor
  index: number
  isSelected: boolean
  colors: any
  onPress: () => void
  onView: () => void
}

export default function DoctorSearchCard({
  doctor,
  index,
  isSelected,
  colors,
  onPress,
  onView,
}: DoctorSearchCardProps) {
    const imageUri = doctor.practice_images && doctor.practice_images.length > 0
    ? doctor.practice_images[0]
    : PRACTICE_IMAGES[index % PRACTICE_IMAGES.length]

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: colors.bgSurface,
        borderRadius: radius.xl,
        borderWidth: isSelected ? 1.5 : 1,
        borderColor: isSelected ? colors.primary : colors.border,
        marginBottom: spacing.md,
        overflow: 'hidden',
      }}
    >
      {/* Hero image — taller now that medical aids + slots are gone */}
      <Image
        source={{ uri: imageUri }}
        style={{ width: '100%', height: 180, backgroundColor: colors.bgElevated }}
        resizeMode="cover"
      />

      {/* Card body */}
      <View style={{ padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.text, marginBottom: 2 }}>
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
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>
                {doctor.city}
              </Text>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.primary }}>
              R{doctor.consultation_fee}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>
              per visit
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onView}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 14,
            paddingVertical: 13,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Ionicons name="calendar-outline" size={15} color="#FFFFFF" />
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: '#FFFFFF' }}>
            View Practice
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}