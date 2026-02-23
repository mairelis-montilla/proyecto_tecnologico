import { create } from 'zustand'
import {
  Notification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../services/notifications.service'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null

  fetchNotifications: () => Promise<void>
  markOneAsRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  removeNotification: (id: string) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null })
    try {
      const notifications = await getNotifications()
      set({
        notifications,
        unreadCount: notifications.filter(n => !n.isRead).length,
        isLoading: false,
      })
    } catch (error) {
      set({ error: 'Error al cargar notificaciones', isLoading: false })
      console.error(error)
    }
  },

  markOneAsRead: async (id: string) => {
    try {
      // Optimistic update
      const { notifications } = get()
      const updatedNotifications = notifications.map(n =>
        n._id === id ? { ...n, isRead: true } : n
      )
      set({
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.isRead).length,
      })

      await markAsRead(id)
    } catch (error) {
      console.error(error)
      // Revert if needed, but for read status it's usually fine
      get().fetchNotifications()
    }
  },

  markAllRead: async () => {
    try {
      const { notifications } = get()
      const updatedNotifications = notifications.map(n => ({
        ...n,
        isRead: true,
      }))
      set({
        notifications: updatedNotifications,
        unreadCount: 0,
      })

      await markAllAsRead()
    } catch (error) {
      console.error(error)
      get().fetchNotifications()
    }
  },

  removeNotification: async (id: string) => {
    try {
      const { notifications } = get()
      const updatedNotifications = notifications.filter(n => n._id !== id)
      set({
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.isRead).length,
      })

      await deleteNotification(id)
    } catch (error) {
      console.error(error)
      get().fetchNotifications()
    }
  },
}))
