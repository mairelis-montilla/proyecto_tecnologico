import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { upload, handleMulterError } from '../middlewares/upload.middleware.js'
import {
  createBooking,
  getMyBookings,
  getBookingById,
  uploadPaymentProof,
  cancelBooking,
  getRefundPolicy,
  approveBooking,
  rejectBooking,
  getMentorPendingCount,
} from '../controllers/bookings.controller.js'

const router = Router()

// Validadores
const createBookingValidator = [
  body('mentorId').isMongoId().withMessage('ID de mentor inválido'),
  body('slotStartIso').isISO8601().withMessage('Fecha de inicio inválida'),
  body('slotEndIso')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  body('topic')
    .notEmpty()
    .withMessage('El tema es requerido')
    .isLength({ max: 200 })
    .withMessage('El tema no debe exceder 200 caracteres'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('El mensaje no debe exceder 500 caracteres'),
]

const getMyBookingsValidator = [
  query('status')
    .optional()
    .isIn([
      'upcoming',
      'past',
      'cancelled',
      'pending_review',
      'confirmed',
      'completed',
    ])
    .withMessage('Estado inválido'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe ser un número entre 1 y 50'),
]

const paymentProofValidator = [
  param('id').isMongoId().withMessage('ID de reserva inválido'),
  body('paymentMethod')
    .isIn(['yape', 'plin', 'transferencia'])
    .withMessage('Método de pago inválido'),
  body('amountPaid')
    .isFloat({ min: 0 })
    .withMessage('El monto debe ser un número positivo'),
]

const cancelBookingValidator = [
  param('id').isMongoId().withMessage('ID de reserva inválido'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La razón no debe exceder 500 caracteres'),
]

const rejectBookingValidator = [
  param('id').isMongoId().withMessage('ID de reserva inválido'),
  body('reason')
    .notEmpty()
    .withMessage('La razón del rechazo es obligatoria')
    .isLength({ max: 500 })
    .withMessage('La razón no debe exceder 500 caracteres'),
]

// Rutas

// POST /api/bookings - Crear una reserva
router.post('/', authenticateToken, createBookingValidator, createBooking)

// GET /api/bookings/my - Obtener mis reservas
router.get('/my', authenticateToken, getMyBookingsValidator, getMyBookings)

// GET /api/bookings/pending-count - Conteo de solicitudes pendientes (mentor)
router.get('/pending-count', authenticateToken, getMentorPendingCount)

// PUT /api/bookings/:id/approve - Aprobar solicitud (mentor)
router.put(
  '/:id/approve',
  authenticateToken,
  param('id').isMongoId().withMessage('ID de reserva inválido'),
  body('meetLink')
    .notEmpty()
    .withMessage('El link de Google Meet es obligatorio')
    .isURL()
    .withMessage('Debe ser un URL válido'),
  approveBooking
)

// PUT /api/bookings/:id/reject - Rechazar solicitud (mentor)
router.put(
  '/:id/reject',
  authenticateToken,
  rejectBookingValidator,
  rejectBooking
)

// GET /api/bookings/:id - Obtener detalle de una reserva
router.get(
  '/:id',
  authenticateToken,
  param('id').isMongoId().withMessage('ID de reserva inválido'),
  getBookingById
)

// POST /api/bookings/:id/payment-proof - Subir comprobante de pago
router.post(
  '/:id/payment-proof',
  authenticateToken,
  upload.single('proofImage'),
  handleMulterError,
  paymentProofValidator,
  uploadPaymentProof
)

// POST /api/bookings/:id/cancel - Cancelar una reserva
router.post(
  '/:id/cancel',
  authenticateToken,
  cancelBookingValidator,
  cancelBooking
)

// GET /api/bookings/:id/refund-policy - Obtener política de reembolso
router.get(
  '/:id/refund-policy',
  authenticateToken,
  param('id').isMongoId().withMessage('ID de reserva inválido'),
  getRefundPolicy
)

export default router
