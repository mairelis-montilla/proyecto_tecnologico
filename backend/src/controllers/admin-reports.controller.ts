import { Response } from 'express'
import { Payment } from '../models/Payment.model.js'
import { Booking } from '../models/Booking.model.js'
import { User } from '../models/User.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'

// Helper para construir rango de fechas según período
function buildDateRange(
  period: string,
  dateFrom?: string,
  dateTo?: string
): { start: Date; end: Date } {
  const now = new Date()
  const end = dateTo ? new Date(dateTo) : new Date()
  end.setHours(23, 59, 59, 999)

  if (period === 'today') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }
  if (period === 'week') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start, end: now }
  }
  if (period === 'custom' && dateFrom) {
    const start = new Date(dateFrom)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  // Default: último mes
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { start, end: now }
}

/**
 * Reporte de usuarios registrados por período
 * GET /api/admin/reports/users
 */
export const getReportUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { period = 'month', dateFrom, dateTo } = req.query
    const { start, end } = buildDateRange(
      period as string,
      dateFrom as string,
      dateTo as string
    )

    const [totalInPeriod, byRole, dailyRegistrations] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: start, $lte: end } }),

      User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),

      User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
    ])

    const byRoleMap: Record<string, number> = {
      student: 0,
      mentor: 0,
      admin: 0,
    }
    byRole.forEach((r: { _id: string; count: number }) => {
      byRoleMap[r._id] = r.count
    })

    const chartData = dailyRegistrations.map(
      (d: { _id: { year: number; month: number; day: number }; count: number }) => ({
        label: `${d._id.day}/${d._id.month}`,
        count: d.count,
      })
    )

    res.status(200).json({
      status: 'success',
      data: {
        totalInPeriod,
        byRole: byRoleMap,
        chartData,
        period,
        dateFrom: start.toISOString(),
        dateTo: end.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching user report:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Reporte de sesiones completadas vs canceladas
 * GET /api/admin/reports/sessions
 */
export const getReportSessions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { period = 'month', dateFrom, dateTo } = req.query
    const { start, end } = buildDateRange(
      period as string,
      dateFrom as string,
      dateTo as string
    )

    const [statusSummary, chartData] = await Promise.all([
      Booking.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      Booking.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
              status: '$status',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
    ])

    const summary: Record<string, number> = {}
    statusSummary.forEach((s: { _id: string; count: number }) => {
      summary[s._id] = s.count
    })

    // Simplificar en completadas vs canceladas
    const completed =
      (summary['completed'] ?? 0) + (summary['confirmed'] ?? 0)
    const cancelled = summary['cancelled'] ?? 0
    const total = Object.values(summary).reduce((a, b) => a + b, 0)

    // Agrupar chartData por día con completadas y canceladas
    const dayMap: Record<
      string,
      { label: string; completed: number; cancelled: number }
    > = {}
    chartData.forEach(
      (d: {
        _id: {
          year: number
          month: number
          day: number
          status: string
        }
        count: number
      }) => {
        const key = `${d._id.year}-${d._id.month}-${d._id.day}`
        if (!dayMap[key]) {
          dayMap[key] = {
            label: `${d._id.day}/${d._id.month}`,
            completed: 0,
            cancelled: 0,
          }
        }
        if (
          d._id.status === 'completed' ||
          d._id.status === 'confirmed' ||
          d._id.status === 'payment_validated'
        ) {
          dayMap[key].completed += d.count
        } else if (d._id.status === 'cancelled') {
          dayMap[key].cancelled += d.count
        }
      }
    )

    res.status(200).json({
      status: 'success',
      data: {
        summary: { ...summary, completed, cancelled, total },
        chartData: Object.values(dayMap),
        period,
        dateFrom: start.toISOString(),
        dateTo: end.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching sessions report:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Reporte de ingresos por período
 * GET /api/admin/reports/revenue
 */
export const getReportRevenue = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { period = 'month', dateFrom, dateTo } = req.query
    const { start, end } = buildDateRange(
      period as string,
      dateFrom as string,
      dateTo as string
    )

    const [summary, chartData] = await Promise.all([
      Payment.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            platformFees: { $sum: '$platformFee' },
            mentorEarnings: { $sum: '$mentorEarnings' },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            status: 'validated',
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            total: { $sum: '$amount' },
            platformFee: { $sum: '$platformFee' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
    ])

    const summaryMap: Record<
      string,
      { total: number; count: number; platformFees: number; mentorEarnings: number }
    > = {}
    summary.forEach(
      (s: {
        _id: string
        total: number
        count: number
        platformFees: number
        mentorEarnings: number
      }) => {
        summaryMap[s._id] = {
          total: s.total,
          count: s.count,
          platformFees: s.platformFees,
          mentorEarnings: s.mentorEarnings,
        }
      }
    )

    const totalRevenue = summaryMap['validated']?.total ?? 0
    const totalPlatformFees = summaryMap['validated']?.platformFees ?? 0
    const totalMentorEarnings = summaryMap['validated']?.mentorEarnings ?? 0

    const formattedChartData = chartData.map(
      (d: {
        _id: { year: number; month: number; day: number }
        total: number
        platformFee: number
      }) => ({
        label: `${d._id.day}/${d._id.month}`,
        total: d.total,
        platformFee: d.platformFee,
      })
    )

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalRevenue,
          totalPlatformFees,
          totalMentorEarnings,
          byStatus: summaryMap,
        },
        chartData: formattedChartData,
        period,
        dateFrom: start.toISOString(),
        dateTo: end.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching revenue report:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Reporte de mentores más activos
 * GET /api/admin/reports/top-mentors
 */
export const getReportTopMentors = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { period = 'month', dateFrom, dateTo } = req.query
    const { start, end } = buildDateRange(
      period as string,
      dateFrom as string,
      dateTo as string
    )

    const topMentors = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['completed', 'confirmed', 'payment_validated'] },
        },
      },
      {
        $group: {
          _id: '$mentorId',
          sessionsCount: { $sum: 1 },
        },
      },
      { $sort: { sessionsCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'mentors',
          localField: '_id',
          foreignField: '_id',
          as: 'mentor',
        },
      },
      { $unwind: '$mentor' },
      {
        $lookup: {
          from: 'users',
          localField: 'mentor.userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          mentorId: '$_id',
          sessionsCount: 1,
          name: {
            $concat: ['$user.firstName', ' ', '$user.lastName'],
          },
          email: '$user.email',
          avatar: '$user.avatar',
          title: '$mentor.title',
          rating: '$mentor.rating',
          totalSessions: '$mentor.totalSessions',
        },
      },
    ])

    // También calcular ingresos generados por cada mentor en el período
    const mentorIds = topMentors.map((m: { mentorId: unknown }) => m.mentorId)
    const revenueByMentor = await Payment.aggregate([
      {
        $match: {
          mentorId: { $in: mentorIds },
          status: 'validated',
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$mentorId',
          revenue: { $sum: '$amount' },
          mentorEarnings: { $sum: '$mentorEarnings' },
        },
      },
    ])

    const revenueMap: Record<
      string,
      { revenue: number; mentorEarnings: number }
    > = {}
    revenueByMentor.forEach(
      (r: { _id: unknown; revenue: number; mentorEarnings: number }) => {
        revenueMap[String(r._id)] = {
          revenue: r.revenue,
          mentorEarnings: r.mentorEarnings,
        }
      }
    )

    const result = topMentors.map(
      (m: {
        mentorId: unknown
        sessionsCount: number
        name: string
        email: string
        avatar?: string
        title: string
        rating: number
        totalSessions: number
      }) => ({
        ...m,
        revenue: revenueMap[String(m.mentorId)]?.revenue ?? 0,
        mentorEarnings: revenueMap[String(m.mentorId)]?.mentorEarnings ?? 0,
      })
    )

    res.status(200).json({
      status: 'success',
      data: {
        topMentors: result,
        period,
        dateFrom: start.toISOString(),
        dateTo: end.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching top mentors report:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Exportar reporte a CSV
 * GET /api/admin/reports/export
 */
export const exportReport = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { type = 'revenue', period = 'month', dateFrom, dateTo } = req.query
    const { start, end } = buildDateRange(
      period as string,
      dateFrom as string,
      dateTo as string
    )

    let csv = ''
    const filename = `reporte_${type}_${new Date().toISOString().split('T')[0]}.csv`

    if (type === 'revenue') {
      const payments = await Payment.find({
        status: 'validated',
        createdAt: { $gte: start, $lte: end },
      })
        .populate({
          path: 'bookingId',
          select: 'topic scheduledAt studentId mentorId',
          populate: [
            {
              path: 'studentId',
              select: 'userId',
              populate: { path: 'userId', select: 'firstName lastName email' },
            },
            {
              path: 'mentorId',
              select: 'userId',
              populate: { path: 'userId', select: 'firstName lastName email' },
            },
          ],
        })
        .sort({ createdAt: -1 })
        .lean()

      const header = 'Fecha,Monto,Comision Plataforma,Ganancia Mentor,Metodo,Estudiante,Mentor,Tema'
      const rows = payments.map((p: any) => {
        const booking = p.bookingId || {}
        const studentUser = booking.studentId?.userId || {}
        const mentorUser = booking.mentorId?.userId || {}
        return [
          new Date(p.createdAt).toISOString().split('T')[0],
          p.amount,
          p.platformFee,
          p.mentorEarnings,
          p.paymentMethod,
          `${studentUser.firstName || ''} ${studentUser.lastName || ''}`.trim(),
          `${mentorUser.firstName || ''} ${mentorUser.lastName || ''}`.trim(),
          (booking.topic || '').replace(/,/g, ';'),
        ].join(',')
      })
      csv = [header, ...rows].join('\n')
    } else if (type === 'sessions') {
      const bookings = await Booking.find({
        createdAt: { $gte: start, $lte: end },
      })
        .populate({
          path: 'studentId',
          select: 'userId',
          populate: { path: 'userId', select: 'firstName lastName email' },
        })
        .populate({
          path: 'mentorId',
          select: 'userId title',
          populate: { path: 'userId', select: 'firstName lastName email' },
        })
        .sort({ createdAt: -1 })
        .lean()

      const header = 'Fecha,Estado,Tema,Duracion,Estudiante,Mentor,Monto'
      const rows = bookings.map((b: any) => {
        const student = b.studentId?.userId || {}
        const mentor = b.mentorId?.userId || {}
        return [
          new Date(b.createdAt).toISOString().split('T')[0],
          b.status,
          (b.topic || '').replace(/,/g, ';'),
          b.duration,
          `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim(),
          b.totalAmount || 0,
        ].join(',')
      })
      csv = [header, ...rows].join('\n')
    } else if (type === 'users') {
      const users = await User.find({
        createdAt: { $gte: start, $lte: end },
      })
        .sort({ createdAt: -1 })
        .lean()

      const header = 'Fecha Registro,Nombre,Email,Rol,Activo'
      const rows = users.map((u: any) => [
        new Date(u.createdAt).toISOString().split('T')[0],
        `${u.firstName} ${u.lastName}`.trim(),
        u.email,
        u.role,
        u.isActive ? 'Si' : 'No',
      ].join(','))
      csv = [header, ...rows].join('\n')
    } else if (type === 'top-mentors') {
      const { start: s, end: e } = buildDateRange(period as string, dateFrom as string, dateTo as string)
      const topMentors = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: s, $lte: e },
            status: { $in: ['completed', 'confirmed', 'payment_validated'] },
          },
        },
        { $group: { _id: '$mentorId', sessionsCount: { $sum: 1 } } },
        { $sort: { sessionsCount: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'mentors',
            localField: '_id',
            foreignField: '_id',
            as: 'mentor',
          },
        },
        { $unwind: '$mentor' },
        {
          $lookup: {
            from: 'users',
            localField: 'mentor.userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
            email: '$user.email',
            title: '$mentor.title',
            rating: '$mentor.rating',
            sessionsCount: 1,
          },
        },
      ])

      const header = 'Nombre,Email,Titulo,Rating,Sesiones en Periodo'
      const rows = topMentors.map((m: any) =>
        [m.name, m.email, (m.title || '').replace(/,/g, ';'), m.rating || 0, m.sessionsCount].join(',')
      )
      csv = [header, ...rows].join('\n')
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.status(200).send('\uFEFF' + csv)
  } catch (error) {
    console.error('Error exporting report:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}
