import { Response } from 'express'
import moment from 'moment-timezone'
import { Booking, PaymentMethod } from '../models/Booking.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { Student } from '../models/Student.model.js'
import { Availability } from '../models/Availability.model.js'
import { Notification } from '../models/Notification.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'

/**
 * Crear una nueva reserva
 * POST /api/bookings
 */
export const createBooking = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id

    if (!userId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    // Verificar que es un estudiante
    const student = await Student.findOne({ userId })
    if (!student) {
      res
        .status(403)
        .json({
          status: 'error',
          message: 'Solo los estudiantes pueden crear reservas',
        })
      return
    }

    const { mentorId, slotStartIso, slotEndIso, topic, message } = req.body

    if (!mentorId || !slotStartIso || !topic) {
      res.status(400).json({
        status: 'error',
        message: 'Se requiere mentorId, slotStartIso y topic',
      })
      return
    }

    // Verificar que el mentor existe y está aprobado
    const mentor = await Mentor.findById(mentorId)
    if (!mentor || !mentor.isApproved || !mentor.isActive) {
      res
        .status(404)
        .json({
          status: 'error',
          message: 'Mentor no encontrado o no disponible',
        })
      return
    }

    const scheduledAt = moment(slotStartIso)
    const endTime = slotEndIso
      ? moment(slotEndIso)
      : scheduledAt.clone().add(60, 'minutes')
    const duration = endTime.diff(scheduledAt, 'minutes')

    // Verificar que no sea en el pasado
    if (scheduledAt.isBefore(moment())) {
      res
        .status(400)
        .json({ status: 'error', message: 'No se puede reservar en el pasado' })
      return
    }

    // Verificar que el slot esté disponible
    const slotDate = scheduledAt.format('YYYY-MM-DD')
    const startTime = scheduledAt.format('HH:mm')

    const availableSlot = await Availability.findOne({
      mentorId,
      date: {
        $gte: moment(slotDate).startOf('day').toDate(),
        $lte: moment(slotDate).endOf('day').toDate(),
      },
      startTime,
      isActive: true,
    })

    if (!availableSlot) {
      res
        .status(400)
        .json({
          status: 'error',
          message: 'El slot seleccionado no está disponible',
        })
      return
    }

    // Verificar que no haya otra reserva en ese horario
    const existingBooking = await Booking.findOne({
      mentorId,
      scheduledAt: scheduledAt.toDate(),
      status: { $nin: ['cancelled', 'refunded'] },
    })

    if (existingBooking) {
      res
        .status(400)
        .json({
          status: 'error',
          message: 'Ya existe una reserva en ese horario',
        })
      return
    }

    // Calcular el monto total
    const totalAmount = mentor.hourlyRate
      ? (mentor.hourlyRate * duration) / 60
      : 0

    // Crear la reserva
    const booking = await Booking.create({
      studentId: student._id,
      mentorId: mentor._id,
      scheduledAt: scheduledAt.toDate(),
      duration,
      topic,
      message,
      status: 'pending_payment',
      totalAmount,
    })

    // Crear notificación para el mentor
    await Notification.create({
      userId: mentor.userId,
      type: 'session_request',
      title: 'Nueva solicitud de sesión',
      message: `Tienes una nueva solicitud de sesión sobre "${topic}"`,
      relatedId: booking._id,
      relatedModel: 'Booking',
    })

    // Poblar datos para la respuesta
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'mentorId',
        select: 'userId hourlyRate title',
        populate: {
          path: 'userId',
          select: 'firstName lastName avatar',
        },
      })
      .populate({
        path: 'studentId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'firstName lastName avatar',
        },
      })

    res.status(201).json({
      status: 'success',
      data: {
        booking: populatedBooking,
      },
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Obtener mis reservas
 * GET /api/bookings/my
 */
export const getMyBookings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id
    const userRole = req.user?.role

    if (!userId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    const { status, page = '1', limit = '10' } = req.query
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    // Determinar el filtro según el rol
    let profileId: string | undefined

    if (userRole === 'student') {
      const student = await Student.findOne({ userId })
      if (student) profileId = student._id.toString()
    } else if (userRole === 'mentor') {
      const mentor = await Mentor.findOne({ userId })
      if (mentor) profileId = mentor._id.toString()
    }

    if (!profileId) {
      res.status(200).json({
        status: 'success',
        data: {
          bookings: [],
          pagination: {
            currentPage: pageNum,
            totalPages: 0,
            totalItems: 0,
          },
        },
      })
      return
    }

    const filter: Record<string, unknown> =
      userRole === 'student'
        ? { studentId: profileId }
        : { mentorId: profileId }

    // Filtrar por estado
    if (status === 'upcoming') {
      filter.scheduledAt = { $gte: new Date() }
      filter.status = { $nin: ['cancelled', 'refunded', 'completed'] }
    } else if (status === 'past') {
      filter.$or = [
        { scheduledAt: { $lt: new Date() } },
        { status: 'completed' },
      ]
    } else if (status === 'cancelled') {
      filter.status = { $in: ['cancelled', 'refunded'] }
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: 'mentorId',
        select: 'userId hourlyRate title',
        populate: {
          path: 'userId',
          select: 'firstName lastName avatar',
        },
      })
      .populate({
        path: 'studentId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'firstName lastName avatar',
        },
      })
      .sort({ scheduledAt: status === 'past' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    const total = await Booking.countDocuments(filter)

    res.status(200).json({
      status: 'success',
      data: {
        bookings,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Obtener detalle de una reserva
 * GET /api/bookings/:id
 */
export const getBookingById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id
    const userRole = req.user?.role
    const { id } = req.params

    if (!userId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    const booking = await Booking.findById(id)
      .populate({
        path: 'mentorId',
        select: 'userId hourlyRate title',
        populate: {
          path: 'userId',
          select: 'firstName lastName avatar email',
        },
      })
      .populate({
        path: 'studentId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'firstName lastName avatar email',
        },
      })

    if (!booking) {
      res
        .status(404)
        .json({ status: 'error', message: 'Reserva no encontrada' })
      return
    }

    // Verificar permisos
    let hasAccess = false
    if (userRole === 'admin') {
      hasAccess = true
    } else if (userRole === 'student') {
      const student = await Student.findOne({ userId })
      hasAccess = student?._id.toString() === booking.studentId._id.toString()
    } else if (userRole === 'mentor') {
      const mentor = await Mentor.findOne({ userId })
      hasAccess = mentor?._id.toString() === booking.mentorId._id.toString()
    }

    if (!hasAccess) {
      res
        .status(403)
        .json({ status: 'error', message: 'No tienes acceso a esta reserva' })
      return
    }

    res.status(200).json({
      status: 'success',
      data: { booking },
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Subir comprobante de pago
 * POST /api/bookings/:id/payment-proof
 */
export const uploadPaymentProof = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id
    const { id } = req.params

    if (!userId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    const student = await Student.findOne({ userId })
    if (!student) {
      res
        .status(403)
        .json({
          status: 'error',
          message: 'Solo los estudiantes pueden subir comprobantes',
        })
      return
    }

    const booking = await Booking.findById(id)
    if (!booking) {
      res
        .status(404)
        .json({ status: 'error', message: 'Reserva no encontrada' })
      return
    }

    if (booking.studentId.toString() !== student._id.toString()) {
      res
        .status(403)
        .json({ status: 'error', message: 'No tienes acceso a esta reserva' })
      return
    }

    if (booking.status !== 'pending_payment') {
      res
        .status(400)
        .json({
          status: 'error',
          message: 'Esta reserva no está pendiente de pago',
        })
      return
    }

    const { paymentMethod, amountPaid } = req.body
    const file = req.file

    if (!paymentMethod || !amountPaid || !file) {
      res.status(400).json({
        status: 'error',
        message: 'Se requiere paymentMethod, amountPaid y el comprobante',
      })
      return
    }

    // Actualizar la reserva
    booking.paymentProof = {
      imageUrl: (file as Express.Multer.File & { path?: string }).path || '',
      method: paymentMethod as PaymentMethod,
      amountPaid: parseFloat(amountPaid),
      uploadedAt: new Date(),
    }
    booking.status = 'payment_uploaded'
    await booking.save()

    // Notificar al admin (o al mentor)
    const mentor = await Mentor.findById(booking.mentorId)
    if (mentor) {
      await Notification.create({
        userId: mentor.userId,
        type: 'payment_received',
        title: 'Comprobante de pago recibido',
        message: 'Se ha subido un comprobante de pago para una sesión',
        relatedId: booking._id,
        relatedModel: 'Booking',
      })
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'mentorId',
        select: 'userId hourlyRate title',
        populate: {
          path: 'userId',
          select: 'firstName lastName avatar',
        },
      })
      .populate({
        path: 'studentId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'firstName lastName avatar',
        },
      })

    res.status(200).json({
      status: 'success',
      data: { booking: populatedBooking },
    })
  } catch (error) {
    console.error('Error uploading payment proof:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Cancelar una reserva
 * POST /api/bookings/:id/cancel
 */
export const cancelBooking = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id
    const userRole = req.user?.role
    const { id } = req.params
    const { reason } = req.body

    if (!userId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    const booking = await Booking.findById(id)
    if (!booking) {
      res
        .status(404)
        .json({ status: 'error', message: 'Reserva no encontrada' })
      return
    }

    // Verificar permisos y determinar quién cancela
    let cancelledBy: 'student' | 'mentor' | 'admin' = 'student'
    let hasAccess = false

    if (userRole === 'admin') {
      hasAccess = true
      cancelledBy = 'admin'
    } else if (userRole === 'student') {
      const student = await Student.findOne({ userId })
      hasAccess = student?._id.toString() === booking.studentId.toString()
      cancelledBy = 'student'
    } else if (userRole === 'mentor') {
      const mentor = await Mentor.findOne({ userId })
      hasAccess = mentor?._id.toString() === booking.mentorId.toString()
      cancelledBy = 'mentor'
    }

    if (!hasAccess) {
      res
        .status(403)
        .json({
          status: 'error',
          message: 'No tienes permisos para cancelar esta reserva',
        })
      return
    }

    if (['cancelled', 'refunded', 'completed'].includes(booking.status)) {
      res
        .status(400)
        .json({
          status: 'error',
          message: 'Esta reserva no puede ser cancelada',
        })
      return
    }

    // Calcular porcentaje de reembolso
    const hoursBeforeSession = moment(booking.scheduledAt).diff(
      moment(),
      'hours'
    )
    let refundPercentage = 0

    if (hoursBeforeSession >= 24) {
      refundPercentage = 100
    } else if (hoursBeforeSession >= 12) {
      refundPercentage = 50
    }

    // Si el mentor cancela, siempre es 100% de reembolso
    if (cancelledBy === 'mentor' || cancelledBy === 'admin') {
      refundPercentage = 100
    }

    // Actualizar la reserva
    booking.status =
      refundPercentage > 0 && booking.paymentProof ? 'refunded' : 'cancelled'
    booking.cancellation = {
      reason,
      cancelledAt: new Date(),
      cancelledBy,
      refundPercentage,
    }
    await booking.save()

    // Notificar a la otra parte
    const mentor = await Mentor.findById(booking.mentorId)
    const student = await Student.findById(booking.studentId)

    if (cancelledBy === 'student' && mentor) {
      await Notification.create({
        userId: mentor.userId,
        type: 'session_cancelled',
        title: 'Sesión cancelada',
        message: 'Un estudiante ha cancelado una sesión',
        relatedId: booking._id,
        relatedModel: 'Booking',
      })
    } else if (cancelledBy === 'mentor' && student) {
      await Notification.create({
        userId: student.userId,
        type: 'session_cancelled',
        title: 'Sesión cancelada',
        message: 'El mentor ha cancelado tu sesión',
        relatedId: booking._id,
        relatedModel: 'Booking',
      })
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'mentorId',
        select: 'userId hourlyRate title',
        populate: {
          path: 'userId',
          select: 'firstName lastName avatar',
        },
      })
      .populate({
        path: 'studentId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'firstName lastName avatar',
        },
      })

    res.status(200).json({
      status: 'success',
      data: { booking: populatedBooking },
    })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Obtener política de reembolso
 * GET /api/bookings/:id/refund-policy
 */
export const getRefundPolicy = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id
    const { id } = req.params

    if (!userId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    const booking = await Booking.findById(id)
    if (!booking) {
      res
        .status(404)
        .json({ status: 'error', message: 'Reserva no encontrada' })
      return
    }

    const hoursRemaining = moment(booking.scheduledAt).diff(moment(), 'hours')
    let refundPercentage = 0
    let description = ''

    if (hoursRemaining >= 24) {
      refundPercentage = 100
      description =
        'Reembolso completo (100%) - Cancelación con más de 24 horas de anticipación'
    } else if (hoursRemaining >= 12) {
      refundPercentage = 50
      description =
        'Reembolso parcial (50%) - Cancelación entre 12 y 24 horas de anticipación'
    } else {
      refundPercentage = 0
      description =
        'Sin reembolso (0%) - Cancelación con menos de 12 horas de anticipación'
    }

    res.status(200).json({
      status: 'success',
      data: {
        policy: {
          hoursBeforeSession: Math.max(0, hoursRemaining),
          refundPercentage,
          description,
        },
        hoursRemaining: Math.max(0, hoursRemaining),
        refundPercentage,
      },
    })
  } catch (error) {
    console.error('Error getting refund policy:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}
