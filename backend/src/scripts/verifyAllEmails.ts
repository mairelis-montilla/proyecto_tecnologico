import 'dotenv/config'
import mongoose from 'mongoose'
import { User } from '../models/User.model.js'

async function verifyAllEmails() {
  try {
    // Conectar a la base de datos
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/mentordb'
    await mongoose.connect(mongoUri)
    console.log('Conectado a MongoDB')

    // Contar usuarios sin email verificado
    const unverifiedCount = await User.countDocuments({
      $or: [
        { isEmailVerified: false },
        { isEmailVerified: { $exists: false } },
      ],
    })

    if (unverifiedCount === 0) {
      console.log('Todos los usuarios ya tienen su email verificado')
      await mongoose.disconnect()
      return
    }

    console.log(`Encontrados ${unverifiedCount} usuarios sin email verificado`)

    // Actualizar todos los usuarios
    const result = await User.updateMany(
      {
        $or: [
          { isEmailVerified: false },
          { isEmailVerified: { $exists: false } },
        ],
      },
      {
        $set: { isEmailVerified: true },
      }
    )

    console.log('=====================================')
    console.log(`Usuarios actualizados: ${result.modifiedCount}`)
    console.log('Todos los emails han sido marcados como verificados')
    console.log('=====================================')

    await mongoose.disconnect()
    console.log('Desconectado de MongoDB')
  } catch (error) {
    console.error('Error al verificar emails:', error)
    process.exit(1)
  }
}

verifyAllEmails()
