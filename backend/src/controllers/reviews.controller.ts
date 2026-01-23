import { Request, Response, NextFunction } from 'express'
import { Review } from '../models/Review.model.js'
import { Mentor } from '../models/Mentor.model.js'

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
