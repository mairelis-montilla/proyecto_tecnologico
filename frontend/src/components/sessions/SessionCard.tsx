import { Calendar, Clock, Timer, AlertCircle, Hourglass } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import moment from 'moment-timezone'
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
  onApproveClick?: (booking: Booking) => void
  onRejectClick?: (booking: Booking) => void
}

const SessionCard = ({
  booking,
  onPayClick,
  onDetailsClick,
  onRateClick,
  onApproveClick,
  onRejectClick,
}: SessionCardProps) => {
  const { user } = useAuthStore()
  const isMentor =
    user?.id === booking.mentorId.userId._id || user?.role === 'mentor'

  const otherParty = isMentor
    ? booking.studentId.userId
    : booking.mentorId.userId
  const otherPartyName = `${otherParty.firstName} ${otherParty.lastName}`
  const otherPartyRole = isMentor
    ? 'Estudiante'
    : booking.mentorId.title || 'Mentor'

  const isUpcoming =
    booking.isWithin24Hours ?? isWithin24Hours(booking.scheduledAt)

  // Calcular tiempo restante para pagar
  const getPaymentDeadlineInfo = () => {
    if (!booking.paymentDeadline || booking.status !== 'pending_payment')
      return null
    const deadline = moment(booking.paymentDeadline)
    const now = moment()
    const minutesLeft = deadline.diff(now, 'minutes')
    if (minutesLeft <= 0) return { expired: true, text: 'Tiempo expirado' }
    return { expired: false, text: `${minutesLeft} min para pagar` }
  }

  const deadlineInfo = getPaymentDeadlineInfo()

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
            Esperando validacion del admin
          </span>
        )
        break
      case 'payment_validated':
        if (isMentor && onApproveClick && onRejectClick) {
          actions.push(
            <button
              key="approve"
              onClick={() => onApproveClick(booking)}
              className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              Aprobar
            </button>,
            <button
              key="reject"
              onClick={() => onRejectClick(booking)}
              className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors text-sm"
            >
              Rechazar
            </button>
          )
        } else {
          actions.push(
            <span
              key="waiting"
              className="px-4 py-2 bg-amber-50 text-amber-700 font-medium rounded-lg text-sm"
            >
              Pago validado - Esperando aprobacion del mentor
            </span>
          )
        }
        break
      // case 'confirmed':
      //   actions.push(
      //     <button
      //       key="details"
      //       onClick={() => onDetailsClick?.(booking)}
      //       className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
      //     >
      //       Ver Detalles
      //     </button>,
      //     <button
      //       key="cancel"
      //       onClick={() => onCancelClick?.(booking)}
      //       className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors text-sm"
      //     >
      //       Cancelar
      //     </button>
      //   )
      //   break
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
      case 'confirmed':
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

      {/* Payment deadline indicator */}
      {deadlineInfo && (
        <div
          className={`flex items-center gap-2 text-sm font-medium mb-4 pb-4 border-b ${
            deadlineInfo.expired
              ? 'text-red-600 border-red-100'
              : 'text-amber-600 border-amber-100'
          }`}
        >
          <Hourglass className="w-4 h-4" />
          {deadlineInfo.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        {/* User info (Mentor or Student) */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <img
            src={getAvatarUrl(otherParty.avatar)}
            alt={otherPartyName}
            className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
          />
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate">
              {otherPartyName}
            </h3>
            <p className="text-sm text-purple-600 truncate">{otherPartyRole}</p>
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
