import { Router } from 'express'
import {
  getMentors,
  getMentorById,
  searchMentors,
  getFeaturedMentors,
} from '../controllers/mentors.controller.js'
import {
  getMentorsValidator,
  getMentorByIdValidator,
  searchMentorsValidator,
  getFeaturedMentorsValidator,
} from '../validators/mentors.validator.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'

const router = Router()

// Rutas públicas (no requieren autenticación para ver mentores)
// Sin embargo, podrían requerir autenticación según los requisitos

// GET /api/mentors/search - Búsqueda avanzada (debe ir antes de /:id)
router.get('/search', authenticateToken, searchMentorsValidator, searchMentors)

// GET /api/mentors/featured - Mentores destacados
router.get('/featured', getFeaturedMentorsValidator, getFeaturedMentors)

// GET /api/mentors - Listar todos los mentores (marketplace)
router.get('/', authenticateToken, getMentorsValidator, getMentors)

// GET /api/mentors/:id - Perfil completo de un mentor
router.get('/:id', authenticateToken, getMentorByIdValidator, getMentorById)

export default router
