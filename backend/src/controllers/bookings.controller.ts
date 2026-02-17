import { Response } from 'express'
import moment from 'moment-timezone'
import { Booking, PaymentMethod } from '../models/Booking.model.js'
import { Payment } from '../models/Payment.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { Student } from '../models/Student.model.js'
import { Availability } from '../models/Availability.model.js'
import { Notification } from '../models/Notification.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'
import { uploadImage } from '../services/cloudinary.service.js'

import {
  sendBookingRequestEmail,
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail,
  sendPaymentPendingEmail,
} from '../services/email.service.js'

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
    const student = await Student.findOne({ userId }).populate('userId')
    if (!student) {
      res.status(403).json({
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
    const mentor = await Mentor.findById(mentorId).populate('userId')
    if (!mentor || !mentor.isApproved || !mentor.isActive) {
      res.status(404).json({
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
      res.status(400).json({
        status: 'error',
        message: 'El slot seleccionado no está disponible',
      })
      return
    }

    // Auto-cancelar bookings pending_payment con deadline expirado en este slot
    await Booking.updateMany(
      {
        mentorId,
        scheduledAt: scheduledAt.toDate(),
        status: 'pending_payment',
        paymentDeadline: { $lt: new Date() },
      },
      {
        $set: {
          status: 'cancelled',
          cancellation: {
            reason: 'Tiempo de pago expirado',
            cancelledAt: new Date(),
            cancelledBy: 'system',
            refundPercentage: 0,
          },
        },
      }
    )

    // Verificar que no haya otra reserva activa en ese horario
    const existingBooking = await Booking.findOne({
      mentorId,
      scheduledAt: scheduledAt.toDate(),
      status: { $nin: ['cancelled', 'refunded', 'rejected'] },
    })

    if (existingBooking) {
      res.status(400).json({
        status: 'error',
        message: 'Ya existe una reserva en ese horario',
      })
      return
    }

    // El monto total es la tarifa del mentor por sesion (no proporcional)
    const totalAmount = mentor.hourlyRate || 0

    // Crear la reserva con deadline de pago de 10 minutos
    const booking = await Booking.create({
      studentId: student._id,
      mentorId: mentor._id,
      scheduledAt: scheduledAt.toDate(),
      duration,
      topic,
      message,
      status: 'pending_payment',
      totalAmount,
      paymentDeadline: moment().add(10, 'minutes').toDate(),
    })

    // Crear notificación para el mentor
    await Notification.create({
      userId: mentor.userId,
      type: 'booking_request',
      title: 'Nueva solicitud de sesión',
      message: `Tienes una nueva solicitud de sesión sobre "${topic}"`,
      relatedId: booking._id,
      relatedModel: 'Booking',
    })

    // Enviar email al mentor
    const mentorUser = mentor.userId as any
    await sendBookingRequestEmail(
      mentorUser.email,
      mentorUser.firstName,
      (student.userId as any).firstName, 
      topic
    )

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
      filter.status = {
        $nin: ['cancelled', 'refunded', 'rejected', 'completed'],
      }
    } else if (status === 'past') {
      filter.$or = [
        { scheduledAt: { $lt: new Date() } },
        { status: 'completed' },
      ]
    } else if (status === 'cancelled') {
      filter.status = { $in: ['cancelled', 'refunded', 'rejected'] }
    } else if (status === 'pending_review') {
      // Mentor: solicitudes con pago validado por admin, esperando aprobacion del mentor
      filter.status = 'payment_validated'
    } else if (status === 'confirmed') {
      filter.status = 'confirmed'
      filter.scheduledAt = { $gte: new Date() }
    } else if (status === 'completed') {
      filter.status = 'completed'
    }

    // Auto-cancelar bookings pending_payment con deadline expirado del usuario
    const expiredFilter: Record<string, unknown> =
      userRole === 'student'
        ? { studentId: profileId }
        : { mentorId: profileId }
    expiredFilter.status = 'pending_payment'
    expiredFilter.paymentDeadline = { $lt: new Date() }

    await Booking.updateMany(expiredFilter, {
      $set: {
        status: 'cancelled',
        cancellation: {
          reason: 'Tiempo de pago expirado',
          cancelledAt: new Date(),
          cancelledBy: 'system',
          refundPercentage: 0,
        },
      },
    })

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

    // Agregar indicador de sesiones proximas (dentro de 24h)
    const now = moment()
    const bookingsWithFlags = bookings.map(booking => ({
      ...booking,
      isWithin24Hours:
        moment(booking.scheduledAt).diff(now, 'hours') <= 24 &&
        moment(booking.scheduledAt).isAfter(now),
    }))

    res.status(200).json({
      status: 'success',
      data: {
        bookings: bookingsWithFlags,
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
      res.status(403).json({
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
      res.status(400).json({
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

    // Subir imagen a Cloudinary
    let imageUrl = ''
    try {
      const uploadResult = await uploadImage(file.buffer, 'payment-proofs')
      imageUrl = uploadResult.url
    } catch (uploadError) {
      console.error('Error uploading to cloudinary:', uploadError)
      res.status(500).json({
        status: 'error',
        message: 'Error al subir el comprobante. Por favor intenta de nuevo.',
      })
      return
    }

    const parsedAmount = parseFloat(amountPaid)

    // Actualizar la reserva
    booking.paymentProof = {
      imageUrl,
      method: paymentMethod as PaymentMethod,
      amountPaid: parsedAmount,
      uploadedAt: new Date(),
    }
    booking.status = 'payment_uploaded'
    await booking.save()

    // Crear registro de Payment
    const paymentMethodMap: Record<string, string> = {
      yape: 'yape',
      plin: 'plin',
      transferencia: 'transfer',
    }
    await Payment.create({
      bookingId: booking._id,
      studentId: student.userId,
      mentorId: booking.mentorId,
      amount: parsedAmount,
      paymentMethod: paymentMethodMap[paymentMethod] || 'transfer',
      status: 'pending_validation',
      proofImage: imageUrl,
      proofUploadedAt: new Date(),
      platformFee: Math.round(parsedAmount * 0.1 * 100) / 100,
      mentorEarnings: Math.round(parsedAmount * 0.9 * 100) / 100,
    })

    // Notificar al mentor
    const mentor = await Mentor.findById(booking.mentorId).populate('userId')
    if (mentor) {
      await Notification.create({
        userId: mentor.userId,
        type: 'payment_pending',
        title: 'Comprobante de pago recibido',
        message: `Se ha subido un comprobante de pago para la sesión sobre "${booking.topic}"`,
        relatedId: booking._id,
        relatedModel: 'Booking',
      })

      // Enviar email
      const mentorUser = mentor.userId as any
      
      await sendPaymentPendingEmail(
        mentorUser.email,
        mentorUser.firstName,
        req.user?.firstName || 'Estudiante',
        booking.topic
      )
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
      res.status(403).json({
        status: 'error',
        message: 'No tienes permisos para cancelar esta reserva',
      })
      return
    }

    if (
      ['cancelled', 'refunded', 'completed', 'rejected'].includes(
        booking.status
      )
    ) {
      res.status(400).json({
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
        type: 'booking_cancelled',
        title: 'Sesión cancelada',
        message: 'Un estudiante ha cancelado una sesión',
        relatedId: booking._id,
        relatedModel: 'Booking',
      })
      
      // Email al mentor
      const mentorUser = mentor.userId as any
      await sendBookingCancelledEmail(
        mentorUser.email,
        mentorUser.firstName,
        reason || 'Sin motivo especificado',
        'Estudiante'
      )

    } else if (cancelledBy === 'mentor' && student) {
      await Notification.create({
        userId: student.userId,
        type: 'booking_cancelled',
        title: 'Sesión cancelada',
        message: 'El mentor ha cancelado tu sesión',
        relatedId: booking._id,
        relatedModel: 'Booking',
      })

      // Email al estudiante
      const studentUser = student.userId as any
      await sendBookingCancelledEmail(
        studentUser.email,
        studentUser.firstName,
        reason || 'Sin motivo especificado',
        'Mentor'
      )
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

    const refundAmount = (booking.totalAmount * refundPercentage) / 100

    res.status(200).json({
      status: 'success',
      data: {
        booking: populatedBooking,
        refundAmount,
        refundPercentage,
        hoursBeforeSession: Math.max(0, hoursBeforeSession),
      },
    })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Aprobar una solicitud de sesión (mentor)
 * PUT /api/bookings/:id/approve
 */
export const approveBooking = async (
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

    const mentor = await Mentor.findOne({ userId }).populate('userId')
    if (!mentor) {
      res.status(403).json({
        status: 'error',
        message: 'Solo los mentores pueden aprobar solicitudes',
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

    if (booking.mentorId.toString() !== mentor._id.toString()) {
      res.status(403).json({
        status: 'error',
        message: 'No tienes permisos para aprobar esta solicitud',
      })
      return
    }

    if (booking.status !== 'payment_validated') {
      res.status(400).json({
        status: 'error',
        message: 'Solo se pueden aprobar solicitudes con pago validado por el administrador',
      })
      return
    }

    // Obtener el link de meet (obligatorio)
    const { meetLink } = req.body

    if (!meetLink || meetLink.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        message:
          'El link de Google Meet es obligatorio para confirmar la sesión',
      })
      return
    }

    // Aprobar la reserva con link de meet
    booking.status = 'confirmed'
    booking.meetLink = meetLink.trim()
    await booking.save()

    // Notificar al estudiante con el link
    const student = await Student.findById(booking.studentId).populate('userId')
    if (student) {
      await Notification.create({
        userId: student.userId,
        type: 'booking_confirmed',
        title: 'Sesion confirmada',
        message: `Tu sesion sobre "${booking.topic}" ha sido aprobada por el mentor`,
        relatedId: booking._id,
        relatedModel: 'Booking',
      })

      // Enviar email con link
      const studentUser = student.userId as any
      const mentorUser = mentor.userId as any
      
      const dateStr = moment(booking.scheduledAt).tz('America/Lima').format('DD/MM/YYYY')
      const timeStr = moment(booking.scheduledAt).tz('America/Lima').format('h:mm A')

      await sendBookingConfirmedEmail(
        studentUser.email,
        studentUser.firstName,
        mentorUser.firstName,
        booking.topic,
        dateStr,
        timeStr,
        meetLink.trim()
      )
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
      message: 'Solicitud aprobada exitosamente',
      data: { booking: populatedBooking },
    })
  } catch (error) {
    console.error('Error approving booking:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Rechazar una solicitud de sesión (mentor)
 * PUT /api/bookings/:id/reject
 */
export const rejectBooking = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id
    const { id } = req.params
    const { reason } = req.body

    if (!userId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    if (!reason || reason.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'La razón del rechazo es obligatoria',
      })
      return
    }

    const mentor = await Mentor.findOne({ userId })
    if (!mentor) {
      res.status(403).json({
        status: 'error',
        message: 'Solo los mentores pueden rechazar solicitudes',
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

    if (booking.mentorId.toString() !== mentor._id.toString()) {
      res.status(403).json({
        status: 'error',
        message: 'No tienes permisos para rechazar esta solicitud',
      })
      return
    }

    if (booking.status !== 'payment_validated') {
      res.status(400).json({
        status: 'error',
        message: 'Solo se pueden rechazar solicitudes con pago validado',
      })
      return
    }

    // Rechazar la reserva con reembolso completo
    booking.status = 'rejected'
    booking.rejection = {
      reason: reason.trim(),
      rejectedAt: new Date(),
    }
    await booking.save()

    // Notificar al estudiante con la razón
    const student = await Student.findById(booking.studentId)
    if (student) {
      await Notification.create({
        userId: student.userId,
        type: 'booking_rejected',
        title: 'Sesión rechazada',
        message: `Tu sesión sobre "${booking.topic}" fue rechazada. Razón: ${reason.trim()}`,
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
      message: 'Solicitud rechazada exitosamente',
      data: {
        booking: populatedBooking,
        refundAmount: booking.totalAmount,
        refundPercentage: 100,
      },
    })
  } catch (error) {
    console.error('Error rejecting booking:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Obtener conteo de solicitudes pendientes (badge para mentor)
 * GET /api/bookings/pending-count
 */
export const getMentorPendingCount = async (
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

    const mentor = await Mentor.findOne({ userId })
    if (!mentor) {
      res.status(403).json({
        status: 'error',
        message: 'Solo los mentores pueden consultar solicitudes pendientes',
      })
      return
    }

    const count = await Booking.countDocuments({
      mentorId: mentor._id,
      status: 'payment_validated',
    })

    res.status(200).json({
      status: 'success',
      data: { pendingCount: count },
    })
  } catch (error) {
    console.error('Error getting pending count:', error)
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
