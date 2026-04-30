import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '../../store/themeStore'
import { doctorsApi } from '../../api/doctors'
import { Doctor } from '../../types'
import { spacing, radius } from '../../theme/spacing'

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

const FILTERS = ['Top rated', 'Near me', 'Available today']

export default function SearchScreen({ navigation, route }: any) {
  const { colors } = useThemeStore()
  const [query, setQuery] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('Top rated')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searched, setSearched] = useState<boolean>(false)

  const search = async (overrideQuery?: string): Promise<void> => {
    const q = overrideQuery ?? query
    if (q.trim() === '') return
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

  const searchBySpecialty = async (specialty: string): Promise<void> => {
    setQuery(specialty)
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.md }}>
        <Text style={{ fontFamily: 'Syne_800ExtraBold', fontSize: 26, color: colors.text, marginBottom: spacing.md }}>
          Find your doctor
        </Text>

        {/* Search bar */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: spacing.base, gap: spacing.sm }}>
            <Ionicons name="search-outline" size={18} color={colors.textFaint} />
            <TextInput
              style={{ flex: 1, color: colors.text, fontFamily: 'DMSans_400Regular', fontSize: 14, paddingVertical: 13 }}
              placeholder="Doctor name, specialty, city..."
              placeholderTextColor={colors.textFaint}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => void search()}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={18} color={colors.textFaint} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => void search()}
            style={{ backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 13, color: '#FFFFFF' }}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: activeFilter === f ? colors.primary : colors.bgSurface, borderWidth: 1, borderColor: activeFilter === f ? colors.primary : colors.border }}
            >
              <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: activeFilter === f ? '#FFFFFF' : colors.textMuted }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Specialty grid — Ionicons only */}
        {!searched && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
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

        {/* Loading */}
        {loading && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        )}

        {/* No results */}
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

        {/* Results */}
        {!loading && doctors.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted, marginBottom: spacing.md }}>
              {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found
            </Text>
            {doctors.map((doctor) => (
              <View
                key={doctor.id}
                style={{ backgroundColor: colors.bgSurface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md }}
              >
                {/* Doctor info row */}
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
                      <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>{doctor.city}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                    <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 15, color: colors.primary }}>R{doctor.consultation_fee}</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.textFaint }}>per visit</Text>
                  </View>
                </View>

                {/* Medical aids */}
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

                {/* Stats row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.textMuted }}>
                    {doctor.slot_duration_minutes}min slots · {doctor.years_experience} yrs exp
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={12} color={colors.primary} />
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.primary }}>4.8</Text>
                  </View>
                </View>

                {/* Full width Book now button */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('DoctorProfile', { doctorId: doctor.id })}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: radius.pill,
                    paddingVertical: 13,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="calendar-outline" size={15} color="#FFFFFF" />
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 14, color: '#FFFFFF' }}>
                    Book now
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  )
}