import { Router } from 'express'
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js'
import {
  getMyProfile,
  updateMyProfile,
  getAvailableInterests,
  uploadStudentAvatar,
  getStudentById,
} from '../controllers/students.controller.js'
import { upload, handleMulterError } from '../middlewares/upload.middleware.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// GET /api/students/interests - Obtener intereses disponibles (cualquier usuario autenticado)
router.get('/interests', getAvailableInterests)

// Rutas específicas para estudiantes
router.use(authorize('student'))

// GET /api/students/profile - Obtener mi perfil
router.get('/profile', getMyProfile)

// PUT /api/students/profile - Actualizar mi perfil
router.put('/profile', updateMyProfile)

// POST /api/students/profile/avatar - Subir avatar
router.post(
  '/profile/avatar',
  upload.single('avatar'),
  handleMulterError,
  uploadStudentAvatar
)

// GET /api/students/:id - Obtener perfil público (al final para no chocar con las otras rutas)
router.get('/:id', getStudentById)

export default router
