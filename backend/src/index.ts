import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/database.js'
import { errorHandler } from './middlewares/errorHandler.js'
import apiRouter from './routes/index.js'

// Cargar variables de entorno
dotenv.config()

// Conectar a MongoDB
connectDB()

const app = express()
const PORT = process.env.PORT || 4000

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rutas
app.get('/', (_req, res) => {
  res.json({
    message: 'MentorMatch API',
    description: 'Sistema de Reserva de Mentorías',
    version: '1.0.0',
    status: 'running',
  })
})

app.use('/api', apiRouter)

// Manejo de errores
app.use(errorHandler)

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
})
