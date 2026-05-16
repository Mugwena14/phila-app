export type UserRole = 'patient' | 'doctor'

export interface User {
  id: string
  full_name: string
  email: string
  phone: string
  role: UserRole
  language_pref: string
  created_at?: string
}

export interface WorkingHour {
  day_of_week: number  // 0=Monday ... 6=Sunday
  is_active: boolean
  start_time: string   // "08:00:00"
  end_time: string     // "17:00:00"
}

export interface Doctor {
  id: string
  user_id: string
  specialty: string
  bio: string | null
  years_experience: number
  qualification: string | null
  practice_name: string
  address: string
  city: string
  province: string
  latitude: number | null
  longitude: number | null
  consultation_fee: number
  slot_duration_minutes: number
  medical_aids: string[]
  languages: string[]
  is_active: boolean
  is_verified: boolean
  rating: number
  total_reviews: number
  created_at: string
  practice_images: string[]
  working_hours: WorkingHour[]
}



export interface Slot {
  id: string
  doctor_id: string
  date: string
  start_time: string
  end_time: string
  status: 'available' | 'booked' | 'blocked'
}

export interface Booking {
  id: string
  patient_id: string
  doctor_id: string
  slot_id: string
  status: string
  reason: string | null
  risk_score: string
  created_at: string
  slot_date?: string
  slot_start_time?: string
  slot_end_time?: string
  slot_duration_minutes?: number
  doctor_name?: string
  practice_name?: string
  specialty?: string
  intake_status?: string
  intake_brief?: any
  crisis_flag?: string
  latitude?: number | null
  longitude?: number | null
  address?: string
  city?: string
  province?: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  MainTabs: undefined
  DoctorTabs: undefined
  DoctorProfile: { doctorId: string }
  BookingConfirm: { slotId: string; doctor: Doctor }
  BookingSuccess: { booking: Booking }
}

export type PatientTabParamList = {
  Home: undefined
  Search: undefined
  Appointments: undefined
  Profile: undefined
}

export type DoctorTabParamList = {
  Today: undefined
  Schedule: undefined
  Patients: undefined
  DoctorProfile: undefined
}

export type WorkingHoursInput = {
  day_of_week: number
  is_active: boolean
  start_time: string
  end_time: string
}