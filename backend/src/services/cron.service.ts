import cron from 'node-cron'
import moment from 'moment-timezone'
import { Booking } from '../models/Booking.model.js'
import { sendSessionReminderEmail } from './email.service.js'
import { Notification } from '../models/Notification.model.js'
import { Student } from '../models/Student.model.js'
import { Mentor } from '../models/Mentor.model.js'

export const initCronJobs = () => {
  console.log('⏰ Initializing Cron Jobs...')

  // Ejecutar cada hora en el minuto 0
  cron.schedule('0 * * * *', async () => {
    console.log('⏳ Running hourly session reminder check...')
    await checkUpcomingSessions()
  })
}

const checkUpcomingSessions = async () => {
  try {
    const now = moment()
    
    // 1. Recordatorio 24 horas antes (buscar entre 23 y 24 horas desde ahora)
    const start24h = now.clone().add(23, 'hours').toDate()
    const end24h = now.clone().add(24, 'hours').toDate()

    const bookings24h = await Booking.find({
      status: 'confirmed',
      scheduledAt: { $gte: start24h, $lte: end24h },
      'remindersSent.twentyFourHour': false,
    }).populate('studentId mentorId')

    for (const booking of bookings24h) {
      await sendReminder(booking, '24h')
    }

    // 2. Recordatorio 1 hora antes (buscar entre 0 y 1 hora desde ahora - ej: 55 min)
    // Ajustamos la ventana para asegurar que capturamos las que van a empezar pronto
    const start1h = now.clone().add(0, 'minutes').toDate()
    const end1h = now.clone().add(60, 'minutes').toDate()

    const bookings1h = await Booking.find({
      status: 'confirmed',
      scheduledAt: { $gte: start1h, $lte: end1h },
      'remindersSent.oneHour': false,
    }).populate('studentId mentorId')

    for (const booking of bookings1h) {
      await sendReminder(booking, '1h')
    }

  } catch (error) {
    console.error('❌ Error in cron job:', error)
  }
}

const sendReminder = async (booking: any, type: '24h' | '1h') => {
  try {
    const student = await Student.findById(booking.studentId).populate('userId')
    const mentor = await Mentor.findById(booking.mentorId).populate('userId')

    if (!student || !mentor) return

    const studentUser = student.userId as any
    const mentorUser = mentor.userId as any
    
    const timeString = moment(booking.scheduledAt).tz('America/Lima').format('h:mm A')
    const timeLeft = type === '24h' ? '24 horas' : '1 hora'

    // Enviar emails
    await sendSessionReminderEmail(
      studentUser.email,
      studentUser.firstName,
      booking.topic,
      timeString,
      booking.meetLink,
      timeLeft
    )

    await sendSessionReminderEmail(
      mentorUser.email,
      mentorUser.firstName,
      booking.topic,
      timeString,
      booking.meetLink,
      timeLeft
    )

    // Crear notificaciones In-App
    await Notification.create({
      userId: studentUser._id,
      type: 'booking_reminder',
      title: 'Recordatorio de sesión',
      message: `Tu sesión con ${mentorUser.firstName} comienza en ${timeLeft}.`,
      relatedId: booking._id,
      relatedModel: 'Booking',
    })

    await Notification.create({
      userId: mentorUser._id,
      type: 'booking_reminder',
      title: 'Recordatorio de sesión',
      message: `Tu sesión con ${studentUser.firstName} comienza en ${timeLeft}.`,
      relatedId: booking._id,
      relatedModel: 'Booking',
    })

    // Marcar como enviado
    if (type === '24h') {
      booking.remindersSent.twentyFourHour = true
    } else {
      booking.remindersSent.oneHour = true
    }
    await booking.save()

    console.log(`✅ Reminder (${type}) sent for booking ${booking._id}`)

  } catch (error) {
    console.error(`❌ Error sending reminder for booking ${booking._id}:`, error)
  }
}
