import { Response } from 'express'
import { Notification } from '../models/Notification.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'

/**
 * Obtener notificaciones del usuario autenticado
 * GET /api/notifications
 */
export const getNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id

    if (!userId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    res.status(200).json({
      status: 'success',
      data: { notifications },
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Marcar una notificacion como leida
 * PUT /api/notifications/:id/read
 */
export const markAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id
    const { id } = req.params

    if (!userId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    )

    if (!notification) {
      res
        .status(404)
        .json({ status: 'error', message: 'Notificacion no encontrada' })
      return
    }

    res.status(200).json({
      status: 'success',
      data: { notification },
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Marcar todas las notificaciones como leidas
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id

    if (!userId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    )

    res.status(200).json({
      status: 'success',
      message: 'Todas las notificaciones marcadas como leidas',
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Eliminar una notificacion
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id
    const { id } = req.params

    if (!userId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId,
    })

    if (!notification) {
      res
        .status(404)
        .json({ status: 'error', message: 'Notificacion no encontrada' })
      return
    }

    res.status(200).json({
      status: 'success',
      message: 'Notificacion eliminada',
    })
  } catch (error) {
    console.error('Error deleting notification:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}
