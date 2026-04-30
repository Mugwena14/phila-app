import apiClient from './client'

export interface PatientProfile {
  id: string
  user_id: string
  height_cm: number | null
  weight_kg: number | null
  blood_type: string | null
  date_of_birth: string | null
}

export interface UpdateProfilePayload {
  height_cm?: number
  weight_kg?: number
  blood_type?: string
  date_of_birth?: string
}

export const patientsApi = {
  getProfile: async (): Promise<PatientProfile> => {
    const response = await apiClient.get<PatientProfile>('/patients/profile')
    return response.data
  },

  updateProfile: async (data: UpdateProfilePayload): Promise<PatientProfile> => {
    const response = await apiClient.put<PatientProfile>('/patients/profile', data)
    return response.data
  },
}