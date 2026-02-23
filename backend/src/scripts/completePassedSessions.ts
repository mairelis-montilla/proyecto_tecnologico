import 'dotenv/config'
import mongoose from 'mongoose'
import { Booking } from '../models/Booking.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { Student } from '../models/Student.model.js'

async function completePassedSessions() {
  try {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/mentordb'
    await mongoose.connect(mongoUri)
    console.log('Conectado a MongoDB')

    const now = new Date()

    // Buscar sesiones confirmadas cuya hora de fin ya pasó
    // La sesión termina en: scheduledAt + duration (minutos)
    // Usamos agregación para comparar scheduledAt + duration <= now
    const passedSessions = await Booking.find({
      status: 'confirmed',
      $expr: {
        $lte: [
          {
            $add: [
              '$scheduledAt',
              { $multiply: ['$duration', 60 * 1000] }, // duration en ms
            ],
          },
          now,
        ],
      },
    }).select('_id scheduledAt duration topic mentorId studentId')

    if (passedSessions.length === 0) {
      console.log('No hay sesiones confirmadas pasadas para completar.')
      await mongoose.disconnect()
      return
    }

    console.log(
      `Encontradas ${passedSessions.length} sesión(es) para marcar como completada(s):`
    )
    passedSessions.forEach(s => {
      const endTime = new Date(s.scheduledAt.getTime() + s.duration * 60 * 1000)
      console.log(
        `  - [${s._id}] "${s.topic}" | Terminó: ${endTime.toLocaleString('es-PE')}`
      )
    })

    const ids = passedSessions.map(s => s._id)

    // Marcar sesiones como completadas
    const result = await Booking.updateMany(
      { _id: { $in: ids } },
      { $set: { status: 'completed' } }
    )

    // Incrementar totalSessions para mentores y estudiantes involucrados
    const mentorIds = [
      ...new Set(passedSessions.map(s => s.mentorId.toString())),
    ]
    const studentIds = [
      ...new Set(passedSessions.map(s => s.studentId.toString())),
    ]

    await Promise.all([
      Mentor.updateMany(
        { _id: { $in: mentorIds } },
        { $inc: { totalSessions: 1 } }
      ),
      Student.updateMany(
        { _id: { $in: studentIds } },
        { $inc: { totalSessions: 1 } }
      ),
    ])

    console.log(
      `\n✅ ${result.modifiedCount} sesión(es) marcada(s) como "completed".`
    )
    console.log(
      `📊 totalSessions actualizado para ${mentorIds.length} mentor(es) y ${studentIds.length} estudiante(s).`
    )

    await mongoose.disconnect()
    console.log('Desconectado de MongoDB')
  } catch (error) {
    console.error('Error al completar sesiones:', error)
    process.exit(1)
  }
}

completePassedSessions()
