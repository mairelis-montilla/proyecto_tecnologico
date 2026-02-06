import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  Loader2,
  CalendarX,
} from 'lucide-react'
import moment from 'moment-timezone'
import { mentorsService } from '../services/mentors.service'

interface Slot {
  date: string
  dayOfWeek: number
  startTime: string
  endTime: string
  startIso: string
  endIso: string
  duration: number
}

interface CalendarProps {
  mentorId: string
  onSelectSlot?: (slot: Slot) => void
}

const Calendar = ({ mentorId, onSelectSlot }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(moment())
  const [slots, setSlots] = useState<Slot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlotIso, setSelectedSlotIso] = useState<string | null>(null)

  const userTimezone = moment.tz.guess()

  useEffect(() => {
    fetchAvailability()
  }, [mentorId])

  const fetchAvailability = async () => {
    setIsLoading(true)
    try {
      const response = await mentorsService.getAvailabilityPreview(mentorId, 4)
      if (response.data) {
        setSlots(response.data)
      }
    } catch (err) {
      console.error('Error fetching availability:', err)
      setError('No se pudo cargar la disponibilidad')
    } finally {
      setIsLoading(false)
    }
  }

  const nextWeek = () => {
    setCurrentDate(prev => prev.clone().add(1, 'week'))
  }

  const prevWeek = () => {
    const newDate = currentDate.clone().subtract(1, 'week')
    if (newDate.isSameOrAfter(moment(), 'week')) {
      setCurrentDate(newDate)
    }
  }

  // Filter slots for the currently displayed week
  const startOfWeek = currentDate.clone().startOf('week')
  const endOfWeek = currentDate.clone().endOf('week')

  const weekSlots = slots.filter(slot => {
    const slotTime = moment(slot.startIso)
    return slotTime.isBetween(startOfWeek, endOfWeek, undefined, '[]')
  })

  // Group by day
  const days = []
  for (let i = 0; i < 7; i++) {
    const date = startOfWeek.clone().add(i, 'days')
    const dateStr = date.format('YYYY-MM-DD')

    const daySlots = weekSlots
      .filter(slot => {
        return moment(slot.startIso).format('YYYY-MM-DD') === dateStr
      })
      .sort((a, b) => moment(a.startIso).diff(moment(b.startIso)))

    days.push({
      date,
      slots: daySlots,
    })
  }

  const handleSelect = (slot: Slot) => {
    setSelectedSlotIso(slot.startIso)
    if (onSelectSlot) onSelectSlot(slot)
  }

  // Check if there are any slots in this week
  const hasAvailableSlots = weekSlots.length > 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-purple-600" />
          Disponibilidad
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            disabled={currentDate.isSame(moment(), 'week')}
            className="p-1 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
            {startOfWeek.format('D MMM')} - {endOfWeek.format('D MMM')}
          </span>
          <button
            onClick={nextWeek}
            className="p-1 rounded-full hover:bg-white transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1 justify-end">
          <Clock className="w-3 h-3" />
          Horarios en tu zona horaria:{' '}
          <span className="font-medium text-gray-700">{userTimezone}</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 text-sm">{error}</div>
        ) : !hasAvailableSlots ? (
          // Empty state - no availability this week
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <CalendarX className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-1">
              No hay horarios disponibles
            </p>
            <p className="text-sm text-gray-500">
              Prueba navegando a otra semana
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2 min-h-[200px]">
            {days.map((day, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="text-center mb-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase">
                    {day.date.format('ddd')}
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      day.date.isSame(moment(), 'day')
                        ? 'text-purple-600 bg-purple-50 rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                        : 'text-gray-900'
                    }`}
                  >
                    {day.date.format('D')}
                  </div>
                </div>

                <div className="space-y-2">
                  {day.slots.length > 0 ? (
                    day.slots.map(slot => {
                      const isActive = selectedSlotIso === slot.startIso
                      const slotLocalStart = moment(slot.startIso).format(
                        'HH:mm'
                      )

                      return (
                        <button
                          key={slot.startIso}
                          onClick={() => handleSelect(slot)}
                          className={`w-full py-2 px-1 text-xs font-medium rounded-lg transition-all border ${
                            isActive
                              ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100'
                          }`}
                        >
                          {slotLocalStart}
                        </button>
                      )
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-start pt-4">
                      <span className="w-1 h-1 bg-gray-200 rounded-full mb-1"></span>
                      <span className="w-1 h-1 bg-gray-200 rounded-full mb-1"></span>
                      <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        {!isLoading && !error && hasAvailableSlots && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-200"></div>
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-600 border border-purple-600"></div>
              <span>Seleccionado</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Calendar
