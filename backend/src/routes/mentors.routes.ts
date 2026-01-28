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
import {
  getMentorsValidator,
  getMentorByIdValidator,
  searchMentorsValidator,
  getFeaturedMentorsValidator,
  mentorProfileValidator,
} from '../validators/mentors.validator.js'
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js'
import { upload, handleMulterError } from '../middlewares/upload.middleware.js'

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

// GET /api/mentors/:id - Perfil completo de un mentor
router.get('/:id', authenticateToken, getMentorByIdValidator, getMentorById)

export default router
