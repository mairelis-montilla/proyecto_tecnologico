import { Router } from 'express'
import { getReviewsByMentor } from '../controllers/reviews.controller.js'
import { param, query } from 'express-validator'
import { authenticateToken } from '../middlewares/auth.middleware.js'

const router = Router()

// Validadores
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

// Rutas
// GET /api/reviews/mentor/:mentorId - Obtener reseñas de un mentor
router.get(
  '/mentor/:mentorId',
  authenticateToken,
  getReviewsByMentorValidator,
  getReviewsByMentor
)

export default router
