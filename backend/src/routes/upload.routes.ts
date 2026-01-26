import { Router } from 'express'
import { uploadAvatar } from '../controllers/mentors.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { upload, handleMulterError } from '../middlewares/upload.middleware.js'

const router = Router()

// POST /api/upload/avatar - Subir avatar (para cualquier usuario autenticado)
router.post(
  '/avatar',
  authenticateToken,
  upload.single('avatar'),
  handleMulterError,
  uploadAvatar
)

export default router
