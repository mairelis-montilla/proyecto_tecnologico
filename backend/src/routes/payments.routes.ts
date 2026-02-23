import { Router } from 'express'
import { getMyPayments } from '../controllers/payments.controller.js'
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js'

const router = Router()

// GET /api/payments/my-payments - Mis pagos (estudiante)
router.get(
  '/my-payments',
  authenticateToken,
  authorize('student'),
  getMyPayments
)

// GET /api/payments/history - Historial de pagos (estudiante) — misma lógica
router.get('/history', authenticateToken, authorize('student'), getMyPayments)

export default router
