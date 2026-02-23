import { Response } from 'express'
import { validationResult } from 'express-validator'
import { User } from '../models/User.model.js'
import { Student } from '../models/Student.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { BlockHistory } from '../models/BlockHistory.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'

/**
 * Listar usuarios con filtros y paginación
 * GET /api/admin/users
 */
export const getUsers = async (
  req: AuthRequest,
  res: Response
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
      page = '1',
      limit = '10',
      role,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(
      50,
      Math.max(1, parseInt(limit as string, 10) || 10)
    )
    const skip = (pageNum - 1) * limitNum

    // Construir filtro
    const filter: Record<string, unknown> = {}

    // Filtro por rol
    if (role && ['student', 'mentor', 'admin'].includes(role as string)) {
      filter.role = role
    }

    // Filtro por estado (activo/bloqueado)
    if (status === 'active') {
      filter.isBlocked = false
      filter.isActive = true
    } else if (status === 'blocked') {
      filter.isBlocked = true
    } else if (status === 'inactive') {
      filter.isActive = false
    }

    // Búsqueda por nombre o email
    if (search && (search as string).trim().length >= 2) {
      const searchRegex = new RegExp(search as string, 'i')
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ]
    }

    // Ordenamiento
    const allowedSortFields = [
      'createdAt',
      'firstName',
      'lastName',
      'email',
      'role',
    ]
    const sortField = allowedSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : 'createdAt'
    const sortDir: 1 | -1 = sortOrder === 'asc' ? 1 : -1

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ])

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Obtener detalle de un usuario
 * GET /api/admin/users/:id
 */
export const getUserById = async (
  req: AuthRequest,
  res: Response
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

    const { id } = req.params

    const user = await User.findById(id).select('-password').lean()
    if (!user) {
      res
        .status(404)
        .json({ status: 'error', message: 'Usuario no encontrado' })
      return
    }

    // Obtener perfil según rol
    let profile = null
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id })
        .populate('interests', 'name category')
        .lean()
    } else if (user.role === 'mentor') {
      profile = await Mentor.findOne({ userId: user._id })
        .populate('specialties', 'name category')
        .lean()
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        profile,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Actualizar datos de un usuario (admin)
 * PATCH /api/admin/users/:id
 */
export const updateUser = async (
  req: AuthRequest,
  res: Response
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

    const { id } = req.params
    const { firstName, lastName, role, isActive } = req.body

    const user = await User.findById(id)
    if (!user) {
      res
        .status(404)
        .json({ status: 'error', message: 'Usuario no encontrado' })
      return
    }

    // No permitir que un admin se modifique a sí mismo el rol
    if (req.user?._id.toString() === id && role && role !== user.role) {
      res.status(400).json({
        status: 'error',
        message: 'No puedes cambiar tu propio rol',
      })
      return
    }

    // Actualizar campos permitidos
    if (firstName !== undefined) user.firstName = firstName
    if (lastName !== undefined) user.lastName = lastName
    if (role !== undefined) user.role = role
    if (isActive !== undefined) user.isActive = isActive

    await user.save()

    res.status(200).json({
      status: 'success',
      message: 'Usuario actualizado exitosamente',
      data: { user },
    })
  } catch (error) {
    console.error('Error updating user:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Bloquear un usuario
 * PATCH /api/admin/users/:id/block
 */
export const blockUser = async (
  req: AuthRequest,
  res: Response
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

    const { id } = req.params
    const { reason } = req.body
    const adminId = req.user?._id

    if (!adminId) {
      res.status(401).json({ status: 'error', message: 'No autenticado' })
      return
    }

    const user = await User.findById(id)
    if (!user) {
      res
        .status(404)
        .json({ status: 'error', message: 'Usuario no encontrado' })
      return
    }

    // No permitir bloquear a uno mismo
    if (adminId.toString() === id) {
      res.status(400).json({
        status: 'error',
        message: 'No puedes bloquearte a ti mismo',
      })
      return
    }

    if (user.isBlocked) {
      res.status(400).json({
        status: 'error',
        message: 'El usuario ya está bloqueado',
      })
      return
    }

    // Bloquear usuario
    user.isBlocked = true
    user.blockReason = reason.trim()
    user.blockedAt = new Date()
    await user.save()

    // Registrar en historial
    await BlockHistory.create({
      userId: user._id,
      action: 'block',
      reason: reason.trim(),
      adminId,
    })

    res.status(200).json({
      status: 'success',
      message: 'Usuario bloqueado exitosamente',
      data: { user },
    })
  } catch (error) {
    console.error('Error blocking user:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Desbloquear un usuario
 * PATCH /api/admin/users/:id/unblock
 */
export const unblockUser = async (
  req: AuthRequest,
  res: Response
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

    const { id } = req.params
    const { reason } = req.body
    const adminId = req.user?._id

    if (!adminId) {
      res.status(401).json({ status: 'error', message: 'No autenticado' })
      return
    }

    const user = await User.findById(id)
    if (!user) {
      res
        .status(404)
        .json({ status: 'error', message: 'Usuario no encontrado' })
      return
    }

    if (!user.isBlocked) {
      res.status(400).json({
        status: 'error',
        message: 'El usuario no está bloqueado',
      })
      return
    }

    // Desbloquear usuario
    user.isBlocked = false
    user.blockReason = undefined
    user.blockedAt = undefined
    await user.save()

    // Registrar en historial
    await BlockHistory.create({
      userId: user._id,
      action: 'unblock',
      reason: reason.trim(),
      adminId,
    })

    res.status(200).json({
      status: 'success',
      message: 'Usuario desbloqueado exitosamente',
      data: { user },
    })
  } catch (error) {
    console.error('Error unblocking user:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Obtener historial de bloqueos de un usuario
 * GET /api/admin/users/:id/block-history
 */
export const getBlockHistory = async (
  req: AuthRequest,
  res: Response
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

    const { id } = req.params

    // Verificar que el usuario existe
    const user = await User.findById(id)
      .select('firstName lastName email')
      .lean()
    if (!user) {
      res
        .status(404)
        .json({ status: 'error', message: 'Usuario no encontrado' })
      return
    }

    const history = await BlockHistory.find({ userId: id })
      .populate('adminId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({
      status: 'success',
      data: {
        user,
        history,
      },
    })
  } catch (error) {
    console.error('Error fetching block history:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}
