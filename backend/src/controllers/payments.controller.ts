import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware.js'
import { Payment } from '../models/Payment.model.js'

// Helper para paginación
const createPagination = (page: number, limit: number, total: number) => ({
  currentPage: page,
  totalPages: Math.ceil(total / limit),
  totalItems: total,
  itemsPerPage: limit,
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
})

// GET /api/payments/my-payments  (también /history)
// Estudiante: lista de todos sus pagos con filtros y paginación
export const getMyPayments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!._id

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string, 10) || 10)
    )
    const skip = (page - 1) * limit

    // Filtros opcionales
    const filter: Record<string, unknown> = { studentId: userId }

    if (req.query.status) {
      filter.status = req.query.status
    }

    if (req.query.startDate || req.query.endDate) {
      const dateFilter: Record<string, Date> = {}
      if (req.query.startDate)
        dateFilter.$gte = new Date(req.query.startDate as string)
      if (req.query.endDate)
        dateFilter.$lte = new Date(req.query.endDate as string)
      filter.createdAt = dateFilter
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate({
          path: 'bookingId',
          select: 'topic scheduledAt duration totalAmount mentorId',
          populate: {
            path: 'mentorId',
            select: 'userId title hourlyRate',
            populate: {
              path: 'userId',
              select: 'firstName lastName avatar',
            },
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
    ])

    res.status(200).json({
      status: 'success',
      data: { payments },
      pagination: createPagination(page, limit, total),
    })
  } catch (error) {
    console.error('Error en getMyPayments:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error al obtener los pagos' })
  }
}
