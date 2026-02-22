import { Router } from 'express'
import {
  getMentors,
  getMentorById,
  searchMentors,
  getFeaturedMentors,
  getMyMentorProfile,
  createOrUpdateMentorProfile,
  updateMentorProfile,
  uploadMentorAvatar,
} from '../controllers/mentors.controller.js'
import { getReviewsByMentor } from '../controllers/reviews.controller.js'
import {
  getMentorsValidator,
  getMentorByIdValidator,
  searchMentorsValidator,
  getFeaturedMentorsValidator,
  mentorProfileValidator,
} from '../validators/mentors.validator.js'
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js'
import { upload, handleMulterError } from '../middlewares/upload.middleware.js'
import { param, query } from 'express-validator'

const router = Router()

// ========================================
// Rutas de perfil del mentor autenticado
// ========================================

// GET /api/mentors/profile - Obtener mi perfil de mentor
router.get(
  '/profile',
  authenticateToken,
  authorize('mentor'),
  getMyMentorProfile
)

// POST /api/mentors/profile - Crear/actualizar mi perfil de mentor
router.post(
  '/profile',
  authenticateToken,
  authorize('mentor'),
  mentorProfileValidator,
  createOrUpdateMentorProfile
)

// PUT /api/mentors/profile - Actualizar mi perfil de mentor
router.put(
  '/profile',
  authenticateToken,
  authorize('mentor'),
  mentorProfileValidator,
  updateMentorProfile
)

// POST /api/mentors/profile/avatar - Subir avatar del mentor
router.post(
  '/profile/avatar',
  authenticateToken,
  authorize('mentor'),
  upload.single('avatar'),
  handleMulterError,
  uploadMentorAvatar
)

// ========================================
// Rutas públicas del marketplace
// ========================================

// GET /api/mentors/search - Búsqueda avanzada (debe ir antes de /:id)
router.get('/search', authenticateToken, searchMentorsValidator, searchMentors)

// GET /api/mentors/featured - Mentores destacados
router.get('/featured', getFeaturedMentorsValidator, getFeaturedMentors)

// GET /api/mentors - Listar todos los mentores (marketplace)
router.get('/', authenticateToken, getMentorsValidator, getMentors)

// Import availability routes
import availabilityRouter from './availability.routes.js'

// Mount availability routes - this will handle /:id/availability
router.use('/', availabilityRouter)

// GET /api/mentors/:id/reviews - Ver reseñas de un mentor (con paginación y ordenamiento)
router.get(
  '/:id/reviews',
  authenticateToken,
  [
    param('id').isMongoId().withMessage('ID de mentor inválido'),
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
  ],
  (req: any, _res: any, next: any) => {
    req.params.mentorId = req.params.id
    next()
  },
  getReviewsByMentor
)

// GET /api/mentors/:id - Perfil completo de un mentor (debe ir al final)
router.get('/:id', authenticateToken, getMentorByIdValidator, getMentorById)

export default router