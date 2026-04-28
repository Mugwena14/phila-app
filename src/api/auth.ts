import apiClient from './client'
import { TokenResponse, User } from '../types/index'

export interface RegisterPayload {
  full_name: string
  email: string
  phone: string
  password: string
  language_pref?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  register: async (data: RegisterPayload): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', data)
    return response.data
  },

  login: async (data: LoginPayload): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>(
      `/auth/login?email=${encodeURIComponent(data.email)}&password=${encodeURIComponent(data.password)}`
    )
    return response.data
  },
}