import { Response } from 'express'
import moment from 'moment-timezone'
import { Availability, RecurrenceType } from '../models/Availability.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { Booking } from '../models/Booking.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

interface SlotInput {
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  recurrence?: RecurrenceType
  recurrenceEndDate?: string // YYYY-MM-DD
}

/**
 * Agregar slots de disponibilidad
 * POST /api/mentors/:id/availability
 */
export const addAvailability = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const mentorId = req.params.id
    const userId = req.user?._id

    if (!userId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    const mentor = await Mentor.findById(mentorId)
    if (!mentor) {
      res.status(404).json({ status: 'error', message: 'Mentor no encontrado' })
      return
    }

    if (mentor.userId.toString() !== userId.toString()) {
      res.status(403).json({ status: 'error', message: 'No autorizado' })
      return
    }

    const { slots, duration = 60 } = req.body as {
      slots: SlotInput[]
      duration: number
    }

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      res
        .status(400)
        .json({ status: 'error', message: 'Se requiere al menos un slot' })
      return
    }

    if (![45, 60].includes(duration)) {
      res.status(400).json({
        status: 'error',
        message: 'La duración debe ser 45 o 60 minutos',
      })
      return
    }

    const createdSlots = []

    for (const slot of slots) {
      const { date, startTime, recurrence = 'none', recurrenceEndDate } = slot

      // Validar fecha (en zona horaria Lima para que "hoy" sea correcto en Perú)
      const slotDate = moment
        .tz(date, 'YYYY-MM-DD', 'America/Lima')
        .startOf('day')
      if (!slotDate.isValid()) {
        res
          .status(400)
          .json({ status: 'error', message: `Fecha inválida: ${date}` })
        return
      }

      // No permitir fechas pasadas (comparar contra "hoy" en Lima, no en UTC)
      if (slotDate.isBefore(moment().tz('America/Lima'), 'day')) {
        res.status(400).json({
          status: 'error',
          message: 'No se pueden agregar slots en fechas pasadas',
        })
        return
      }

      // Validar hora
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
        res
          .status(400)
          .json({ status: 'error', message: `Hora inválida: ${startTime}` })
        return
      }

      const startMin = timeToMinutes(startTime)
      const endMin = startMin + duration
      const endTime = minutesToTime(endMin)

      // Verificar superposición con slots existentes (rango del día para cubrir distintos formatos UTC)
      const existingSlot = await Availability.findOne({
        mentorId,
        date: {
          $gte: moment.utc(date, 'YYYY-MM-DD').startOf('day').toDate(),
          $lte: moment.utc(date, 'YYYY-MM-DD').endOf('day').toDate(),
        },
        isActive: true,
        $or: [
          {
            $and: [
              { startTime: { $lte: startTime } },
              { endTime: { $gt: startTime } },
            ],
          },
          {
            $and: [
              { startTime: { $lt: endTime } },
              { endTime: { $gte: endTime } },
            ],
          },
          {
            $and: [
              { startTime: { $gte: startTime } },
              { endTime: { $lte: endTime } },
            ],
          },
        ],
      })

      if (existingSlot) {
        res.status(400).json({
          status: 'error',
          message: `Ya existe un slot que se superpone el ${date} a las ${startTime}`,
        })
        return
      }

      // Crear el primer slot (siempre independiente)
      const newSlot = await Availability.create({
        mentorId,
        date: slotDate.toDate(),
        dayOfWeek: slotDate.day(),
        startTime,
        endTime,
        duration,
        isActive: true,
        recurrence: 'none', // Todos los slots son independientes
      })

      createdSlots.push(newSlot)

      // Si hay recurrencia, crear slots adicionales independientes
      if (recurrence !== 'none') {
        const endRecurrence = recurrenceEndDate
          ? moment(recurrenceEndDate)
          : moment(date).add(3, 'months') // Por defecto 3 meses

        let nextDate = slotDate.clone()

        while (true) {
          if (recurrence === 'daily') {
            nextDate.add(1, 'day')
          } else if (recurrence === 'weekly') {
            nextDate.add(1, 'week')
          } else if (recurrence === 'monthly') {
            nextDate.add(1, 'month')
          }

          if (nextDate.isAfter(endRecurrence)) break

          // Verificar que no exista ya (rango del día para cubrir distintos formatos UTC)
          const nextDateStr = nextDate.format('YYYY-MM-DD')
          const exists = await Availability.findOne({
            mentorId,
            date: {
              $gte: moment
                .utc(nextDateStr, 'YYYY-MM-DD')
                .startOf('day')
                .toDate(),
              $lte: moment.utc(nextDateStr, 'YYYY-MM-DD').endOf('day').toDate(),
            },
            startTime,
            isActive: true,
          })

          if (!exists) {
            const additionalSlot = await Availability.create({
              mentorId,
              date: nextDate.toDate(),
              dayOfWeek: nextDate.day(),
              startTime,
              endTime,
              duration,
              isActive: true,
              recurrence: 'none', // Todos los slots son independientes
            })
            createdSlots.push(additionalSlot)
          }
        }
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Disponibilidad agregada correctamente',
      data: createdSlots,
    })
  } catch (error) {
    console.error('Error adding availability:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Eliminar un slot de disponibilidad
 * DELETE /api/mentors/:id/availability/:slotId
 */
export const deleteAvailability = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: mentorId, slotId } = req.params
    const userId = req.user?._id

    if (!userId) {
      res
        .status(401)
        .json({ status: 'error', message: 'Usuario no autenticado' })
      return
    }

    const mentor = await Mentor.findById(mentorId)
    if (!mentor) {
      res.status(404).json({ status: 'error', message: 'Mentor no encontrado' })
      return
    }

    if (mentor.userId.toString() !== userId.toString()) {
      res.status(403).json({ status: 'error', message: 'No autorizado' })
      return
    }

    const slot = await Availability.findOne({ _id: slotId, mentorId })
    if (!slot) {
      res.status(404).json({ status: 'error', message: 'Slot no encontrado' })
      return
    }

    // Verificar si hay una reserva para este slot
    // slot.startTime está en hora Lima → construir timestamp UTC correcto con moment.tz
    if (slot.date) {
      const slotDateStr = moment.utc(slot.date).format('YYYY-MM-DD')
      const scheduledAt = moment.tz(
        `${slotDateStr} ${slot.startTime}`,
        'YYYY-MM-DD HH:mm',
        'America/Lima'
      )

      const booking = await Booking.findOne({
        mentorId,
        scheduledAt: scheduledAt.toDate(),
        status: { $nin: ['cancelled', 'refunded'] },
      })

      if (booking) {
        res.status(400).json({
          status: 'error',
          message: 'No se puede eliminar un slot con una reserva activa',
        })
        return
      }
    }

    await Availability.findByIdAndDelete(slotId)

    res.status(200).json({
      status: 'success',
      message: 'Slot eliminado correctamente',
    })
  } catch (error) {
    console.error('Error deleting availability:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Obtener disponibilidad del mentor
 * GET /api/mentors/:id/availability
 */
export const getAvailability = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const mentorId = req.params.id
    const { startDate, endDate } = req.query

    const filter: Record<string, unknown> = {
      mentorId,
      isActive: true,
    }

    // Si se proporcionan fechas, filtrar por rango
    if (startDate && endDate) {
      filter.date = {
        $gte: moment(startDate as string)
          .startOf('day')
          .toDate(),
        $lte: moment(endDate as string)
          .endOf('day')
          .toDate(),
      }
    } else {
      // Por defecto, mostrar desde hoy en adelante ("hoy" en hora Lima, no UTC)
      const todayLima = moment().tz('America/Lima').format('YYYY-MM-DD')
      filter.date = { $gte: moment.utc(todayLima, 'YYYY-MM-DD').toDate() }
    }

    const availability = await Availability.find(filter)
      .sort({ date: 1, startTime: 1 })
      .lean()

    // Cruzar con reservas activas para saber cuáles slots están ocupados
    // startTime está en hora Lima → construir timestamp UTC correcto con moment.tz
    const scheduledTimes = availability
      .filter(s => s.date)
      .map(s => {
        const datePart = moment.utc(s.date!).format('YYYY-MM-DD')
        return moment
          .tz(`${datePart} ${s.startTime}`, 'YYYY-MM-DD HH:mm', 'America/Lima')
          .toDate()
      })

    const activeBookings =
      scheduledTimes.length > 0
        ? await Booking.find({
            mentorId,
            scheduledAt: { $in: scheduledTimes },
            status: { $nin: ['cancelled', 'refunded'] },
          })
            .select('scheduledAt status _id')
            .lean()
        : []

    const slotsWithBookingInfo = availability.map(slot => {
      if (!slot.date) return { ...slot, hasActiveBooking: false }
      const datePart = moment.utc(slot.date!).format('YYYY-MM-DD')
      const scheduledAt = moment
        .tz(`${datePart} ${slot.startTime}`, 'YYYY-MM-DD HH:mm', 'America/Lima')
        .toDate()
      const booking = activeBookings.find(
        b =>
          Math.abs(new Date(b.scheduledAt).getTime() - scheduledAt.getTime()) <
          60000
      )
      return {
        ...slot,
        hasActiveBooking: !!booking,
        bookingId: booking?._id ?? null,
        bookingStatus: booking?.status ?? null,
      }
    })

    res.status(200).json({
      status: 'success',
      data: slotsWithBookingInfo,
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

/**
 * Obtener preview de slots disponibles (para estudiantes)
 * GET /api/mentors/:id/availability/preview
 */
export const previewAvailability = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const mentorId = req.params.id
    const weeks = parseInt(req.query.weeks as string) || 2

    const mentor = await Mentor.findById(mentorId)
    if (!mentor) {
      res.status(404).json({ status: 'error', message: 'Mentor no encontrado' })
      return
    }

    const timezone = mentor.timezone || 'America/Lima'
    const now = moment().tz(timezone)
    // Usar UTC midnight del día Lima para que coincida con cómo se guardan las fechas en BD
    const todayStr = now.format('YYYY-MM-DD')
    const endStr = now.clone().add(weeks, 'weeks').format('YYYY-MM-DD')
    const startDate = moment.utc(todayStr, 'YYYY-MM-DD').startOf('day')
    const endDate = moment.utc(endStr, 'YYYY-MM-DD').endOf('day')

    // Obtener slots de disponibilidad
    const availability = await Availability.find({
      mentorId,
      isActive: true,
      date: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
    }).lean()

    // Auto-cancelar bookings pending_payment con deadline expirado
    await Booking.updateMany(
      {
        mentorId,
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

    // Obtener reservas existentes (excluir canceladas, reembolsadas y rechazadas)
    const bookings = await Booking.find({
      mentorId,
      scheduledAt: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
      status: { $nin: ['cancelled', 'refunded', 'rejected'] },
    }).lean()

    const concreteSlots: Array<{
      date: string
      startTime: string
      endTime: string
      startIso: string
      endIso: string
      duration: number
      slotId: string
    }> = []

    for (const slot of availability) {
      if (!slot.date) continue

      // startTime está en hora Lima → construir timestamp UTC correcto con moment.tz
      const slotDateStr = moment.utc(slot.date!).format('YYYY-MM-DD')
      const slotStart = moment.tz(
        `${slotDateStr} ${slot.startTime}`,
        'YYYY-MM-DD HH:mm',
        timezone
      )

      // Saltar slots en el pasado
      if (slotStart.isBefore(now)) continue

      // Verificar si hay una reserva
      const isBooked = bookings.some(booking => {
        const bookingStart = moment(booking.scheduledAt).tz(timezone)
        return (
          bookingStart.format('YYYY-MM-DD') ===
            slotStart.format('YYYY-MM-DD') &&
          bookingStart.format('HH:mm') === slot.startTime
        )
      })

      if (!isBooked) {
        concreteSlots.push({
          date: slotStart.format('YYYY-MM-DD'),
          startTime: slot.startTime,
          endTime: slot.endTime,
          startIso: slotStart.toISOString(),
          endIso: slotStart.clone().add(slot.duration, 'minutes').toISOString(),
          duration: slot.duration,
          slotId: slot._id!.toString(),
        })
      }
    }

    // Ordenar por fecha y hora
    concreteSlots.sort(
      (a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime()
    )

    res.status(200).json({
      status: 'success',
      data: concreteSlots,
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor' })
  }
}

// Legacy: Mantener compatibilidad con el método anterior
export const setAvailability = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const mentorId = req.params.id
    const userId = req.user?._id

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    const mentor = await Mentor.findById(mentorId)
    if (!mentor) {
      res.status(404).json({ message: 'Mentor not found' })
      return
    }

    if (mentor.userId.toString() !== userId.toString()) {
      res.status(403).json({
        message: "Not authorized to update this mentor's availability",
      })
      return
    }

    const { slots, duration } = req.body

    if (!slots || !Array.isArray(slots)) {
      res.status(400).json({ message: 'Slots array is required' })
      return
    }

    if (![45, 60].includes(duration)) {
      res.status(400).json({ message: 'Duration must be 45 or 60 minutes' })
      return
    }

    // Eliminar disponibilidad antigua
    await Availability.deleteMany({ mentorId })

    // Crear nueva disponibilidad
    const newSlots = slots.map(
      (slot: { dayOfWeek: number; startTime: string }) => {
        const startMin = timeToMinutes(slot.startTime)
        const endMin = startMin + duration
        return {
          mentorId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: minutesToTime(endMin),
          duration,
          isActive: true,
          recurrence: 'weekly' as RecurrenceType,
        }
      }
    )

    const createdSlots = await Availability.insertMany(newSlots)

    res.status(200).json({
      status: 'success',
      message: 'Availability updated successfully',
      data: createdSlots,
    })
  } catch (error) {
    console.error('Error setting availability:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
