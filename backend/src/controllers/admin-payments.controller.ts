import { Response } from 'express'
import moment from 'moment-timezone'
import { Payment } from '../models/Payment.model.js'
import { Booking } from '../models/Booking.model.js'
import { Notification } from '../models/Notification.model.js'
import { Student } from '../models/Student.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { User } from '../models/User.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'

const TIMEZONE = 'America/Lima'

/**
 * Obtener pagos pendientes de validación
 * GET /api/admin/payments/pending
 */
export const getPendingPayments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query
    const pageNum = parseInt(page as string, 10)
    const limitNum = Math.min(parseInt(limit as string, 10), 50)
    const skip = (pageNum - 1) * limitNum

    const filter: Record<string, unknown> = {
      status: 'pending_validation',
    }

    const payments = await Payment.find(filter)
      .populate({
        path: 'bookingId',
        select:
          'scheduledAt duration topic status totalAmount studentId mentorId',
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
            select: 'userId hourlyRate title',
            populate: {
              path: 'userId',
              select: 'firstName lastName avatar email',
            },
          },
        ],
      })
      .populate({
        path: 'studentId',
        select: 'firstName lastName avatar email',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    const total = await Payment.countDocuments(filter)

    res.status(200).json({
      status: 'success',
      data: {
        payments,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching pending payments:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Obtener todos los pagos (historial) con filtros avanzados
 * GET /api/admin/payments
 */
export const getAllPayments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      dateFrom,
      dateTo,
      search,
      paymentMethod,
    } = req.query
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(
      50,
      Math.max(1, parseInt(limit as string, 10) || 20)
    )
    const skip = (pageNum - 1) * limitNum

    const filter: Record<string, unknown> = {}

    // Filtro por estado
    if (status) {
      filter.status = status
    }

    // Filtro por método de pago
    if (
      paymentMethod &&
      ['yape', 'plin', 'transfer', 'cash'].includes(paymentMethod as string)
    ) {
      filter.paymentMethod = paymentMethod
    }

    // Filtro por rango de fechas (interpretado en timezone de Lima)
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom)
        dateFilter.$gte = moment
          .tz(dateFrom as string, TIMEZONE)
          .startOf('day')
          .toDate()
      if (dateTo)
        dateFilter.$lte = moment
          .tz(dateTo as string, TIMEZONE)
          .endOf('day')
          .toDate()
      filter.createdAt = dateFilter
    }

    // Búsqueda por nombre de usuario (estudiante o mentor)
    let studentIds: unknown[] | undefined
    let mentorIds: unknown[] | undefined
    if (search && (search as string).trim().length >= 2) {
      const searchRegex = new RegExp(search as string, 'i')
      const matchingUsers = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ],
      })
        .select('_id')
        .lean()

      const userIds = matchingUsers.map(u => u._id)

      if (userIds.length > 0) {
        // Buscar estudiantes y mentores con esos userIds
        const [matchingStudents, matchingMentors] = await Promise.all([
          Student.find({ userId: { $in: userIds } })
            .select('_id')
            .lean(),
          Mentor.find({ userId: { $in: userIds } })
            .select('_id')
            .lean(),
        ])

        studentIds = matchingStudents.map(s => s._id)
        mentorIds = matchingMentors.map(m => m._id)

        // Buscar en bookings que tengan estos estudiantes o mentores
        const matchingBookings = await Booking.find({
          $or: [
            ...(studentIds.length > 0
              ? [{ studentId: { $in: studentIds } }]
              : []),
            ...(mentorIds.length > 0 ? [{ mentorId: { $in: mentorIds } }] : []),
          ],
        })
          .select('_id')
          .lean()

        if (matchingBookings.length > 0) {
          filter.bookingId = { $in: matchingBookings.map(b => b._id) }
        } else {
          // No hay resultados para la búsqueda
          res.status(200).json({
            status: 'success',
            data: {
              payments: [],
              pagination: {
                currentPage: pageNum,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: limitNum,
                hasNextPage: false,
                hasPrevPage: false,
              },
            },
          })
          return
        }
      } else {
        res.status(200).json({
          status: 'success',
          data: {
            payments: [],
            pagination: {
              currentPage: pageNum,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: limitNum,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
        })
        return
      }
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate({
          path: 'bookingId',
          select:
            'scheduledAt duration topic status totalAmount studentId mentorId',
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
              select: 'userId hourlyRate title',
              populate: {
                path: 'userId',
                select: 'firstName lastName avatar email',
              },
            },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Payment.countDocuments(filter),
    ])

    res.status(200).json({
      status: 'success',
      data: {
        payments,
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
    console.error('Error fetching payments:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Obtener resumen financiero
 * GET /api/admin/payments/summary
 */
export const getPaymentsSummary = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const [summary] = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalRecaudado: {
            $sum: {
              $cond: [{ $eq: ['$status', 'validated'] }, '$amount', 0],
            },
          },
          totalPendientes: {
            $sum: {
              $cond: [
                { $in: ['$status', ['pending_proof', 'pending_validation']] },
                '$amount',
                0,
              ],
            },
          },
          totalRechazados: {
            $sum: {
              $cond: [{ $eq: ['$status', 'rejected'] }, '$amount', 0],
            },
          },
          totalReembolsados: {
            $sum: {
              $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0],
            },
          },
          totalPlatformFees: {
            $sum: {
              $cond: [{ $eq: ['$status', 'validated'] }, '$platformFee', 0],
            },
          },
          totalMentorEarnings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'validated'] }, '$mentorEarnings', 0],
            },
          },
          countValidated: {
            $sum: { $cond: [{ $eq: ['$status', 'validated'] }, 1, 0] },
          },
          countPending: {
            $sum: {
              $cond: [
                { $in: ['$status', ['pending_proof', 'pending_validation']] },
                1,
                0,
              ],
            },
          },
          countRejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
          countRefunded: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] },
          },
          totalTransactions: { $sum: 1 },
        },
      },
    ])

    res.status(200).json({
      status: 'success',
      data: {
        summary: summary || {
          totalRecaudado: 0,
          totalPendientes: 0,
          totalRechazados: 0,
          totalReembolsados: 0,
          totalPlatformFees: 0,
          totalMentorEarnings: 0,
          countValidated: 0,
          countPending: 0,
          countRejected: 0,
          countRefunded: 0,
          totalTransactions: 0,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching payments summary:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Exportar pagos a CSV
 * GET /api/admin/payments/export
 */
export const exportPayments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status, dateFrom, dateTo } = req.query

    const filter: Record<string, unknown> = {}
    if (status) filter.status = status
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.$gte = new Date(dateFrom as string)
      if (dateTo) {
        const endDate = new Date(dateTo as string)
        endDate.setHours(23, 59, 59, 999)
        dateFilter.$lte = endDate
      }
      filter.createdAt = dateFilter
    }

    const payments = await Payment.find(filter)
      .populate({
        path: 'bookingId',
        select:
          'scheduledAt duration topic status totalAmount studentId mentorId',
        populate: [
          {
            path: 'studentId',
            select: 'userId',
            populate: {
              path: 'userId',
              select: 'firstName lastName email',
            },
          },
          {
            path: 'mentorId',
            select: 'userId',
            populate: {
              path: 'userId',
              select: 'firstName lastName email',
            },
          },
        ],
      })
      .sort({ createdAt: -1 })
      .lean()

    // Generar CSV
    const csvHeader =
      'ID,Fecha,Estado,Monto,Moneda,Metodo de Pago,Comision Plataforma,Ganancias Mentor,Estudiante,Email Estudiante,Mentor,Email Mentor,Tema,Motivo Rechazo'
    const csvRows = payments.map((p: any) => {
      const booking = p.bookingId || {}
      const studentUser = booking.studentId?.userId || {}
      const mentorUser = booking.mentorId?.userId || {}

      return [
        p._id,
        new Date(p.createdAt).toISOString().split('T')[0],
        p.status,
        p.amount,
        p.currency,
        p.paymentMethod,
        p.platformFee,
        p.mentorEarnings,
        `${studentUser.firstName || ''} ${studentUser.lastName || ''}`.trim(),
        studentUser.email || '',
        `${mentorUser.firstName || ''} ${mentorUser.lastName || ''}`.trim(),
        mentorUser.email || '',
        (booking.topic || '').replace(/,/g, ';'),
        (p.rejectionReason || '').replace(/,/g, ';'),
      ].join(',')
    })

    const csv = [csvHeader, ...csvRows].join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=pagos_${new Date().toISOString().split('T')[0]}.csv`
    )
    res.status(200).send('\uFEFF' + csv) // BOM for Excel UTF-8
  } catch (error) {
    console.error('Error exporting payments:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Aprobar un pago
 * PATCH /api/admin/payments/:id/approve
 */
export const approvePayment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const adminUserId = req.user?._id
    const { id } = req.params

    if (!adminUserId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    const payment = await Payment.findById(id)
    if (!payment) {
      res.status(404).json({ status: 'error', message: 'Pago no encontrado' })
      return
    }

    if (payment.status !== 'pending_validation') {
      res.status(400).json({
        status: 'error',
        message: 'Este pago no está pendiente de validación',
      })
      return
    }

    // Actualizar payment
    payment.status = 'validated'
    payment.validatedBy = adminUserId
    payment.validatedAt = new Date()
    await payment.save()

    // Actualizar booking a payment_validated (pendiente de aprobacion del mentor)
    const booking = await Booking.findById(payment.bookingId)
    if (booking && booking.status === 'payment_uploaded') {
      booking.status = 'payment_validated'
      await booking.save()
    }

    // Notificar al estudiante
    if (booking) {
      const student = await Student.findById(booking.studentId)
      if (student) {
        await Notification.create({
          userId: student.userId,
          type: 'payment_validated',
          title: 'Pago aprobado',
          message: `Tu pago para la sesión sobre "${booking.topic}" ha sido aprobado. Esperando confirmación del mentor.`,
          relatedId: booking._id,
          relatedModel: 'Booking',
        })
      }

      // Notificar al mentor que debe aprobar la sesion
      const mentor = await Mentor.findById(booking.mentorId)
      if (mentor) {
        await Notification.create({
          userId: mentor.userId,
          type: 'payment_validated',
          title: 'Pago validado - Aprobar sesion',
          message: `El pago para la sesión sobre "${booking.topic}" fue validado. Por favor aprueba la sesión y agrega el link de Google Meet.`,
          relatedId: booking._id,
          relatedModel: 'Booking',
        })
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Pago aprobado exitosamente',
      data: { payment },
    })
  } catch (error) {
    console.error('Error approving payment:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Rechazar un pago
 * PATCH /api/admin/payments/:id/reject
 */
export const rejectPayment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const adminUserId = req.user?._id
    const { id } = req.params
    const { reason } = req.body

    if (!adminUserId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    if (!reason || reason.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'El motivo del rechazo es obligatorio',
      })
      return
    }

    const payment = await Payment.findById(id)
    if (!payment) {
      res.status(404).json({ status: 'error', message: 'Pago no encontrado' })
      return
    }

    if (payment.status !== 'pending_validation') {
      res.status(400).json({
        status: 'error',
        message: 'Este pago no está pendiente de validación',
      })
      return
    }

    // Rechazar payment
    payment.status = 'rejected'
    payment.validatedBy = adminUserId
    payment.validatedAt = new Date()
    payment.rejectionReason = reason.trim()
    await payment.save()

    // Regresar booking a pending_payment para que suba otro comprobante
    const booking = await Booking.findById(payment.bookingId)
    if (booking && booking.status === 'payment_uploaded') {
      booking.status = 'pending_payment'
      booking.paymentProof = undefined
      await booking.save()
    }

    // Notificar al estudiante con motivo
    if (booking) {
      const student = await Student.findById(booking.studentId)
      if (student) {
        await Notification.create({
          userId: student.userId,
          type: 'payment_rejected',
          title: 'Pago rechazado',
          message: `Tu comprobante de pago fue rechazado. Motivo: ${reason.trim()}. Por favor sube un nuevo comprobante.`,
          relatedId: booking._id,
          relatedModel: 'Payment',
        })
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Pago rechazado',
      data: { payment },
    })
  } catch (error) {
    console.error('Error rejecting payment:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}
