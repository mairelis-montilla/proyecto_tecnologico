import mongoose from 'mongoose'

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mentordb'

    await mongoose.connect(mongoURI)

    console.log('✅ MongoDB connected successfully')
    console.log(`📦 Database: ${mongoose.connection.name}`)
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

// Eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to DB')
})

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from DB')
})

// Manejo de cierre de aplicación
process.on('SIGINT', async () => {
  await mongoose.connection.close()
  console.log('⏹️  MongoDB connection closed through app termination')
  process.exit(0)
})
