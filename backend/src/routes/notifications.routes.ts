import { Router } from 'express'
import { param } from 'express-validator'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notifications.controller.js'

const router = Router()

// GET /api/notifications - Obtener notificaciones del usuario
router.get('/', authenticateToken, getNotifications)

// PUT /api/notifications/read-all - Marcar todas como leidas
router.put('/read-all', authenticateToken, markAllAsRead)

// PUT /api/notifications/:id/read - Marcar una como leida
router.put(
  '/:id/read',
  authenticateToken,
  param('id').isMongoId().withMessage('ID de notificacion invalido'),
  markAsRead
)

// DELETE /api/notifications/:id - Eliminar una notificacion
router.delete(
  '/:id',
  authenticateToken,
  param('id').isMongoId().withMessage('ID de notificacion invalido'),
  deleteNotification
)

export default router
