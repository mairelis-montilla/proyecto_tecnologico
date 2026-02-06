import { Router } from 'express'
import {
  addAvailability,
  deleteAvailability,
  getAvailability,
  previewAvailability,
  setAvailability,
} from '../controllers/availability.controller.js'
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js'

const router = Router({ mergeParams: true })

// POST /:id/availability - Agregar slots de disponibilidad (nuevo método)
router.post(
  '/:id/availability',
  authenticateToken,
  authorize('mentor'),
  addAvailability
)

// PUT /:id/availability - Set availability (legacy - reemplaza toda la disponibilidad)
router.put(
  '/:id/availability',
  authenticateToken,
  authorize('mentor'),
  setAvailability
)

// DELETE /:id/availability/:slotId - Eliminar un slot específico
router.delete(
  '/:id/availability/:slotId',
  authenticateToken,
  authorize('mentor'),
  deleteAvailability
)

// GET /:id/availability/preview - Preview de slots disponibles para estudiantes
router.get('/:id/availability/preview', authenticateToken, previewAvailability)

// GET /:id/availability - Obtener disponibilidad del mentor
router.get('/:id/availability', authenticateToken, getAvailability)

export default router
