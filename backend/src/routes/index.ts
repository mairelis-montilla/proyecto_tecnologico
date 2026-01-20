import { Router } from 'express'
import healthRouter from './health.routes.js'
import authRouter from './auth.routes.js'

const router = Router()

// Rutas disponibles
router.use('/health', healthRouter)
router.use('/auth', authRouter)

// Agregar aquí más rutas
// router.use('/users', userRouter)

export default router
