import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { User } from '../models/User.model.js'
import { Student } from '../models/Student.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { EmailVerification } from '../models/EmailVerification.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'
import {
  sendVerificationCode,
  sendPasswordResetCode,
} from '../services/email.service.js'

const generateToken = (userId: string, role: string): string => {
  const jwtSecret = process.env.JWT_SECRET
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d'

  if (!jwtSecret) {
    throw new Error('JWT_SECRET no está configurado')
  }

  return jwt.sign({ userId, role }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  } as jwt.SignOptions)
}

export const registerStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Errores de validación',
        errors: errors.array(),
      })
      return
    }

    const {
      email,
      password,
      firstName,
      lastName,
      bio,
      institution,
      career,
      semester,
    } = req.body

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'El email ya está registrado',
      })
      return
    }

    // Hash de la contraseña
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Crear usuario
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'student',
    })

    // Crear perfil de estudiante
    const student = await Student.create({
      userId: user._id,
      bio,
      institution,
      career,
      semester,
    })

    // Crear código de verificación de email
    const verification = await (EmailVerification as any).createVerification(
      user._id as mongoose.Types.ObjectId,
      'email_verification'
    )

    // Enviar email con código de verificación
    await sendVerificationCode(user.email, user.firstName, verification.code)

    // Generar token
    const token = generateToken(user._id.toString(), user.role)

    res.status(201).json({
      status: 'success',
      message:
        'Estudiante registrado exitosamente. Se ha enviado un código de verificación a tu correo.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
        profile: {
          id: student._id,
          bio: student.bio,
          institution: student.institution,
          career: student.career,
          semester: student.semester,
        },
        token,
        requiresVerification: true,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const registerMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Errores de validación',
        errors: errors.array(),
      })
      return
    }

    const {
      email,
      password,
      firstName,
      lastName,
      bio,
      experience,
      specialties,
      credentials,
      hourlyRate,
    } = req.body

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'El email ya está registrado',
      })
      return
    }

    // Hash de la contraseña
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Crear usuario
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'mentor',
    })

    // Crear perfil de mentor
    const mentor = await Mentor.create({
      userId: user._id,
      bio,
      experience,
      specialties: specialties || [],
      credentials: credentials || [],
      hourlyRate,
    })

    // Crear código de verificación de email
    const verification = await (EmailVerification as any).createVerification(
      user._id as mongoose.Types.ObjectId,
      'email_verification'
    )

    // Enviar email con código de verificación
    await sendVerificationCode(user.email, user.firstName, verification.code)

    // Generar token
    const token = generateToken(user._id.toString(), user.role)

    res.status(201).json({
      status: 'success',
      message:
        'Mentor registrado exitosamente. Se ha enviado un código de verificación a tu correo.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
        profile: {
          id: mentor._id,
          bio: mentor.bio,
          experience: mentor.experience,
          specialties: mentor.specialties,
          credentials: mentor.credentials,
          hourlyRate: mentor.hourlyRate,
          isApproved: mentor.isApproved,
        },
        token,
        requiresVerification: true,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Errores de validación',
        errors: errors.array(),
      })
      return
    }

    const { email, password } = req.body

    // Buscar usuario por email (incluir password para comparación)
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas',
      })
      return
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      res.status(401).json({
        status: 'error',
        message: 'Cuenta desactivada. Contacte al administrador.',
      })
      return
    }

    // Comparar contraseñas
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas',
      })
      return
    }

    // Obtener perfil según el rol
    let profile = null
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id })
    } else if (user.role === 'mentor') {
      profile = await Mentor.findOne({ userId: user._id })
    }

    // Generar token
    const token = generateToken(user._id.toString(), user.role)

    res.status(200).json({
      status: 'success',
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
        },
        profile,
        token,
        requiresVerification: !user.isEmailVerified,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const logout = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // En una implementación con JWT stateless, el logout se maneja en el cliente
    // eliminando el token. Sin embargo, podemos agregar lógica adicional aquí
    // como invalidar tokens en una blacklist si se requiere.

    res.status(200).json({
      status: 'success',
      message: 'Sesión cerrada exitosamente',
    })
  } catch (error) {
    next(error)
  }
}

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'No autenticado',
      })
      return
    }

    // Obtener perfil según el rol
    let profile = null
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id })
    } else if (user.role === 'mentor') {
      profile = await Mentor.findOne({ userId: user._id })
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
        },
        profile,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Verificar email con código OTP
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Errores de validación',
        errors: errors.array(),
      })
      return
    }

    const { email, code } = req.body

    // Buscar usuario por email
    const user = await User.findOne({ email })
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado',
      })
      return
    }

    if (user.isEmailVerified) {
      res.status(400).json({
        status: 'error',
        message: 'El correo ya está verificado',
      })
      return
    }

    // Buscar código de verificación válido
    const verification = await EmailVerification.findOne({
      userId: user._id,
      type: 'email_verification',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    })

    if (!verification) {
      res.status(400).json({
        status: 'error',
        message: 'Código expirado o inválido. Solicita un nuevo código.',
      })
      return
    }

    // Verificar intentos
    if (verification.attempts >= 5) {
      res.status(400).json({
        status: 'error',
        message: 'Demasiados intentos. Solicita un nuevo código.',
      })
      return
    }

    // Verificar código
    if (verification.code !== code) {
      verification.attempts += 1
      await verification.save()
      res.status(400).json({
        status: 'error',
        message: 'Código incorrecto',
        attemptsRemaining: 5 - verification.attempts,
      })
      return
    }

    // Marcar código como usado
    verification.isUsed = true
    verification.usedAt = new Date()
    await verification.save()

    // Marcar email como verificado
    user.isEmailVerified = true
    await user.save()

    res.status(200).json({
      status: 'success',
      message: 'Correo verificado exitosamente',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Reenviar código de verificación
 * POST /api/auth/resend-code
 */
export const resendVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Errores de validación',
        errors: errors.array(),
      })
      return
    }

    const { email } = req.body

    // Buscar usuario por email
    const user = await User.findOne({ email })
    if (!user) {
      // No revelar si el email existe o no por seguridad
      res.status(200).json({
        status: 'success',
        message:
          'Si el correo está registrado, recibirás un código de verificación.',
      })
      return
    }

    if (user.isEmailVerified) {
      res.status(400).json({
        status: 'error',
        message: 'El correo ya está verificado',
      })
      return
    }

    // Verificar rate limiting (máximo 1 código cada 60 segundos)
    const recentVerification = await EmailVerification.findOne({
      userId: user._id,
      type: 'email_verification',
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    })

    if (recentVerification) {
      res.status(429).json({
        status: 'error',
        message: 'Espera 60 segundos antes de solicitar otro código.',
      })
      return
    }

    // Crear nuevo código de verificación
    const verification = await (EmailVerification as any).createVerification(
      user._id as mongoose.Types.ObjectId,
      'email_verification'
    )

    // Enviar email
    await sendVerificationCode(user.email, user.firstName, verification.code)

    res.status(200).json({
      status: 'success',
      message: 'Se ha enviado un nuevo código de verificación.',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Solicitar recuperación de contraseña
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Errores de validación',
        errors: errors.array(),
      })
      return
    }

    const { email } = req.body

    // Buscar usuario por email
    const user = await User.findOne({ email })

    // Siempre responder con éxito para no revelar si el email existe
    if (!user) {
      res.status(200).json({
        status: 'success',
        message:
          'Si el correo está registrado, recibirás un código para restablecer tu contraseña.',
      })
      return
    }

    // Verificar rate limiting
    const recentReset = await EmailVerification.findOne({
      userId: user._id,
      type: 'password_reset',
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    })

    if (recentReset) {
      res.status(429).json({
        status: 'error',
        message: 'Espera 60 segundos antes de solicitar otro código.',
      })
      return
    }

    // Crear código de recuperación
    const verification = await (EmailVerification as any).createVerification(
      user._id as mongoose.Types.ObjectId,
      'password_reset'
    )

    // Enviar email
    await sendPasswordResetCode(user.email, user.firstName, verification.code)

    res.status(200).json({
      status: 'success',
      message:
        'Si el correo está registrado, recibirás un código para restablecer tu contraseña.',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Restablecer contraseña con código
 * POST /api/auth/reset-password
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Errores de validación',
        errors: errors.array(),
      })
      return
    }

    const { email, code, newPassword } = req.body

    // Buscar usuario por email
    const user = await User.findOne({ email })
    if (!user) {
      res.status(400).json({
        status: 'error',
        message: 'Código inválido o expirado',
      })
      return
    }

    // Buscar código de recuperación válido
    const verification = await EmailVerification.findOne({
      userId: user._id,
      type: 'password_reset',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    })

    if (!verification) {
      res.status(400).json({
        status: 'error',
        message: 'Código expirado o inválido. Solicita un nuevo código.',
      })
      return
    }

    // Verificar intentos
    if (verification.attempts >= 5) {
      res.status(400).json({
        status: 'error',
        message: 'Demasiados intentos. Solicita un nuevo código.',
      })
      return
    }

    // Verificar código
    if (verification.code !== code) {
      verification.attempts += 1
      await verification.save()
      res.status(400).json({
        status: 'error',
        message: 'Código incorrecto',
        attemptsRemaining: 5 - verification.attempts,
      })
      return
    }

    // Marcar código como usado
    verification.isUsed = true
    verification.usedAt = new Date()
    await verification.save()

    // Actualizar contraseña
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
    user.password = hashedPassword
    await user.save()

    res.status(200).json({
      status: 'success',
      message: 'Contraseña actualizada exitosamente',
    })
  } catch (error) {
    next(error)
  }
}
