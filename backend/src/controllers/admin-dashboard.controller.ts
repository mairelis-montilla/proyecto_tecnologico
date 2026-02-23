import { Response } from 'express'
import { Payment } from '../models/Payment.model.js'
import { Booking } from '../models/Booking.model.js'
import { User } from '../models/User.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'

/**
 * Obtener estadísticas del dashboard de admin
 * GET /api/admin/dashboard/stats
 */
export const getDashboardStats = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalUsers,
      activeMentors,
      sessionsThisMonth,
      revenueThisMonthAgg,
      pendingPaymentsCount,
      recentBookings,
      sessionsByWeekAgg,
      revenueByMonthAgg,
      pendingPaymentsList,
    ] = await Promise.all([
      // Total de usuarios registrados
      User.countDocuments(),

      // Mentores activos y aprobados
      Mentor.countDocuments({ isApproved: true, isActive: true }),

      // Sesiones del mes actual
      Booking.countDocuments({
        scheduledAt: { $gte: startOfMonth },
        status: { $in: ['confirmed', 'completed', 'payment_validated'] },
      }),

      // Ingresos del mes actual (pagos validados)
      Payment.aggregate([
        {
          $match: {
            status: 'validated',
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),

      // Cantidad de pagos pendientes de validación
      Payment.countDocuments({ status: 'pending_validation' }),

      // Últimas 5 reservas
      Booking.find()
        .populate({
          path: 'studentId',
          select: 'userId',
          populate: {
            path: 'userId',
            select: 'firstName lastName avatar email',
          },
        })
        .populate({
          path: 'mentorId',
          select: 'userId title',
          populate: {
            path: 'userId',
            select: 'firstName lastName avatar',
          },
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Sesiones por semana (últimas 4 semanas) agrupadas por semana del año
      Booking.aggregate([
        {
          $match: {
            scheduledAt: {
              $gte: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
            },
            status: { $in: ['confirmed', 'completed', 'payment_validated'] },
          },
        },
        {
          $group: {
            _id: {
              week: { $week: '$scheduledAt' },
              year: { $year: '$scheduledAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
      ]),

      // Ingresos por mes (últimos 6 meses)
      Payment.aggregate([
        {
          $match: {
            status: 'validated',
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: '$createdAt' },
              year: { $year: '$createdAt' },
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Pagos pendientes (últimos 5)
      Payment.find({ status: 'pending_validation' })
        .populate({
          path: 'bookingId',
          select: 'scheduledAt topic totalAmount studentId mentorId',
          populate: [
            {
              path: 'studentId',
              select: 'userId',
              populate: {
                path: 'userId',
                select: 'firstName lastName avatar email',
              },
            },
            {
              path: 'mentorId',
              select: 'userId title',
              populate: {
                path: 'userId',
                select: 'firstName lastName',
              },
            },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ])

    // Construir etiquetas de semanas para las últimas 4 semanas
    const sessionsByWeek = buildWeeklyData(sessionsByWeekAgg, now)

    // Construir datos de ingresos por mes para los últimos 6 meses
    const revenueByMonth = buildMonthlyData(revenueByMonthAgg, now)

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalUsers,
          activeMentors,
          sessionsThisMonth,
          revenueThisMonth: revenueThisMonthAgg[0]?.total ?? 0,
          pendingPayments: pendingPaymentsCount,
        },
        recentBookings,
        pendingPaymentsList,
        sessionsByWeek,
        revenueByMonth,
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

// Construir array de 4 semanas con sus conteos
function buildWeeklyData(
  agg: { _id: { week: number; year: number }; count: number }[],
  now: Date
) {
  const weeks = []
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    const weekNum = getISOWeek(d)
    const year = d.getFullYear()
    const found = agg.find(a => a._id.week === weekNum && a._id.year === year)
    const startOfWeek = new Date(d)
    startOfWeek.setDate(d.getDate() - d.getDay() + 1)
    const label = startOfWeek.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
    })
    weeks.push({ label: `Sem ${label}`, count: found?.count ?? 0 })
  }
  return weeks
}

// Construir array de 6 meses con sus totales
function buildMonthlyData(
  agg: { _id: { month: number; year: number }; total: number }[],
  now: Date
) {
  const months = []
  const monthNames = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ]
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = d.getMonth() + 1
    const year = d.getFullYear()
    const found = agg.find(a => a._id.month === month && a._id.year === year)
    months.push({
      label: `${monthNames[month - 1]} ${year}`,
      total: found?.total ?? 0,
    })
  }
  return months
}

function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
