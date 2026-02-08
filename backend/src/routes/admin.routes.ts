import { Router } from 'express'
import { body, param, query } from 'express-validator'
import {
  getAllSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from '../controllers/specialties.controller.js'
import {
  getPendingMentors,
  getApprovedMentors,
  getMentorDetail,
  approveMentor,
  rejectMentor,
  revokeMentor,
} from '../controllers/admin-mentors.controller.js'
import {
  getPendingPayments,
  getAllPayments,
  approvePayment,
  rejectPayment,
} from '../controllers/admin-payments.controller.js'
import {
  authenticateToken,
  authorizeRoles,
} from '../middlewares/auth.middleware.js'

const router = Router()

// Middleware: todas las rutas de admin requieren autenticación y rol admin
router.use(authenticateToken)
router.use(authorizeRoles('admin'))

// ==================== SPECIALTIES ====================

// Validadores
const createSpecialtyValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('La categoría es requerida')
    .isLength({ min: 2, max: 50 })
    .withMessage('La categoría debe tener entre 2 y 50 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El icono no puede exceder 50 caracteres'),
]

const updateSpecialtyValidator = [
  param('id').isMongoId().withMessage('ID de especialidad inválido'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La categoría debe tener entre 2 y 50 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El icono no puede exceder 50 caracteres'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
]

const getSpecialtiesValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La búsqueda debe tener entre 2 y 100 caracteres'),
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive debe ser true o false'),
]

const deleteSpecialtyValidator = [
  param('id').isMongoId().withMessage('ID de especialidad inválido'),
]

// Rutas de especialidades para admin
// GET /api/admin/specialties - Listar todas las especialidades
router.get('/specialties', getSpecialtiesValidator, getAllSpecialties)

// POST /api/admin/specialties - Crear especialidad
router.post('/specialties', createSpecialtyValidator, createSpecialty)

// PUT /api/admin/specialties/:id - Actualizar especialidad
router.put('/specialties/:id', updateSpecialtyValidator, updateSpecialty)

// DELETE /api/admin/specialties/:id - Eliminar especialidad
router.delete('/specialties/:id', deleteSpecialtyValidator, deleteSpecialty)

// ==================== MENTORS ====================

// Validadores para mentores
const getMentorsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe ser un número entre 1 y 50'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La búsqueda debe tener entre 2 y 100 caracteres'),
]

const mentorIdValidator = [
  param('id').isMongoId().withMessage('ID de mentor inválido'),
]

const rejectMentorValidator = [
  param('id').isMongoId().withMessage('ID de mentor inválido'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('El motivo no puede exceder 500 caracteres'),
]

const revokeMentorValidator = [
  param('id').isMongoId().withMessage('ID de mentor inválido'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('El motivo no puede exceder 500 caracteres'),
]

// GET /api/admin/mentors/pending - Listar mentores pendientes de aprobación
router.get('/mentors/pending', getMentorsValidator, getPendingMentors)

// GET /api/admin/mentors/approved - Listar mentores aprobados
router.get('/mentors/approved', getMentorsValidator, getApprovedMentors)

// GET /api/admin/mentors/:id - Obtener detalle de un mentor
router.get('/mentors/:id', mentorIdValidator, getMentorDetail)

// PATCH /api/admin/mentors/:id/approve - Aprobar mentor
router.patch('/mentors/:id/approve', mentorIdValidator, approveMentor)

// PATCH /api/admin/mentors/:id/reject - Rechazar mentor
router.patch('/mentors/:id/reject', rejectMentorValidator, rejectMentor)

// PATCH /api/admin/mentors/:id/revoke - Revocar aprobación de mentor
router.patch('/mentors/:id/revoke', revokeMentorValidator, revokeMentor)

// ==================== PAYMENTS ====================

// Validadores para pagos
const getPaymentsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe ser un número entre 1 y 50'),
  query('status')
    .optional()
    .isIn([
      'pending_proof',
      'pending_validation',
      'validated',
      'rejected',
      'refunded',
    ])
    .withMessage('Estado de pago inválido'),
]

const paymentIdValidator = [
  param('id').isMongoId().withMessage('ID de pago inválido'),
]

const rejectPaymentValidator = [
  param('id').isMongoId().withMessage('ID de pago inválido'),
  body('reason')
    .notEmpty()
    .withMessage('El motivo del rechazo es obligatorio')
    .trim()
    .isLength({ max: 500 })
    .withMessage('El motivo no puede exceder 500 caracteres'),
]

// GET /api/admin/payments/pending - Pagos pendientes de validación
router.get('/payments/pending', getPaymentsValidator, getPendingPayments)

// GET /api/admin/payments - Todos los pagos (historial)
router.get('/payments', getPaymentsValidator, getAllPayments)

// PATCH /api/admin/payments/:id/approve - Aprobar pago
router.patch('/payments/:id/approve', paymentIdValidator, approvePayment)

// PATCH /api/admin/payments/:id/reject - Rechazar pago
router.patch('/payments/:id/reject', rejectPaymentValidator, rejectPayment)

export default router
