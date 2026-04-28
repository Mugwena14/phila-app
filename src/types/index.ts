export type UserRole = 'patient' | 'doctor'

export interface User {
  id: string
  full_name: string
  email: string
  phone: string
  role: UserRole
  language_pref: string
}

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  MainTabs: undefined
}

export type PatientTabParamList = {
  Home: undefined
  Search: undefined
  Appointments: undefined
  Profile: undefined
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface ApiError {
  detail: string
}