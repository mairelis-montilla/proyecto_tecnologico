import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.model.js'
import { Student } from '../models/Student.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'

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

    // Generar token
    const token = generateToken(user._id.toString(), user.role)

    res.status(201).json({
      status: 'success',
      message: 'Estudiante registrado exitosamente',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        profile: {
          id: student._id,
          bio: student.bio,
          institution: student.institution,
          career: student.career,
          semester: student.semester,
        },
        token,
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

    // Generar token
    const token = generateToken(user._id.toString(), user.role)

    res.status(201).json({
      status: 'success',
      message: 'Mentor registrado exitosamente. Pendiente de aprobación.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
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
        },
        profile,
        token,
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
        },
        profile,
      },
    })
  } catch (error) {
    next(error)
  }
}
