import { Response } from 'express'
import moment from 'moment-timezone'
import { Availability } from '../models/Availability.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { Booking } from '../models/Booking.model.js'
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
        
        const mentor = await Mentor.findById(mentorId)
        if (!mentor) {
             res.status(404).json({ message: 'Mentor not found' })
             return
        }

        const availability = await Availability.find({ mentorId, isActive: true })
        
        if (!availability.length) {
            res.status(200).json({ status: 'success', data: [] })
            return
        }

        // Get bookings for the next X weeks to filter out taken slots
        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + (weeks * 7) + 1) // +1 buffer
        
        const bookings = await Booking.find({
            mentorId,
            scheduledDate: { $gte: startDate, $lte: endDate },
            status: { $ne: 'cancelled' }
        })

        const concreteSlots: any[] = []
        const timezone = mentor.timezone || 'America/Lima'
        
        // Start from "now" in mentor's timezone
        const now = moment().tz(timezone)
        const today = now.clone().startOf('day')
        
        for (let i = 0; i < weeks * 7; i++) {
            const currentDate = today.clone().add(i, 'days')
            const dayOfWeek = currentDate.day() // 0 = Sunday
            
            const daysSlots = availability.filter(a => a.dayOfWeek === dayOfWeek)
            
            daysSlots.forEach(slot => {
                // Construct slot timestamp in mentor's timezone
                const [startHour, startMinute] = slot.startTime.split(':').map(Number)
                const slotStart = currentDate.clone().hour(startHour).minute(startMinute).second(0)
                
                // Skip if slot is in the past
                if (slotStart.isBefore(now)) return

                // Check for bookings
                // We check if there's a booking on the same day (formatted YYYY-MM-DD) and same start time
                // This assumes 1:1 slot mapping. For more complex overlaps, we'd compare ranges.
                const isBooked = bookings.some(booking => {
                    const bookingDate = moment(booking.scheduledDate).tz(timezone).format('YYYY-MM-DD')
                    const slotDate = slotStart.format('YYYY-MM-DD')
                    return bookingDate === slotDate && booking.startTime === slot.startTime
                })

                if (!isBooked) {
                    concreteSlots.push({
                        date: slotStart.format('YYYY-MM-DD'), // Local date string for reference
                        dayOfWeek,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        startIso: slotStart.toISOString(), // UTC ISO for frontend
                        endIso: slotStart.clone().add(slot.duration, 'minutes').toISOString(),
                        duration: slot.duration
                    })
                }
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

