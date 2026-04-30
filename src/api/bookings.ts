import apiClient from './client'
import { Booking } from '../types'

export interface CreateBookingPayload {
  slot_id: string
  reason?: string
}

export const bookingsApi = {
  create: async (data: CreateBookingPayload): Promise<Booking> => {
    const response = await apiClient.post<Booking>('/bookings/', data)
    return response.data
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get<Booking[]>('/bookings/my')
    return response.data
  },

  cancel: async (bookingId: string): Promise<void> => {
    await apiClient.delete(`/bookings/${bookingId}`)
  },
}