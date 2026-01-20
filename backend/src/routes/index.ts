import { Router } from 'express'
import healthRouter from './health.routes.js'

const router = Router()

// Rutas disponibles
router.use('/health', healthRouter)

// Agregar aquí más rutas
// router.use('/users', userRouter)
// router.use('/auth', authRouter)

export default router
