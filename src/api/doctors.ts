import apiClient from './client'
import { Doctor, Slot } from '../types'

export interface NearbyDoctor {
  id: string
  practice_name: string
  specialty: string
  city: string
  consultation_fee: number
  latitude: number
  longitude: number
  availability_status: 'available_today' | 'available_week' | 'unavailable'
  next_available_slot: string | null
  travel_time_minutes: number
  medical_aids: string[]
  years_experience: number
  distance_km: number
}

export const doctorsApi = {
  search: async (params: {
    q?: string
    specialty?: string
    city?: string
    medical_aid?: string
  }): Promise<Doctor[]> => {
    const query = new URLSearchParams()
    if (params.q) query.append('q', params.q)
    if (params.specialty) query.append('specialty', params.specialty)
    if (params.city) query.append('city', params.city)
    if (params.medical_aid) query.append('medical_aid', params.medical_aid)

    const endpoint = params.q ? '/doctors/search' : '/doctors'
    const response = await apiClient.get<Doctor[]>(`${endpoint}?${query.toString()}`)
    return response.data
  },

  getById: async (id: string): Promise<Doctor> => {
    const response = await apiClient.get<Doctor>(`/doctors/${id}`)
    return response.data
  },

  getSlots: async (doctorId: string, date: string): Promise<Slot[]> => {
    const response = await apiClient.get<Slot[]>(
      `/doctors/${doctorId}/slots?date=${date}`
    )
    return response.data
  },

  getNearby: async (params: {
    lat: number
    lng: number
    radius_km?: number
  }): Promise<NearbyDoctor[]> => {
    const query = new URLSearchParams()
    query.append('lat', params.lat.toString())
    query.append('lng', params.lng.toString())
    query.append('radius_km', (params.radius_km ?? 20).toString())

    const response = await apiClient.get<NearbyDoctor[]>(
      `/doctors/nearby?${query.toString()}`
    )
    return response.data
  },
}