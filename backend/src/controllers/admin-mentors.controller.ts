import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import mongoose from 'mongoose'
import { Mentor } from '../models/Mentor.model.js'
import { Notification } from '../models/Notification.model.js'

// Helper para validar ObjectId
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id)

// Helper para crear paginación
const createPagination = (page: number, limit: number, total: number) => ({
  currentPage: page,
  totalPages: Math.ceil(total / limit),
  totalItems: total,
  itemsPerPage: limit,
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
})

/**
 * Listar mentores pendientes de aprobación
 * GET /api/admin/mentors/pending
 */
export const getPendingMentors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '10' } = req.query

    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)))
    const skip = (pageNum - 1) * limitNum

    // Filtro: mentores con perfil publicado pero no aprobados
    const filter = {
      profileStatus: 'published',
      isApproved: false,
      isActive: true,
    }

    const [mentors, total] = await Promise.all([
      Mentor.find(filter)
        .populate({
          path: 'userId',
          select: 'firstName lastName email avatar createdAt',
        })
        .populate({
          path: 'specialties',
          select: 'name category icon',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Mentor.countDocuments(filter),
    ])

    res.status(200).json({
      status: 'success',
      data: {
        mentors,
        pagination: createPagination(pageNum, limitNum, total),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Listar mentores aprobados
 * GET /api/admin/mentors/approved
 */
export const getApprovedMentors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '10', search } = req.query

    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)))
    const skip = (pageNum - 1) * limitNum

    // Filtro base: mentores aprobados
    const filter: mongoose.FilterQuery<typeof Mentor> = {
      isApproved: true,
      isActive: true,
    }

    const [mentors, total] = await Promise.all([
      Mentor.find(filter)
        .populate({
          path: 'userId',
          select: 'firstName lastName email avatar createdAt',
        })
        .populate({
          path: 'specialties',
          select: 'name category icon',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Mentor.countDocuments(filter),
    ])

    // Filtrar por búsqueda en memoria si se proporciona
    let filteredMentors = mentors
    if (search && typeof search === 'string' && search.trim().length >= 2) {
      const searchTerm = search.trim().toLowerCase()
      filteredMentors = mentors.filter(mentor => {
        const user = mentor.userId as {
          firstName?: string
          lastName?: string
          email?: string
        }
        const fullName =
          `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase()
        const email = (user?.email || '').toLowerCase()
        return fullName.includes(searchTerm) || email.includes(searchTerm)
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        mentors: filteredMentors,
        pagination: createPagination(
          pageNum,
          limitNum,
          search ? filteredMentors.length : total
        ),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Obtener detalle de un mentor (para revisión)
 * GET /api/admin/mentors/:id
 */
export const getMentorDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params

    if (!isValidObjectId(id)) {
      res.status(400).json({
        status: 'error',
        message: 'ID de mentor inválido',
      })
      return
    }

    const mentor = await Mentor.findById(id)
      .populate({
        path: 'userId',
        select: 'firstName lastName email avatar createdAt isEmailVerified',
      })
      .populate({
        path: 'specialties',
        select: 'name description category icon',
      })
      .lean()

    if (!mentor) {
      res.status(404).json({
        status: 'error',
        message: 'Mentor no encontrado',
      })
      return
    }

    res.status(200).json({
      status: 'success',
      data: { mentor },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Aprobar mentor
 * PATCH /api/admin/mentors/:id/approve
 */
export const approveMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params

    if (!isValidObjectId(id)) {
      res.status(400).json({
        status: 'error',
        message: 'ID de mentor inválido',
      })
      return
    }

    const mentor = await Mentor.findById(id).populate('userId', 'firstName')

    if (!mentor) {
      res.status(404).json({
        status: 'error',
        message: 'Mentor no encontrado',
      })
      return
    }

    if (mentor.isApproved) {
      res.status(400).json({
        status: 'error',
        message: 'El mentor ya está aprobado',
      })
      return
    }

    // Aprobar mentor
    mentor.isApproved = true
    await mentor.save()

    // Crear notificación para el mentor
    const user = mentor.userId as { firstName?: string; _id: mongoose.Types.ObjectId }
    await Notification.create({
      userId: user._id,
      type: 'mentor_approved',
      title: '¡Felicidades! Tu perfil ha sido aprobado',
      message:
        'Tu solicitud como mentor ha sido aprobada. Ya puedes recibir reservas de estudiantes.',
      relatedId: mentor._id,
      relatedModel: 'Mentor',
    })

    res.status(200).json({
      status: 'success',
      message: 'Mentor aprobado exitosamente',
      data: { mentor },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Rechazar mentor
 * PATCH /api/admin/mentors/:id/reject
 */
export const rejectMentor = async (
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

    const { id } = req.params
    const { reason } = req.body

    if (!isValidObjectId(id)) {
      res.status(400).json({
        status: 'error',
        message: 'ID de mentor inválido',
      })
      return
    }

    const mentor = await Mentor.findById(id).populate('userId', 'firstName')

    if (!mentor) {
      res.status(404).json({
        status: 'error',
        message: 'Mentor no encontrado',
      })
      return
    }

    if (mentor.isApproved) {
      res.status(400).json({
        status: 'error',
        message:
          'No se puede rechazar un mentor ya aprobado. Use la opción de revocar.',
      })
      return
    }

    // Cambiar el perfil a borrador para que pueda corregir
    mentor.profileStatus = 'draft'
    await mentor.save()

    // Crear notificación para el mentor
    const user = mentor.userId as { firstName?: string; _id: mongoose.Types.ObjectId }
    await Notification.create({
      userId: user._id,
      type: 'mentor_rejected',
      title: 'Tu solicitud de mentor necesita ajustes',
      message: reason
        ? `Tu solicitud ha sido rechazada. Motivo: ${reason}`
        : 'Tu solicitud ha sido rechazada. Por favor, revisa tu perfil y vuelve a enviarlo.',
      relatedId: mentor._id,
      relatedModel: 'Mentor',
    })

    res.status(200).json({
      status: 'success',
      message: 'Mentor rechazado exitosamente',
      data: { mentor },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Revocar aprobación de mentor
 * PATCH /api/admin/mentors/:id/revoke
 */
export const revokeMentor = async (
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

    const { id } = req.params
    const { reason } = req.body

    if (!isValidObjectId(id)) {
      res.status(400).json({
        status: 'error',
        message: 'ID de mentor inválido',
      })
      return
    }

    const mentor = await Mentor.findById(id).populate('userId', 'firstName')

    if (!mentor) {
      res.status(404).json({
        status: 'error',
        message: 'Mentor no encontrado',
      })
      return
    }

    if (!mentor.isApproved) {
      res.status(400).json({
        status: 'error',
        message: 'El mentor no está aprobado actualmente',
      })
      return
    }

    // Revocar aprobación
    mentor.isApproved = false
    mentor.profileStatus = 'draft'
    await mentor.save()

    // Crear notificación para el mentor
    const user = mentor.userId as { firstName?: string; _id: mongoose.Types.ObjectId }
    await Notification.create({
      userId: user._id,
      type: 'mentor_revoked',
      title: 'Tu aprobación como mentor ha sido revocada',
      message: reason
        ? `Tu aprobación ha sido revocada. Motivo: ${reason}`
        : 'Tu aprobación como mentor ha sido revocada. Contacta a soporte para más información.',
      relatedId: mentor._id,
      relatedModel: 'Mentor',
    })

    res.status(200).json({
      status: 'success',
      message: 'Aprobación de mentor revocada exitosamente',
      data: { mentor },
    })
  } catch (error) {
    next(error)
  }
}
