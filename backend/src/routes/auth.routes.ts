import { Router } from 'express'
import {
  registerStudent,
  registerMentor,
  login,
  logout,
  getMe,
} from '../controllers/auth.controller.js'
import {
  registerStudentValidator,
  registerMentorValidator,
  loginValidator,
} from '../validators/auth.validator.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'

const router = Router()

// Rutas públicas
router.post('/register/student', registerStudentValidator, registerStudent)
router.post('/register/mentor', registerMentorValidator, registerMentor)
router.post('/login', loginValidator, login)

// Rutas protegidas
router.post('/logout', authenticateToken, logout)
router.get('/me', authenticateToken, getMe)

export default router
