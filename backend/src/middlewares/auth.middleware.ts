import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User, IUser } from '../models/User.model.js'

export interface AuthRequest extends Request {
  user?: IUser
}

interface JwtPayload {
  userId: string
  role: string
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'Token de acceso no proporcionado',
      })
      return
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET no está configurado')
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload

    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive) {
      res.status(401).json({
        status: 'error',
        message: 'Usuario no encontrado o inactivo',
      })
      return
    }

    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        status: 'error',
        message: 'Token expirado',
      })
      return
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        status: 'error',
        message: 'Token inválido',
      })
      return
    }
    next(error)
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'No autenticado',
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'No tiene permisos para acceder a este recurso',
      })
      return
    }

    next()
  }
}
