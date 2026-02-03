import { Router } from 'express'
import {
  registerStudent,
  registerMentor,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js'
import {
  registerStudentValidator,
  registerMentorValidator,
  loginValidator,
  verifyEmailValidator,
  resendCodeValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/auth.validator.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'

const router = Router()

// Rutas públicas - Registro y Login
router.post('/register/student', registerStudentValidator, registerStudent)
router.post('/register/mentor', registerMentorValidator, registerMentor)
router.post('/login', loginValidator, login)

// Rutas públicas - Verificación de email
router.post('/verify-email', verifyEmailValidator, verifyEmail)
router.post('/resend-code', resendCodeValidator, resendVerificationCode)

// Rutas públicas - Recuperación de contraseña
router.post('/forgot-password', forgotPasswordValidator, forgotPassword)
router.post('/reset-password', resetPasswordValidator, resetPassword)

// Rutas protegidas
router.post('/logout', authenticateToken, logout)
router.get('/me', authenticateToken, getMe)

export default router
