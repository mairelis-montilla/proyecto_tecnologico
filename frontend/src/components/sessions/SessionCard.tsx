import { Calendar, Clock, Timer, AlertCircle } from 'lucide-react'
import { getAvatarUrl } from '../../utils/avatar'
import {
  formatSessionDate,
  formatSessionTime,
  formatDuration,
  formatPrice,
  isWithin24Hours,
} from '../../utils/bookingHelpers'
import StatusBadge from '../ui/StatusBadge'
import type { Booking, BookingStatus } from '../../types/booking.types'

interface SessionCardProps {
  booking: Booking
  onPayClick?: (booking: Booking) => void
  onCancelClick?: (booking: Booking) => void
  onDetailsClick?: (booking: Booking) => void
  onRateClick?: (booking: Booking) => void
}

const SessionCard = ({
  booking,
  onPayClick,
  onCancelClick,
  onDetailsClick,
  onRateClick,
}: SessionCardProps) => {
  const mentorName = `${booking.mentorId.userId.firstName} ${booking.mentorId.userId.lastName}`
  const isUpcoming = isWithin24Hours(booking.scheduledAt)

  // Determine which actions to show based on status
  const getActions = (status: BookingStatus) => {
    const actions: React.ReactNode[] = []

    switch (status) {
      case 'pending_payment':
        actions.push(
          <button
            key="pay"
            onClick={() => onPayClick?.(booking)}
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            Subir Comprobante
          </button>
        )
        break
      case 'payment_uploaded':
        actions.push(
          <span
            key="waiting"
            className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg text-sm"
          >
            Esperando validacion
          </span>
        )
        break
      case 'confirmed':
        actions.push(
          <button
            key="details"
            onClick={() => onDetailsClick?.(booking)}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Ver Detalles
          </button>,
          <button
            key="cancel"
            onClick={() => onCancelClick?.(booking)}
            className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors text-sm"
          >
            Cancelar
          </button>
        )
        break
      case 'completed':
        actions.push(
          <button
            key="rate"
            onClick={() => onRateClick?.(booking)}
            className="px-4 py-2 bg-amber-50 text-amber-700 font-medium rounded-lg hover:bg-amber-100 transition-colors text-sm"
          >
            Calificar
          </button>,
          <button
            key="details"
            onClick={() => onDetailsClick?.(booking)}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Ver Detalles
          </button>
        )
        break
      case 'cancelled':
      case 'refunded':
        actions.push(
          <button
            key="details"
            onClick={() => onDetailsClick?.(booking)}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Ver Detalles
          </button>
        )
        break
    }

    return actions
  }

  return (
    <div
      className={`
        bg-white rounded-2xl border p-5 transition-all
        ${
          isUpcoming && booking.status === 'confirmed'
            ? 'border-purple-300 ring-2 ring-purple-100'
            : 'border-gray-100 hover:border-gray-200'
        }
      `}
    >
      {/* Upcoming indicator */}
      {isUpcoming && booking.status === 'confirmed' && (
        <div className="flex items-center gap-2 text-purple-600 text-sm font-medium mb-4 pb-4 border-b border-purple-100">
          <AlertCircle className="w-4 h-4" />
          Sesion en las proximas 24 horas
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Mentor info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <img
            src={getAvatarUrl(booking.mentorId.userId.avatar)}
            alt={mentorName}
            className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
          />
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{mentorName}</h3>
            <p className="text-sm text-purple-600 truncate">
              {booking.mentorId.title || 'Mentor'}
            </p>
            <p className="text-sm text-gray-500 truncate mt-1">
              Tema: {booking.topic}
            </p>
          </div>
        </div>

        {/* Session details */}
        <div className="flex flex-col sm:items-end gap-2">
          <StatusBadge status={booking.status} size="sm" />

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatSessionDate(booking.scheduledAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatSessionTime(booking.scheduledAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Timer className="w-4 h-4" />
              <span>{formatDuration(booking.duration)}</span>
            </div>
          </div>

          <div className="text-lg font-bold text-gray-900">
            {formatPrice(booking.totalAmount)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
        {getActions(booking.status)}
      </div>
    </div>
  )
}

export default SessionCard
