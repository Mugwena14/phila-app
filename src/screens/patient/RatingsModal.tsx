import React, { useState } from 'react'
import {
  View, Text, Modal, TouchableOpacity,
  TextInput, ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '../../store/themeStore'
import { ratingsApi } from '../../api/ratings'
import { spacing, radius } from '../../theme/spacing'

interface RatingModalProps {
  visible: boolean
  bookingId: string
  doctorName: string
  onClose: () => void
  onSuccess: () => void
}

export default function RatingModal({ visible, bookingId, doctorName, onClose, onSuccess }: RatingModalProps) {
  const { colors } = useThemeStore()
  const [rating, setRating]   = useState<number>(0)
  const [comment, setComment] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError]     = useState<string>('')

  const handleSubmit = async (): Promise<void> => {
    if (rating === 0) { 
      setError('Please select a rating')
      return 
    }
    setLoading(true)
    setError('')
    try {
      await ratingsApi.submit({ 
        booking_id: bookingId, 
        rating, 
        comment: comment.trim() || undefined 
      })
      onSuccess()
    } catch {
      setError('Could not submit rating. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const LABELS: string[] = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: '#00000060' }}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: colors.bgSurface,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: spacing.lg, paddingBottom: 40,
        borderTopWidth: 1, borderColor: colors.border,
      }}>
        {/* Handle */}
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg }} />

        {/* Close */}
        <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 24, right: spacing.lg }}>
          <Ionicons name="close" size={22} color={colors.textFaint} />
        </TouchableOpacity>

        <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: colors.text, marginBottom: 4 }}>
          Rate your visit
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, marginBottom: spacing.xl }}>
          How was your experience with {doctorName}?
        </Text>

        {/* Stars */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          {[1, 2, 3, 4, 5].map((star: number) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={44}
                color={star <= rating ? '#F59E0B' : colors.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Label */}
        <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, color: '#F59E0B', textAlign: 'center', marginBottom: spacing.lg, minHeight: 24 }}>
          {rating > 0 ? LABELS[rating] : ''}
        </Text>

        {/* Comment */}
        <View style={{
          backgroundColor: colors.bgElevated, borderRadius: radius.lg,
          borderWidth: 1, borderColor: colors.border,
          padding: spacing.md, marginBottom: spacing.md,
        }}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment (optional)..."
            placeholderTextColor={colors.textFaint}
            style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.text, minHeight: 60, textAlignVertical: 'top' }}
            multiline
          />
        </View>

        {error !== '' && (
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.coral, marginBottom: spacing.sm, textAlign: 'center' }}>
            {error}
          </Text>
        )}

        <TouchableOpacity
          onPress={() => void handleSubmit()}
          disabled={loading || rating === 0}
          style={{
            backgroundColor: rating === 0 ? colors.bgElevated : colors.primary,
            borderRadius: radius.pill, paddingVertical: 16,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}
        >
          {loading
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Ionicons name="star-outline" size={16} color={rating === 0 ? colors.textFaint : '#FFFFFF'} />
          }
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: rating === 0 ? colors.textFaint : '#FFFFFF' }}>
            {loading ? 'Submitting...' : 'Submit rating'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}