import { Response } from 'express'
import { Availability } from '../models/Availability.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'

interface ITimeSlot {
  dayOfWeek: number
  startTime: string
}

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export const setAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mentorId = req.params.id
    const userId = req.user?._id

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' })
        return
    }

    // Authorization: Check if the mentor belongs to the user
    const mentor = await Mentor.findById(mentorId)
    if (!mentor) {
        res.status(404).json({ message: 'Mentor not found' })
        return
    }

    if (mentor.userId.toString() !== userId.toString()) {
        res.status(403).json({ message: 'Not authorized to update this mentor\'s availability' })
        return
    }

    const { slots, duration } = req.body // slots: [{ dayOfWeek, startTime }], duration: 45 | 60

    if (!slots || !Array.isArray(slots)) {
      res.status(400).json({ message: 'Slots array is required' })
      return
    }

    if (![45, 60].includes(duration)) {
      res.status(400).json({ message: 'Duration must be 45 or 60 minutes' })
      return
    }

    // Validate and process slots
    const newSlots = []
    
    // Sort slots by day and time to easily check overlaps
    const sortedSlots = [...(slots as ITimeSlot[])].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    })

    for (let i = 0; i < sortedSlots.length; i++) {
        const slot = sortedSlots[i];
        
        // Basic validation
        if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
             res.status(400).json({ message: `Invalid day of week: ${slot.dayOfWeek}` })
             return
        }
        
        const startMin = timeToMinutes(slot.startTime)
        const endMin = startMin + duration
        
        // Check for overlaps with the NEXT slot in the sorted list (if same day)
        if (i < sortedSlots.length - 1) {
            const nextSlot = sortedSlots[i+1];
            if (nextSlot.dayOfWeek === slot.dayOfWeek) {
                 const nextStartMin = timeToMinutes(nextSlot.startTime);
                 if (nextStartMin < endMin) {
                      res.status(400).json({ 
                          message: `Overlapping slots detected on day ${slot.dayOfWeek} at ${slot.startTime}` 
                      })
                      return
                 }
            }
        }

        newSlots.push({
            mentorId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: minutesToTime(endMin),
            duration,
            isActive: true
        })
    }

    // If validation passes, delete old availability and insert new
    await Availability.deleteMany({ mentorId })
    const createdSlots = await Availability.insertMany(newSlots)

    res.status(200).json({ 
        status: 'success', 
        message: 'Availability updated successfully', 
        data: createdSlots 
    })
  } catch (error) {
    console.error('Error setting availability:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mentorId = req.params.id
    
    const availability = await Availability.find({ mentorId, isActive: true }).sort({ dayOfWeek: 1, startTime: 1 })
    res.status(200).json({
        status: 'success',
        data: availability
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// Generate concrete slots for preview
export const previewAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const mentorId = req.params.id
        const weeks = parseInt(req.query.weeks as string) || 1
        
        const availability = await Availability.find({ mentorId, isActive: true })
        
        if (!availability.length) {
            res.status(200).json({ status: 'success', data: [] })
            return
        }

        const concreteSlots: any[] = []
        const today = new Date()
        // Start from today or tomorrow? Let's start from today.
        
        for (let i = 0; i < weeks * 7; i++) {
            const currentDate = new Date(today)
            currentDate.setDate(today.getDate() + i)
            const dayOfWeek = currentDate.getDay() // 0 = Sunday
            
            // Availability stores dayOfWeek (check if it matches 0-6 or 1-7 conventions)
            // Availability model: 0-6. Date.getDay(): 0-6 (Sun-Sat).
            // Usually 0=Sun. Let's assume consistency.
            
            const daysSlots = availability.filter(a => a.dayOfWeek === dayOfWeek)
            
            daysSlots.forEach(slot => {
                concreteSlots.push({
                    date: currentDate.toISOString().split('T')[0],
                    dayOfWeek,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    duration: slot.duration
                })
            })
        }
        
        res.status(200).json({
            status: 'success',
            data: concreteSlots
        })
    } catch (error) {
        console.error('Error generating preview:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}
