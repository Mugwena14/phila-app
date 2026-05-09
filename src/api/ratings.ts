import apiClient from './client'

export interface Rating {
  id: string
  patient_id: string
  doctor_id: string
  booking_id: string
  rating: number
  comment: string | null
  created_at: string
}

export const ratingsApi = {
  submit: async (data: { booking_id: string; rating: number; comment?: string }): Promise<Rating> => {
    const res = await apiClient.post<Rating>('/ratings/', data)
    return res.data
  },

  canRate: async (bookingId: string): Promise<boolean> => {
    const res = await apiClient.get<{ can_rate: boolean }>(`/ratings/booking/${bookingId}/can-rate`)
    return res.data.can_rate
  },

  getDoctorRatings: async (doctorId: string): Promise<Rating[]> => {
    const res = await apiClient.get<Rating[]>(`/ratings/doctor/${doctorId}`)
    return res.data
  },

  getQueuePosition: async (bookingId: string): Promise<{
    position: number | null
    total: number | null
    estimated_wait_minutes: number | null
    is_today: boolean
  }> => {
    const res = await apiClient.get(`/bookings/${bookingId}/queue-position`)
    return res.data
  },
}