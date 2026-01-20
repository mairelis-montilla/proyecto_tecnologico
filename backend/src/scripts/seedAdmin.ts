import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { User } from '../models/User.model.js'

const ADMIN_EMAIL = 'mentormatch@gmail.com'
const ADMIN_PASSWORD = 'Admin123!'
const ADMIN_FIRST_NAME = 'Admin'
const ADMIN_LAST_NAME = 'MentorMatch'

async function seedAdmin() {
  try {
    // Conectar a la base de datos
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mentordb'
    await mongoose.connect(mongoUri)
    console.log('Conectado a MongoDB')

    // Verificar si el admin ya existe
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL })
    if (existingAdmin) {
      console.log('El usuario admin ya existe')
      console.log(`Email: ${ADMIN_EMAIL}`)
      await mongoose.disconnect()
      return
    }

    // Hash de la contraseña
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds)

    // Crear usuario admin
    const admin = await User.create({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      role: 'admin',
      isActive: true,
    })

    console.log('Usuario admin creado exitosamente!')
    console.log('=====================================')
    console.log(`Email: ${ADMIN_EMAIL}`)
    console.log(`Password: ${ADMIN_PASSWORD}`)
    console.log(`Role: admin`)
    console.log(`ID: ${admin._id}`)
    console.log('=====================================')

    await mongoose.disconnect()
    console.log('Desconectado de MongoDB')
  } catch (error) {
    console.error('Error al crear el admin:', error)
    process.exit(1)
  }
}

seedAdmin()
