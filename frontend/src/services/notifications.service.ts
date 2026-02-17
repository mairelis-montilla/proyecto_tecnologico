import { api } from './api'

export interface Notification {
  _id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  relatedId?: string
  relatedModel?: string
  createdAt: string
  updatedAt: string
}

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications')
  return response.data.data.notifications
}

export const markAsRead = async (id: string): Promise<Notification> => {
  const response = await api.put(`/notifications/${id}/read`)
  return response.data.data.notification
}

export const markAllAsRead = async (): Promise<void> => {
  await api.put('/notifications/read-all')
}

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`)
}
