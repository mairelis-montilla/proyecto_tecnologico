import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { User } from '../models/User.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { Availability } from '../models/Availability.model.js'

// Registrar el modelo User para que el populate funcione
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _User = User

dotenv.config()

// Patrones de disponibilidad variados para los mentores
const availabilityPatterns = [
  // Patrón 1: Lun-Vie, mañana y tarde (30 slots/semana)
  {
    days: [1, 2, 3, 4, 5],
    hours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  },
  // Patrón 2: Lun, Mie, Vie, Sab - horarios variados (24 slots/semana)
  {
    days: [1, 3, 5, 6],
    hours: ['10:00', '11:00', '12:00', '17:00', '18:00', '19:00'],
  },
  // Patrón 3: Lun-Sab mañanas (30 slots/semana)
  {
    days: [1, 2, 3, 4, 5, 6],
    hours: ['08:00', '09:00', '10:00', '11:00', '12:00'],
  },
  // Patrón 4: Lun-Sab tardes (24 slots/semana)
  {
    days: [1, 2, 3, 4, 5, 6],
    hours: ['14:00', '15:00', '16:00', '17:00'],
  },
]

async function updateMentorAvailability() {
  try {
    const mongoUri = process.env.MONGODB_URI

    if (!mongoUri) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno')
    }

    await mongoose.connect(mongoUri)
    console.log('Conectado a MongoDB')

    // Obtener todos los mentores activos y aprobados
    const mentors = await Mentor.find({ isActive: true, isApproved: true }).populate(
      'userId',
      'firstName lastName email'
    )

    console.log(`\nEncontrados ${mentors.length} mentores activos`)

    if (mentors.length === 0) {
      console.log('No hay mentores para actualizar')
      process.exit(0)
    }

    let updated = 0

    for (let i = 0; i < mentors.length; i++) {
      const mentor = mentors[i]
      const user = mentor.userId as any

      // Eliminar disponibilidad anterior
      await Availability.deleteMany({ mentorId: mentor._id })

      // Seleccionar patrón basado en el índice
      const pattern = availabilityPatterns[i % availabilityPatterns.length]

      // Crear nuevos slots de disponibilidad
      const availabilitySlots: Array<{
        mentorId: typeof mentor._id
        dayOfWeek: number
        startTime: string
        endTime: string
        duration: number
        isActive: boolean
      }> = []

      for (const day of pattern.days) {
        for (const hour of pattern.hours) {
          const [h, m] = hour.split(':').map(Number)
          const endHour = h + 1
          const endTime = `${endHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`

          availabilitySlots.push({
            mentorId: mentor._id,
            dayOfWeek: day,
            startTime: hour,
            endTime: endTime,
            duration: 60,
            isActive: true,
          })
        }
      }

      await Availability.insertMany(availabilitySlots)

      console.log(
        `  + ${user.firstName} ${user.lastName}: ${availabilitySlots.length} slots creados (${pattern.days.length} días x ${pattern.hours.length} horas)`
      )
      updated++
    }

    console.log(`\n✅ Resumen:`)
    console.log(`  - Mentores actualizados: ${updated}`)
    console.log(`  - Slots cubren los próximos 20+ días (patrón semanal recurrente)`)
    console.log(`\n📅 Días de la semana:`)
    console.log(`  0 = Domingo, 1 = Lunes, 2 = Martes, 3 = Miércoles`)
    console.log(`  4 = Jueves, 5 = Viernes, 6 = Sábado`)

    await mongoose.disconnect()
    console.log('\nDesconectado de MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('Error al actualizar disponibilidad:', error)
    process.exit(1)
  }
}

updateMentorAvailability()
