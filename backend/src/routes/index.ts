import { Router } from 'express'
import healthRouter from './health.routes.js'
import authRouter from './auth.routes.js'
import mentorsRouter from './mentors.routes.js'
import specialtiesRouter from './specialties.routes.js'
import reviewsRouter from './reviews.routes.js'
import adminRouter from './admin.routes.js'
import studentsRouter from './students.routes.js'
import uploadRouter from './upload.routes.js'

const router = Router()

// Rutas disponibles
router.use('/health', healthRouter)
router.use('/auth', authRouter)
router.use('/mentors', mentorsRouter)
router.use('/specialties', specialtiesRouter)
router.use('/reviews', reviewsRouter)
router.use('/admin', adminRouter)
router.use('/students', studentsRouter)
router.use('/upload', uploadRouter)

export default router
