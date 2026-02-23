import { Router, Request, Response } from 'express'
import { body, param, query } from 'express-validator'
import { sendEmail } from '../services/email.service.js'
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
  getPaymentsSummary,
  exportPayments,
} from '../controllers/admin-payments.controller.js'
import {
  getUsers,
  getUserById,
  updateUser,
  blockUser,
  unblockUser,
  getBlockHistory,
} from '../controllers/admin-users.controller.js'
import { getDashboardStats } from '../controllers/admin-dashboard.controller.js'
import {
  getReportUsers,
  getReportSessions,
  getReportRevenue,
  getReportTopMentors,
  exportReport,
} from '../controllers/admin-reports.controller.js'
import {
  authenticateToken,
  authorizeRoles,
} from '../middlewares/auth.middleware.js'

const router = Router()

// Middleware: todas las rutas de admin requieren autenticación y rol admin
router.use(authenticateToken)
router.use(authorizeRoles('admin'))

// ==================== TEST EMAIL ====================

// POST /api/admin/test-email - Verificar configuración SMTP enviando un correo de prueba
router.post(
  '/test-email',
  [body('to').isEmail().withMessage('Se requiere un email válido en "to"')],
  async (req: Request, res: Response) => {
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'

    if (!smtpUser || !smtpPass) {
      res.status(500).json({
        status: 'error',
        message: 'SMTP no configurado en variables de entorno',
        smtp: {
          SMTP_HOST: smtpHost,
          SMTP_USER: smtpUser ? '✅ configurado' : '❌ falta',
          SMTP_PASS: smtpPass ? '✅ configurado' : '❌ falta',
          SMTP_FROM: process.env.SMTP_FROM ? '✅ configurado' : '❌ falta',
        },
      })
      return
    }

    const { to } = req.body
    const sent = await sendEmail(to, 'verification', {
      firstName: 'Admin',
      code: '123456',
    })

    res.status(sent ? 200 : 500).json({
      status: sent ? 'success' : 'error',
      message: sent
        ? `✅ Correo de prueba enviado a ${to}`
        : `❌ Fallo al enviar el correo. Revisa los logs del servidor.`,
      smtp: {
        SMTP_HOST: smtpHost,
        SMTP_USER: smtpUser,
        SMTP_FROM: process.env.SMTP_FROM || smtpUser,
      },
    })
  }
)

// ==================== DASHBOARD ====================

// GET /api/admin/dashboard/stats - Estadísticas del dashboard
router.get('/dashboard/stats', getDashboardStats)

// ==================== REPORTS ====================

const reportsValidator = [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'custom'])
    .withMessage('Período inválido'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Fecha inicio debe ser ISO8601'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Fecha fin debe ser ISO8601'),
]

// GET /api/admin/reports/users - Reporte de usuarios registrados
router.get('/reports/users', reportsValidator, getReportUsers)

// GET /api/admin/reports/sessions - Reporte de sesiones
router.get('/reports/sessions', reportsValidator, getReportSessions)

// GET /api/admin/reports/revenue - Reporte de ingresos
router.get('/reports/revenue', reportsValidator, getReportRevenue)

// GET /api/admin/reports/top-mentors - Mentores más activos
router.get('/reports/top-mentors', reportsValidator, getReportTopMentors)

// GET /api/admin/reports/export - Exportar reporte a CSV
router.get(
  '/reports/export',
  [
    ...reportsValidator,
    query('type')
      .optional()
      .isIn(['revenue', 'sessions', 'users', 'top-mentors'])
      .withMessage('Tipo de reporte inválido'),
  ],
  exportReport
)

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

// ==================== USERS ====================

// Validadores para usuarios
const getUsersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe ser un número entre 1 y 50'),
  query('role')
    .optional()
    .isIn(['student', 'mentor', 'admin'])
    .withMessage('Rol inválido'),
  query('status')
    .optional()
    .isIn(['active', 'blocked', 'inactive'])
    .withMessage('Estado inválido'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La búsqueda debe tener entre 2 y 100 caracteres'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'firstName', 'lastName', 'email', 'role'])
    .withMessage('Campo de ordenamiento inválido'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Orden inválido'),
]

const userIdValidator = [
  param('id').isMongoId().withMessage('ID de usuario inválido'),
]

const updateUserValidator = [
  param('id').isMongoId().withMessage('ID de usuario inválido'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('role')
    .optional()
    .isIn(['student', 'mentor', 'admin'])
    .withMessage('Rol inválido'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
]

const blockUserValidator = [
  param('id').isMongoId().withMessage('ID de usuario inválido'),
  body('reason')
    .notEmpty()
    .withMessage('El motivo del bloqueo es obligatorio')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('El motivo debe tener entre 5 y 500 caracteres'),
]

const unblockUserValidator = [
  param('id').isMongoId().withMessage('ID de usuario inválido'),
  body('reason')
    .notEmpty()
    .withMessage('El motivo del desbloqueo es obligatorio')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('El motivo debe tener entre 5 y 500 caracteres'),
]

// GET /api/admin/users - Listar usuarios con filtros
router.get('/users', getUsersValidator, getUsers)

// GET /api/admin/users/:id - Obtener detalle de un usuario
router.get('/users/:id', userIdValidator, getUserById)

// PATCH /api/admin/users/:id - Actualizar datos de un usuario
router.patch('/users/:id', updateUserValidator, updateUser)

// PATCH /api/admin/users/:id/block - Bloquear usuario
router.patch('/users/:id/block', blockUserValidator, blockUser)

// PATCH /api/admin/users/:id/unblock - Desbloquear usuario
router.patch('/users/:id/unblock', unblockUserValidator, unblockUser)

// GET /api/admin/users/:id/block-history - Historial de bloqueos
router.get('/users/:id/block-history', userIdValidator, getBlockHistory)

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
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Fecha inicio debe ser ISO8601'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Fecha fin debe ser ISO8601'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La búsqueda debe tener entre 2 y 100 caracteres'),
  query('paymentMethod')
    .optional()
    .isIn(['yape', 'plin', 'transfer', 'cash'])
    .withMessage('Método de pago inválido'),
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

// GET /api/admin/payments/summary - Resumen financiero
router.get('/payments/summary', getPaymentsSummary)

// GET /api/admin/payments/export - Exportar pagos a CSV
router.get('/payments/export', getPaymentsValidator, exportPayments)

// GET /api/admin/payments - Todos los pagos (historial)
router.get('/payments', getPaymentsValidator, getAllPayments)

// PATCH /api/admin/payments/:id/approve - Aprobar pago
router.patch('/payments/:id/approve', paymentIdValidator, approvePayment)

// PATCH /api/admin/payments/:id/reject - Rechazar pago
router.patch('/payments/:id/reject', rejectPaymentValidator, rejectPayment)

export default router
