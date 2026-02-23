import { Router } from 'express'
import {
  createReview,
  getReviewsByMentor,
  getReviewByBooking,
} from '../controllers/reviews.controller.js'
import { body, param, query } from 'express-validator'
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js'

const router = Router()

// Validadores para crear review
const createReviewValidator = [
  body('sessionId').notEmpty().isMongoId().withMessage('ID de sesión inválido'),
  body('rating')
    .notEmpty()
    .isInt({ min: 1, max: 5 })
    .withMessage('El rating debe ser un número entre 1 y 5'),
  body('comment')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('El comentario no puede superar los 500 caracteres'),
]

// Validadores para obtener reviews de un mentor
const getReviewsByMentorValidator = [
  param('mentorId').isMongoId().withMessage('ID de mentor inválido'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe ser un número entre 1 y 50'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'rating'])
    .withMessage('Campo de ordenamiento inválido'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Orden debe ser asc o desc'),
]

// Validador para obtener review por booking
const getReviewByBookingValidator = [
  param('bookingId').isMongoId().withMessage('ID de sesión inválido'),
]

// Rutas

// POST /api/reviews - Crear calificación (solo estudiantes autenticados)
router.post(
  '/',
  authenticateToken,
  authorize('student'),
  createReviewValidator,
  createReview
)

// GET /api/reviews/mentor/:mentorId - Obtener reseñas de un mentor
router.get(
  '/mentor/:mentorId',
  authenticateToken,
  getReviewsByMentorValidator,
  getReviewsByMentor
)

// GET /api/reviews/booking/:bookingId - Obtener review de una sesión
router.get(
  '/booking/:bookingId',
  authenticateToken,
  getReviewByBookingValidator,
  getReviewByBooking
)

export default router
