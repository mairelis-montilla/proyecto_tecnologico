import { Response } from 'express'
import { Payment } from '../models/Payment.model.js'
import { Booking } from '../models/Booking.model.js'
import { Notification } from '../models/Notification.model.js'
import { Student } from '../models/Student.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'

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
        select: 'scheduledAt duration topic status totalAmount studentId mentorId',
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
 * Obtener todos los pagos (historial)
 * GET /api/admin/payments
 */
export const getAllPayments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { page = '1', limit = '20', status } = req.query
    const pageNum = parseInt(page as string, 10)
    const limitNum = Math.min(parseInt(limit as string, 10), 50)
    const skip = (pageNum - 1) * limitNum

    const filter: Record<string, unknown> = {}
    if (status) {
      filter.status = status
    }

    const payments = await Payment.find(filter)
      .populate({
        path: 'bookingId',
        select: 'scheduledAt duration topic status totalAmount studentId mentorId',
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
    console.error('Error fetching payments:', error)
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
      res
        .status(404)
        .json({ status: 'error', message: 'Pago no encontrado' })
      return
    }

    if (payment.status !== 'pending_validation') {
      res
        .status(400)
        .json({
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

    // Actualizar booking a confirmed
    const booking = await Booking.findById(payment.bookingId)
    if (booking && booking.status === 'payment_uploaded') {
      booking.status = 'confirmed'
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
          message: `Tu pago para la sesión sobre "${booking.topic}" ha sido aprobado. Tu sesión está confirmada.`,
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
      res
        .status(400)
        .json({
          status: 'error',
          message: 'El motivo del rechazo es obligatorio',
        })
      return
    }

    const payment = await Payment.findById(id)
    if (!payment) {
      res
        .status(404)
        .json({ status: 'error', message: 'Pago no encontrado' })
      return
    }

    if (payment.status !== 'pending_validation') {
      res
        .status(400)
        .json({
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
