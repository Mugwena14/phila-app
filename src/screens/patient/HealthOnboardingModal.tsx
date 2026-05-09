import React, { useState } from 'react'
import {
  View, Text, Modal, TouchableOpacity,
  TextInput, ActivityIndicator, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '../../store/themeStore'
import { patientsApi } from '../../api/patients'
import { spacing, radius } from '../../theme/spacing'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

interface Props {
  visible: boolean
  onClose: () => void
}

export default function HealthOnboardingModal({ visible, onClose }: Props) {
  const { colors } = useThemeStore()
  const [step, setStep]           = useState<number>(1)
  const [dob, setDob]             = useState<string>('')
  const [bloodType, setBloodType] = useState<string>('')
  const [height, setHeight]       = useState<string>('')
  const [weight, setWeight]       = useState<string>('')
  const [loading, setLoading]     = useState<boolean>(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await patientsApi.updateProfile({
        date_of_birth: dob || undefined,
        blood_type: bloodType || undefined,
        height_cm: height ? parseFloat(height) : undefined,
        weight_kg: weight ? parseFloat(weight) : undefined,
      })
      onClose()
    } catch {
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    fontFamily: 'DMSans_400Regular' as const,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 8,
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#00000080', justifyContent: 'center', paddingHorizontal: spacing.lg }}>
        <View style={{
          backgroundColor: colors.bgSurface,
          borderRadius: 24, padding: spacing.lg,
          borderWidth: 1, borderColor: colors.border,
        }}>
          {/* Progress */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: spacing.lg }}>
            {[1, 2].map(s => (
              <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: s <= step ? colors.primary : colors.bgElevated }} />
            ))}
          </View>

          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: spacing.lg, right: spacing.lg }}>
            <Ionicons name="close" size={20} color={colors.textFaint} />
          </TouchableOpacity>

          {step === 1 && (
            <>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
                <Ionicons name="heart-outline" size={26} color={colors.primary} />
              </View>
              <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: colors.text, marginBottom: 6 }}>
                Your health profile
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 22 }}>
                Help your doctors prepare better by adding some basic health info. Takes 30 seconds.
              </Text>

              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                Date of birth
              </Text>
              <TextInput
                value={dob}
                onChangeText={setDob}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textFaint}
                style={inp}
                keyboardType="numbers-and-punctuation"
              />

              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.md, marginBottom: 8 }}>
                Blood type
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {BLOOD_TYPES.map(bt => (
                  <TouchableOpacity
                    key={bt}
                    onPress={() => setBloodType(bt)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 10,
                      borderRadius: radius.pill,
                      backgroundColor: bloodType === bt ? colors.primary : colors.bgElevated,
                      borderWidth: 1,
                      borderColor: bloodType === bt ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: bloodType === bt ? '#FFFFFF' : colors.textMuted }}>
                      {bt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setStep(2)}
                style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center', marginTop: spacing.xl }}
              >
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: '#FFFFFF' }}>Continue →</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
                <Ionicons name="body-outline" size={26} color={colors.primary} />
              </View>
              <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: colors.text, marginBottom: 6 }}>
                Body measurements
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg }}>
                Optional — you can always update these later in your profile.
              </Text>

              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                Height (cm)
              </Text>
              <TextInput
                value={height}
                onChangeText={setHeight}
                placeholder="e.g. 175"
                placeholderTextColor={colors.textFaint}
                style={inp}
                keyboardType="decimal-pad"
              />

              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.md, marginBottom: 4 }}>
                Weight (kg)
              </Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g. 72"
                placeholderTextColor={colors.textFaint}
                style={inp}
                keyboardType="decimal-pad"
              />

              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  style={{ flex: 1, borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border }}
                >
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.textMuted }}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => void handleSave()}
                  disabled={loading}
                  style={{ flex: 2, backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                >
                  {loading
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Ionicons name="checkmark-outline" size={18} color="#FFFFFF" />
                  }
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: '#FFFFFF' }}>
                    {loading ? 'Saving...' : 'Save profile'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', marginTop: spacing.md }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textFaint }}>Skip for now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}