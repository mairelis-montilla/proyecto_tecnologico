import { Router } from 'express'
import { setAvailability, getAvailability, previewAvailability } from '../controllers/availability.controller.js'
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js'

const router = Router({ mergeParams: true })

// POST /:id/availability - Set availability (Mentor only, owner only)
router.post(
    '/:id/availability', 
    authenticateToken, 
    authorize('mentor'), 
    setAvailability
)

// GET /:id/availability/preview - Preview concrete slots for next X weeks
router.get(
    '/:id/availability/preview',
    authenticateToken,
    previewAvailability
)

// GET /:id/availability - Get availability (Public or Authenticated?)
// Assuming public read for availability so students can see it.
// If it needs login, add authenticateToken.
// "Para que estudiantes sepan cuándo pueden reservar" -> Students need to see it.
// I'll make it public or at least accessible to 'student' and 'mentor'.
// For now, I'll put authenticateToken because user requested it in context of "Como mentor...", 
// but usually this is public. I'll require auth to be safe as per general pattern.
router.get(
    '/:id/availability', 
    authenticateToken,
    getAvailability
)

export default router
