import apiClient from './client'
import { Doctor, Slot } from '../types'

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

    // Use general search endpoint if q is provided
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
}