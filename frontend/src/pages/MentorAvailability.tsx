import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Calendar as CalendarIcon,
  X,
  Loader2,
} from 'lucide-react'
import moment from 'moment'
import 'moment/locale/es'
import { mentorsService } from '@/services/mentors.service'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/components/ui/Toast'

moment.locale('es')

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly'

interface AvailabilitySlot {
  _id: string
  date: string
  dayOfWeek: number
  startTime: string
  endTime: string
  duration: number
  recurrence: RecurrenceType
  recurrenceEndDate?: string
  isActive: boolean
}

interface NewSlotForm {
  date: string
  startTime: string
  recurrence: RecurrenceType
  recurrenceEndDate: string
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7:00 - 20:00

export default function MentorAvailability() {
  const { profile } = useAuthStore()
  const toast = useToast()

  const [currentDate, setCurrentDate] = useState(moment().startOf('week'))
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const duration = 45 // Duración fija de 45 minutos

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [newSlot, setNewSlot] = useState<NewSlotForm>({
    date: '',
    startTime: '09:00',
    recurrence: 'none',
    recurrenceEndDate: '',
  })

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [slotToDelete, setSlotToDelete] = useState<AvailabilitySlot | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  // El backend retorna _id desde Mongoose, no id
  const mentorId =
    (profile as { id?: string; _id?: string })?._id ||
    (profile as { id?: string; _id?: string })?.id

  useEffect(() => {
    if (mentorId) {
      fetchAvailability()
    } else if (profile) {
      // Si hay profile pero no mentorId, detener loading
      setIsLoading(false)
    }
  }, [mentorId, currentDate, profile])

  const fetchAvailability = async () => {
    if (!mentorId) return

    setIsLoading(true)
    try {
      const startDate = currentDate.format('YYYY-MM-DD')
      const endDate = currentDate.clone().add(6, 'days').format('YYYY-MM-DD')

      const response = await mentorsService.getMyAvailability(
        mentorId,
        startDate,
        endDate
      )
      setSlots(response.data)
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('Error al cargar la disponibilidad')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevWeek = () => {
    setCurrentDate(prev => prev.clone().subtract(1, 'week'))
  }

  const handleNextWeek = () => {
    setCurrentDate(prev => prev.clone().add(1, 'week'))
  }

  const handleToday = () => {
    setCurrentDate(moment().startOf('week'))
  }

  const handleDayClick = (date: moment.Moment) => {
    if (date.isBefore(moment(), 'day')) {
      toast.warning('No puedes agregar disponibilidad en fechas pasadas')
      return
    }

    setSelectedDate(date.format('YYYY-MM-DD'))
    setNewSlot({
      date: date.format('YYYY-MM-DD'),
      startTime: '09:00',
      recurrence: 'none',
      recurrenceEndDate: date.clone().add(3, 'months').format('YYYY-MM-DD'),
    })
    setShowModal(true)
  }

  const handleAddSlot = async () => {
    if (!mentorId || !newSlot.date || !newSlot.startTime) return

    setIsSaving(true)
    try {
      await mentorsService.addAvailability(
        mentorId,
        [
          {
            date: newSlot.date,
            startTime: newSlot.startTime,
            recurrence: newSlot.recurrence,
            recurrenceEndDate:
              newSlot.recurrence !== 'none'
                ? newSlot.recurrenceEndDate
                : undefined,
          },
        ],
        duration
      )

      toast.success('Disponibilidad agregada correctamente')
      setShowModal(false)
      fetchAvailability()
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      toast.error(
        axiosError?.response?.data?.message || 'Error al agregar disponibilidad'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSlot = (slot: AvailabilitySlot) => {
    setSlotToDelete(slot)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!mentorId || !slotToDelete) return

    setIsDeleting(true)
    try {
      await mentorsService.deleteAvailability(mentorId, slotToDelete._id)
      toast.success('Slot eliminado correctamente')
      setShowDeleteModal(false)
      setSlotToDelete(null)
      fetchAvailability()
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      toast.error(
        axiosError?.response?.data?.message || 'Error al eliminar slot'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // Generate days for the current week
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    currentDate.clone().add(i, 'days')
  )

  // Get slots for a specific day
  const getSlotsForDay = (date: moment.Moment) => {
    return slots.filter(slot => moment(slot.date).isSame(date, 'day'))
  }

  // Get slot position in the grid
  const getSlotStyle = (slot: AvailabilitySlot) => {
    const [startHour, startMin] = slot.startTime.split(':').map(Number)
    const startOffset = (startHour - 7) * 60 + startMin
    const height = slot.duration

    return {
      top: `${(startOffset / 60) * 4}rem`,
      height: `${(height / 60) * 4}rem`,
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Disponibilidad</h1>
        <p className="text-gray-600 mt-1">
          Configura tus horarios disponibles para que los estudiantes puedan
          agendar sesiones
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 text-sm font-medium text-purpura hover:bg-purple-50 rounded-lg transition"
            >
              Hoy
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="ml-4 text-lg font-semibold text-gray-900">
              {currentDate.format('MMMM YYYY')}
            </span>
          </div>

          {/* Duration info */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Duración: <strong>45 minutos</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-purpura" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Header */}
            <div className="grid grid-cols-8 border-b border-gray-200">
              <div className="p-3 text-center text-sm font-medium text-gray-500 border-r border-gray-200">
                <Clock className="w-4 h-4 mx-auto" />
              </div>
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={`p-3 text-center border-r border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-50 transition ${
                    day.isSame(moment(), 'day') ? 'bg-purple-50' : ''
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="text-xs font-medium text-gray-500 uppercase">
                    {day.format('ddd')}
                  </div>
                  <div
                    className={`text-lg font-semibold mt-1 ${
                      day.isSame(moment(), 'day')
                        ? 'text-purpura bg-purpura text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                        : day.isBefore(moment(), 'day')
                          ? 'text-gray-400'
                          : 'text-gray-900'
                    }`}
                  >
                    {day.format('D')}
                  </div>
                  {!day.isBefore(moment(), 'day') && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleDayClick(day)
                      }}
                      className="mt-2 p-1 rounded-full hover:bg-purple-100 transition text-purpura"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-8">
              {/* Time labels */}
              <div className="border-r border-gray-200">
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="h-16 border-b border-gray-100 px-2 py-1 text-xs text-gray-500 text-right"
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className="relative border-r border-gray-200 last:border-r-0"
                >
                  {/* Hour lines */}
                  {HOURS.map(hour => (
                    <div key={hour} className="h-16 border-b border-gray-100" />
                  ))}

                  {/* Slots - cada uno es independiente */}
                  {getSlotsForDay(day).map(slot => (
                    <div
                      key={slot._id}
                      className="absolute left-1 right-1 bg-emerald-100 border border-emerald-300 rounded-lg p-2 overflow-hidden cursor-pointer hover:bg-emerald-200 transition"
                      style={getSlotStyle(slot)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-800">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handleDeleteSlot(slot)
                          }}
                          className="p-1 rounded hover:bg-red-100 text-red-600 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-gray-400" />
          <span>Cada slot se elimina individualmente</span>
        </div>
      </div>

      {/* Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purpura" />
                Agregar Disponibilidad
              </h3>
              <button
                onClick={() => !isSaving && setShowModal(false)}
                disabled={isSaving}
                className="p-1 rounded-full hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <div className="text-lg font-semibold text-gray-900">
                  {moment(selectedDate).format('dddd, D [de] MMMM [de] YYYY')}
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de inicio
                </label>
                <select
                  value={newSlot.startTime}
                  onChange={e =>
                    setNewSlot({ ...newSlot, startTime: e.target.value })
                  }
                  disabled={isSaving}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purpura focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {HOURS.flatMap(hour =>
                    ['00', '30'].map(min => {
                      const time = `${String(hour).padStart(2, '0')}:${min}`
                      return (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      )
                    })
                  )}
                </select>
              </div>

              {/* Duration info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    Duración: <strong>{duration} minutos</strong>
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Termina a las{' '}
                  {moment(newSlot.startTime, 'HH:mm')
                    .add(duration, 'minutes')
                    .format('HH:mm')}
                </div>
              </div>

              {/* Recurrence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repetir
                </label>
                <select
                  value={newSlot.recurrence}
                  onChange={e =>
                    setNewSlot({
                      ...newSlot,
                      recurrence: e.target.value as RecurrenceType,
                    })
                  }
                  disabled={isSaving}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purpura focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="none">No repetir</option>
                  <option value="daily">Todos los días</option>
                  <option value="weekly">Cada semana (mismo día)</option>
                  <option value="monthly">Cada mes (mismo día)</option>
                </select>
              </div>

              {/* Recurrence End Date */}
              {newSlot.recurrence !== 'none' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repetir hasta
                  </label>
                  <input
                    type="date"
                    value={newSlot.recurrenceEndDate}
                    onChange={e =>
                      setNewSlot({
                        ...newSlot,
                        recurrenceEndDate: e.target.value,
                      })
                    }
                    min={moment(selectedDate)
                      .add(1, 'day')
                      .format('YYYY-MM-DD')}
                    disabled={isSaving}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purpura focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => !isSaving && setShowModal(false)}
                disabled={isSaving}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSlot}
                disabled={isSaving}
                className="px-4 py-2 bg-gradient-to-r from-purpura to-rosa text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  'Agregar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && slotToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Eliminar este horario?
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                {moment(slotToDelete.date).format('dddd, D [de] MMMM')}
              </p>
              <p className="text-sm font-medium text-gray-900 mb-4">
                {slotToDelete.startTime} - {slotToDelete.endTime}
              </p>
              <p className="text-xs text-gray-500 mb-6">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!isDeleting) {
                      setShowDeleteModal(false)
                      setSlotToDelete(null)
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Eliminando...
                    </span>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
