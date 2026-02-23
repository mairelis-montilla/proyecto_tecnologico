import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { Review } from '../models/Review.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { Booking } from '../models/Booking.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'

/**
 * Crear calificación de una sesión completada
 * POST /api/reviews
 */
export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId, rating, comment } = req.body
    const studentId = req.user?._id?.toString()

    if (!studentId) {
      res.status(401).json({ status: 'error', message: 'No autenticado' })
      return
    }

    if (!sessionId || rating === undefined) {
      res.status(400).json({ status: 'error', message: 'sessionId y rating son requeridos' })
      return
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ status: 'error', message: 'El rating debe estar entre 1 y 5' })
      return
    }

    if (comment && comment.length > 500) {
      res.status(400).json({ status: 'error', message: 'El comentario no puede superar los 500 caracteres' })
      return
    }

    // 1. Verificar que la sesión existe
    const session = await Booking.findById(sessionId)
    if (!session) {
      res.status(404).json({ status: 'error', message: 'Sesión no encontrada' })
      return
    }

    // 2. Verificar que la sesión pertenece al estudiante
    if (session.studentId.toString() !== studentId) {
      res.status(403).json({ status: 'error', message: 'No tienes permiso para calificar esta sesión' })
      return
    }

    // 3. Verificar que la sesión esté completada
    if (session.status !== 'completed') {
      res.status(400).json({ status: 'error', message: 'Solo puedes calificar sesiones completadas' })
      return
    }

    // 4. Verificar que no exista review previa
    const existingReview = await Review.findOne({ bookingId: sessionId })
    if (existingReview) {
      res.status(400).json({ status: 'error', message: 'Ya existe una calificación para esta sesión' })
      return
    }

    // 5. Crear la review
    const review = await Review.create({
      bookingId: sessionId,
      studentId,
      mentorId: session.mentorId,
      rating,
      comment: comment ?? '',
    })

    // 6. Actualizar rating promedio del mentor automáticamente
    const ratingStats = await Review.aggregate([
      { $match: { mentorId: new mongoose.Types.ObjectId(session.mentorId.toString()) } },
      {
        $group: {
          _id: '$mentorId',
          averageRating: { $avg: '$rating' },
        },
      },
    ])

    if (ratingStats.length > 0) {
      await Mentor.findByIdAndUpdate(session.mentorId, {
        rating: Math.round(ratingStats[0].averageRating * 10) / 10,
      })
    }

    res.status(201).json({
      status: 'success',
      message: 'Calificación creada exitosamente',
      data: review,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Obtener reseñas de un mentor
 * GET /api/reviews/mentor/:mentorId
 */
export const getReviewsByMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { mentorId } = req.params
    const {
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    // Verificar que el mentor existe y está aprobado
    const mentor = await Mentor.findOne({
      _id: mentorId,
      isApproved: true,
      isActive: true,
    })

    if (!mentor) {
      res.status(404).json({
        status: 'error',
        message: 'Mentor no encontrado',
      })
      return
    }

    // Configurar ordenamiento
    const sortOptions: Record<string, 1 | -1> = {}
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1

    // Obtener reseñas
    const reviews = await Review.find({ mentorId })
      .populate({
        path: 'studentId',
        select: 'firstName lastName avatar',
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean()

    // Contar total de reseñas
    const total = await Review.countDocuments({ mentorId })

    // Calcular estadísticas de rating
    const ratingStats = await Review.aggregate([
      { $match: { mentorId: mentor._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        },
      },
    ])

    const stats = ratingStats[0] || {
      averageRating: 0,
      totalReviews: 0,
      rating5: 0,
      rating4: 0,
      rating3: 0,
      rating2: 0,
      rating1: 0,
    }

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        stats: {
          averageRating: stats.averageRating
            ? Number(stats.averageRating.toFixed(1))
            : 0,
          totalReviews: stats.totalReviews,
          ratingDistribution: {
            5: stats.rating5,
            4: stats.rating4,
            3: stats.rating3,
            2: stats.rating2,
            1: stats.rating1,
          },
        },
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
    next(error)
  }
}

/**
 * Obtener review de una sesión específica
 * GET /api/reviews/booking/:bookingId
 */
export const getReviewByBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.params

    const review = await Review.findOne({ bookingId })
      .populate('studentId', 'firstName lastName avatar')

    if (!review) {
      res.status(404).json({ status: 'error', message: 'No hay calificación para esta sesión' })
      return
    }

    res.status(200).json({ status: 'success', data: review })
  } catch (error) {
    next(error)
  }
}