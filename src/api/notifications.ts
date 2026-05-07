import apiClient from './client'

export interface AppNotification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  is_read: boolean
  action_type: string | null
  action_data: Record<string, any> | null
  created_at: string
}

export const notificationsApi = {
  getAll: async (): Promise<AppNotification[]> => {
    const res = await apiClient.get<AppNotification[]>('/notifications/')
    return res.data
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<{ count: number }>('/notifications/unread-count')
    return res.data.count
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`)
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all')
  },
}