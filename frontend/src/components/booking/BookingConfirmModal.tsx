import { useState } from 'react'
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import moment from 'moment-timezone'
import Modal, { ModalBody, ModalFooter } from '../ui/Modal'
import { getAvatarUrl } from '../../utils/avatar'
import { formatDuration, formatPrice } from '../../utils/bookingHelpers'
import type { TimeSlot, Booking } from '../../types/booking.types'
import type { Mentor } from '../../types/mentor.types'
import { bookingsService } from '../../services/bookings.service'

interface BookingConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  mentor: Mentor
  slot: TimeSlot
  onBookingCreated: (booking: Booking) => void
}

const BookingConfirmModal = ({
  isOpen,
  onClose,
  mentor,
  slot,
  onBookingCreated,
}: BookingConfirmModalProps) => {
  const [topic, setTopic] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalAmount = mentor.hourlyRate
  const fullName = `${mentor.userId.firstName} ${mentor.userId.lastName}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!topic.trim()) {
      setError('El tema de la sesion es obligatorio')
      return
    }

    setIsLoading(true)

    try {
      const response = await bookingsService.createBooking({
        mentorId: mentor._id,
        slotStartIso: slot.startIso,
        slotEndIso: slot.endIso,
        topic: topic.trim(),
        message: message.trim() || undefined,
      })

      onBookingCreated(response.data.booking)
    } catch (err: any) {
      console.error('Error creating booking:', err)
      setError(
        err.response?.data?.message ||
          'Error al crear la reserva. Por favor intenta de nuevo.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setTopic('')
      setMessage('')
      setError(null)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Confirmar Reserva"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          {/* Informacion del mentor */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
            <img
              src={getAvatarUrl(mentor.userId.avatar)}
              alt={fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
            />
            <div>
              <h3 className="font-bold text-gray-900">{fullName}</h3>
              <p className="text-sm text-purple-600">
                {mentor.title || 'Mentor Especialista'}
              </p>
            </div>
          </div>

          {/* Detalles del horario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <Calendar className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-purple-600 font-medium">Fecha</p>
                <p className="font-bold text-gray-900">
                  {moment(slot.startIso).format('dddd, D [de] MMMM')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <Clock className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-purple-600 font-medium">Horario</p>
                <p className="font-bold text-gray-900">
                  {moment(slot.startIso).format('HH:mm')} -{' '}
                  {moment(slot.endIso).format('HH:mm')}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            {/* Tema/Motivo */}
            <div>
              <label
                htmlFor="topic"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
              >
                <FileText className="w-4 h-4" />
                Tema de la sesion <span className="text-red-500">*</span>
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Ej: Necesito ayuda con derivadas e integrales para mi examen parcial..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
                rows={3}
                maxLength={500}
                required
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {topic.length}/500 caracteres
              </p>
            </div>

            {/* Mensaje adicional */}
            <div>
              <label
                htmlFor="message"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
              >
                <MessageSquare className="w-4 h-4" />
                Mensaje adicional{' '}
                <span className="text-gray-400">(opcional)</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Cualquier informacion adicional que quieras compartir con el mentor..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
                rows={2}
                maxLength={500}
              />
            </div>
          </div>

          {/* Resumen de costo */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              Resumen de la reserva
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Duracion</span>
                <span className="font-medium">
                  {formatDuration(slot.duration)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tarifa por hora</span>
                <span className="font-medium">
                  {formatPrice(mentor.hourlyRate)}
                </span>
              </div>
              <hr className="border-purple-200" />
              <div className="flex justify-between text-base">
                <span className="font-semibold text-gray-900">
                  Total a pagar
                </span>
                <span className="font-bold text-purple-600 text-lg">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                Confirmar y Pagar
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default BookingConfirmModal
