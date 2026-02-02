import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core'
import esLocale from '@fullcalendar/core/locales/es'
import { useState, useEffect } from 'react'
import { mentorsService } from '../services/mentors.service'
import { useAuthStore } from '../stores/auth.store'

interface AvailabilitySlot {
    _id?: string
    mentorId: string
    dayOfWeek: number
    startTime: string
    endTime: string
    duration: number
    isActive: boolean
}

interface PreviewSlot {
    date: string
    dayOfWeek: number
    startTime: string
    endTime: string
    startIso?: string
    endIso?: string
    duration: number
}

interface DayConfig {
    dayOfWeek: number
    dayName: string
    timeSlots: string[]
    isFullDaySelected: boolean
}

const DEFAULT_TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00'
]

const Calendar = () => {
    const { isAuthenticated } = useAuthStore()
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [events, setEvents] = useState<EventInput[]>([])
    const [slots, setSlots] = useState<AvailabilitySlot[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [duration] = useState<60>(60)
    const [showDaySelector, setShowDaySelector] = useState(false)
    const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number | null>(null) // Para modal de un solo día
    const [deleteConfirm, setDeleteConfirm] = useState<{ dayOfWeek: number; startTime: string } | null>(null) // Para modal de eliminar
    const [mentorId, setMentorId] = useState<string>('')

    const [daysConfig, setDaysConfig] = useState<DayConfig[]>([
        { dayOfWeek: 1, dayName: 'Lunes', timeSlots: [], isFullDaySelected: false },
        { dayOfWeek: 2, dayName: 'Martes', timeSlots: [], isFullDaySelected: false },
        { dayOfWeek: 3, dayName: 'Miércoles', timeSlots: [], isFullDaySelected: false },
        { dayOfWeek: 4, dayName: 'Jueves', timeSlots: [], isFullDaySelected: false },
        { dayOfWeek: 5, dayName: 'Viernes', timeSlots: [], isFullDaySelected: false },
        { dayOfWeek: 6, dayName: 'Sábado', timeSlots: [], isFullDaySelected: false },
        { dayOfWeek: 0, dayName: 'Domingo', timeSlots: [], isFullDaySelected: false },
    ])

    // Obtener el perfil del mentor para conseguir el mentorId correcto
    useEffect(() => {
        const fetchMentorProfile = async () => {
            try {
                setLoading(true)
                setError(null)

                // Llamar al endpoint que devuelve el perfil del mentor autenticado
                const response = await mentorsService.getMyProfile()

                if (response.data.status === 'success' && response.data.data.mentor) {
                    const mentor = response.data.data.mentor
                    console.log('Perfil de mentor obtenido:', mentor)
                    setMentorId(mentor._id)
                } else {
                    setError('No se pudo obtener el perfil de mentor')
                }
            } catch (err: any) {
                console.error('Error obteniendo perfil de mentor:', err)
                setError(err.response?.data?.message || 'Error al cargar perfil de mentor')
            } finally {
                setLoading(false)
            }
        }

        if (isAuthenticated) {
            fetchMentorProfile()
        }
    }, [isAuthenticated])

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (mentorId) {
            console.log('Cargando disponibilidad para mentor:', mentorId)
            fetchAvailability()
            fetchPreview()
        }
    }, [mentorId])

    useEffect(() => {
        if (slots.length > 0) {
            const newDaysConfig = daysConfig.map(day => {
                const daySlots = slots
                    .filter(slot => slot.dayOfWeek === day.dayOfWeek)
                    .map(slot => slot.startTime)

                return {
                    ...day,
                    timeSlots: daySlots,
                    isFullDaySelected: daySlots.length === DEFAULT_TIME_SLOTS.length
                }
            })
            setDaysConfig(newDaysConfig)
        }
    }, [slots])

    const fetchAvailability = async () => {
        try {
            console.log('Obteniendo disponibilidad...')
            const response = await mentorsService.getAvailability(mentorId)

            if (response.data.status === 'success') {
                console.log('Slots obtenidos:', response.data.data)
                setSlots(response.data.data)
            }
        } catch (err: any) {
            if (err.response?.status === 404) {
                console.log('No hay disponibilidad configurada')
                setSlots([])
            } else {
                console.error('Error obteniendo disponibilidad:', err.response?.data)
            }
        }
    }

    const fetchPreview = async (weeks: number = 4) => {
        try {
            setLoading(true)
            console.log(`Obteniendo preview de ${weeks} semanas...`)

            const response = await mentorsService.getAvailabilityPreview(mentorId, weeks)

            if (response.data.status === 'success') {
                console.log('Preview obtenido:', response.data.data.length, 'slots')

                const calendarEvents: EventInput[] = response.data.data.map((slot: PreviewSlot) => ({
                    title: `Disponible ${slot.duration}min`,
                    start: `${slot.date}T${slot.startTime}:00`,
                    end: `${slot.date}T${slot.endTime}:00`,
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    extendedProps: {
                        duration: slot.duration,
                        dayOfWeek: slot.dayOfWeek,
                        originalStartTime: slot.startTime
                    }
                }))

                setEvents(calendarEvents)
            }
        } catch (err: any) {
            if (err.response?.status === 404) {
                console.log('No hay preview disponible')
                setEvents([])
            }
        } finally {
            setLoading(false)
        }
    }

    const saveAvailability = async (newSlots: Array<{ dayOfWeek: number, startTime: string }>) => {
        try {
            setLoading(true)
            console.log('Guardando disponibilidad:', { duration, slots: newSlots })

            const response = await mentorsService.setAvailability(mentorId, {
                duration,
                slots: newSlots
            })

            if (response.data.status === 'success') {
                console.log('Disponibilidad guardada exitosamente')
                await fetchAvailability()
                await fetchPreview()
                alert('Disponibilidad actualizada exitosamente')
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message
            console.error('Error guardando:', err.response?.data)
            alert(`Error al guardar: ${errorMessage}`)
        } finally {
            setLoading(false)
        }
    }

    const handleDateSelect = (selectInfo: DateSelectArg) => {
        const calendarApi = selectInfo.view.calendar
        calendarApi.unselect()

        // Al hacer click en el calendario, abrir el modal para ese día específico
        const startDate = new Date(selectInfo.start)
        const dayOfWeek = startDate.getDay()
        setSelectedDayOfWeek(dayOfWeek)
    }

    const handleEventClick = (clickInfo: EventClickArg) => {
        const eventProps = clickInfo.event.extendedProps
        const dayOfWeek = eventProps.dayOfWeek
        const startTime = eventProps.originalStartTime

        // Abrir modal de confirmación en lugar de window.confirm
        setDeleteConfirm({ dayOfWeek, startTime })
    }

    const handleConfirmDelete = () => {
        if (!deleteConfirm) return

        const updatedSlots = slots
            .filter(s => !(s.dayOfWeek === deleteConfirm.dayOfWeek && s.startTime === deleteConfirm.startTime))
            .map(s => ({
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime
            }))

        saveAvailability(updatedSlots)
        setDeleteConfirm(null)
    }

    const handleToggleFullDay = (dayOfWeek: number) => {
        setDaysConfig(prev => prev.map(day => {
            if (day.dayOfWeek === dayOfWeek) {
                const newIsFullDay = !day.isFullDaySelected
                return {
                    ...day,
                    isFullDaySelected: newIsFullDay,
                    timeSlots: newIsFullDay ? [...DEFAULT_TIME_SLOTS] : []
                }
            }
            return day
        }))
    }

    const handleToggleTimeSlot = (dayOfWeek: number, timeSlot: string) => {
        setDaysConfig(prev => prev.map(day => {
            if (day.dayOfWeek === dayOfWeek) {
                const hasSlot = day.timeSlots.includes(timeSlot)
                const newTimeSlots = hasSlot
                    ? day.timeSlots.filter(t => t !== timeSlot)
                    : [...day.timeSlots, timeSlot].sort()

                return {
                    ...day,
                    timeSlots: newTimeSlots,
                    isFullDaySelected: newTimeSlots.length === DEFAULT_TIME_SLOTS.length
                }
            }
            return day
        }))
    }

    const handleSaveDayConfig = () => {
        const allSlots: Array<{ dayOfWeek: number, startTime: string }> = []

        daysConfig.forEach(day => {
            day.timeSlots.forEach(time => {
                allSlots.push({
                    dayOfWeek: day.dayOfWeek,
                    startTime: time
                })
            })
        })

        saveAvailability(allSlots)
        setShowDaySelector(false)
    }

    const getDayName = (dayOfWeek: number): string => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        return days[dayOfWeek]
    }

    const getTotalSlots = () => {
        return daysConfig.reduce((sum, day) => sum + day.timeSlots.length, 0)
    }

    if (!isAuthenticated) {
        return (
            <div className="p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h2 className="text-red-800 font-bold mb-2">Error de autenticación</h2>
                    <p className="text-red-600">No se encontró token de autenticación.</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Ir a Login
                    </button>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h2 className="text-red-800 font-bold mb-2">Error</h2>
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        )
    }

    if (loading && !mentorId) {
        return (
            <div className="p-4 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando información del mentor...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Define tu disponibilidad</h1>
                <p className="text-gray-600">
                    Configura los días y horarios en los que estarás disponible para mentoría
                </p>
            </div>

            <div className="mb-6 flex gap-4 flex-wrap">
                <button
                    onClick={() => setShowDaySelector(true)}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
                >
                    Configurar por día
                </button>
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 flex items-center gap-2">
                    <span className="text-purple-800 font-semibold">{getTotalSlots()}</span>
                    <span className="text-purple-600">horarios configurados</span>
                </div>
            </div>

            {loading && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700">Cargando...</p>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView={isMobile ? 'dayGridWeek' : 'dayGridMonth'}
                    locale={esLocale}
                    events={events}
                    height="auto"
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    headerToolbar={{
                        left: 'title',
                        center: '',
                        right: 'today prev,next'
                    }}
                />
            </div>

            {/* Modal para configurar UN día específico (al hacer click en el calendario) */}
            {selectedDayOfWeek !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="border-b border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                Configurar {getDayName(selectedDayOfWeek)}
                            </h2>
                            <p className="text-gray-600 mt-1 text-sm">
                                Selecciona los horarios disponibles para todos los {getDayName(selectedDayOfWeek).toLowerCase()}
                            </p>
                        </div>

                        <div className="p-6">
                            {(() => {
                                const dayConfig = daysConfig.find(d => d.dayOfWeek === selectedDayOfWeek)
                                if (!dayConfig) return null
                                return (
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm text-gray-500">
                                                {dayConfig.timeSlots.length} horario{dayConfig.timeSlots.length !== 1 ? 's' : ''} seleccionado{dayConfig.timeSlots.length !== 1 ? 's' : ''}
                                            </span>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={dayConfig.isFullDaySelected}
                                                    onChange={() => handleToggleFullDay(selectedDayOfWeek)}
                                                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    Todo el día
                                                </span>
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {DEFAULT_TIME_SLOTS.map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => handleToggleTimeSlot(selectedDayOfWeek, time)}
                                                    className={`
                                                        px-3 py-2 rounded-md text-sm font-medium transition-all
                                                        ${dayConfig.timeSlots.includes(time)
                                                            ? 'bg-purple-600 text-white shadow-sm'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }
                                                    `}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )
                            })()}
                        </div>

                        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedDayOfWeek(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    handleSaveDayConfig()
                                    setSelectedDayOfWeek(null)
                                }}
                                disabled={loading}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {loading ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para configurar TODA la semana */}
            {showDaySelector && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
                            <h2 className="text-2xl font-bold text-gray-800">
                                Configurar disponibilidad semanal
                            </h2>
                            <p className="text-gray-600 mt-1">
                                Selecciona días completos o horarios específicos
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {daysConfig.map((day) => (
                                <div key={day.dayOfWeek} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {day.dayName}
                                            </h3>
                                            <span className="text-sm text-gray-500">
                                                {day.timeSlots.length} horario{day.timeSlots.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={day.isFullDaySelected}
                                                onChange={() => handleToggleFullDay(day.dayOfWeek)}
                                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                                Todo el día
                                            </span>
                                        </label>
                                    </div>

                                    <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                        {DEFAULT_TIME_SLOTS.map((time) => (
                                            <button
                                                key={time}
                                                onClick={() => handleToggleTimeSlot(day.dayOfWeek, time)}
                                                className={`
                                                    px-3 py-2 rounded-md text-sm font-medium transition-all
                                                    ${day.timeSlots.includes(time)
                                                        ? 'bg-purple-600 text-white shadow-sm'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }
                                                `}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-between items-center z-10">
                            <div className="text-sm text-gray-600">
                                Total: <span className="font-semibold text-gray-800">{getTotalSlots()}</span> horarios seleccionados
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDaySelector(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveDayConfig}
                                    disabled={loading}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {loading ? 'Guardando...' : 'Guardar disponibilidad'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación para eliminar */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                                Eliminar disponibilidad
                            </h3>
                            <p className="text-gray-600 text-center text-sm">
                                ¿Eliminar la disponibilidad de <strong>{getDayName(deleteConfirm.dayOfWeek)}</strong> a las <strong>{deleteConfirm.startTime}</strong>?
                            </p>
                            <p className="text-gray-500 text-center text-xs mt-2">
                                Esto eliminará este horario de todos los {getDayName(deleteConfirm.dayOfWeek).toLowerCase()}.
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end rounded-b-lg">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Calendar