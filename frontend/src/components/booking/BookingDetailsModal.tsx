import {
  Calendar,
  Clock,
  Timer,
  User,
  FileText,
  MessageSquare,
  CreditCard,
  Image,
} from 'lucide-react'
import moment from 'moment-timezone'
import Modal, { ModalBody, ModalFooter } from '../ui/Modal'
import StatusBadge from '../ui/StatusBadge'
import { getAvatarUrl } from '../../utils/avatar'
import {
  formatSessionDate,
  formatSessionTime,
  formatDuration,
  formatPrice,
} from '../../utils/bookingHelpers'
import type { Booking } from '../../types/booking.types'

interface BookingDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking
}

const paymentMethodLabels: Record<string, string> = {
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia Bancaria',
}

const BookingDetailsModal = ({
  isOpen,
  onClose,
  booking,
}: BookingDetailsModalProps) => {
  const mentorName = `${booking.mentorId.userId.firstName} ${booking.mentorId.userId.lastName}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles de la Sesion"
      size="lg"
    >
      <ModalBody>
        {/* Status */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-gray-500">Estado de la sesion</span>
          <StatusBadge status={booking.status} />
        </div>

        {/* Mentor info */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
          <img
            src={getAvatarUrl(booking.mentorId.userId.avatar)}
            alt={mentorName}
            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
          />
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{mentorName}</h3>
            <p className="text-purple-600">
              {booking.mentorId.title || 'Mentor'}
            </p>
          </div>
        </div>

        {/* Session details */}
        <div className="space-y-4 mb-6">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            Detalles de la Sesion
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-xs text-purple-600 font-medium mb-1">Fecha</p>
              <p className="font-bold text-gray-900">
                {formatSessionDate(booking.scheduledAt)}
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-xs text-purple-600 font-medium mb-1">Hora</p>
              <p className="font-bold text-gray-900">
                {formatSessionTime(booking.scheduledAt)}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                <Timer className="w-3 h-3" />
                Duracion
              </p>
              <p className="font-bold text-gray-900">
                {formatDuration(booking.duration)}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">
                Total pagado
              </p>
              <p className="font-bold text-gray-900 text-lg">
                {formatPrice(booking.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Topic */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-purple-600" />
            Tema de la Sesion
          </h4>
          <p className="text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
            {booking.topic}
          </p>
        </div>

        {/* Message */}
        {booking.message && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              Mensaje Adicional
            </h4>
            <p className="text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
              {booking.message}
            </p>
          </div>
        )}

        {/* Payment proof */}
        {booking.paymentProof && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-purple-600" />
              Comprobante de Pago
            </h4>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Metodo de pago</span>
                <span className="font-medium">
                  {paymentMethodLabels[booking.paymentProof.method] ||
                    booking.paymentProof.method}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Monto pagado</span>
                <span className="font-medium">
                  {formatPrice(booking.paymentProof.amountPaid)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Fecha de pago</span>
                <span className="font-medium">
                  {moment(booking.paymentProof.uploadedAt).format(
                    'D [de] MMMM [a las] HH:mm'
                  )}
                </span>
              </div>
              {booking.paymentProof.imageUrl && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <a
                    href={booking.paymentProof.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    <Image className="w-4 h-4" />
                    Ver comprobante
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cancellation info */}
        {booking.cancellation && (
          <div className="mb-6">
            <h4 className="font-semibold text-red-600 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" />
              Informacion de Cancelacion
            </h4>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-red-600">
                  Fecha de cancelacion
                </span>
                <span className="font-medium text-red-800">
                  {moment(booking.cancellation.cancelledAt).format(
                    'D [de] MMMM [a las] HH:mm'
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-red-600">Cancelado por</span>
                <span className="font-medium text-red-800 capitalize">
                  {booking.cancellation.cancelledBy}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600">Reembolso</span>
                <span className="font-medium text-red-800">
                  {booking.cancellation.refundPercentage}%
                </span>
              </div>
              {booking.cancellation.reason && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm text-red-600 mb-1">Razon:</p>
                  <p className="text-red-800">{booking.cancellation.reason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Created date */}
        <div className="text-xs text-gray-400 text-center">
          Reserva creada el{' '}
          {moment(booking.createdAt).format(
            'D [de] MMMM [de] YYYY [a las] HH:mm'
          )}
        </div>
      </ModalBody>

      <ModalFooter className="justify-center">
        <button
          onClick={onClose}
          className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all"
        >
          Cerrar
        </button>
      </ModalFooter>
    </Modal>
  )
}

export default BookingDetailsModal
