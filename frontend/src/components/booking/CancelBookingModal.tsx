import { useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import moment from 'moment-timezone'
import Modal, { ModalBody, ModalFooter } from '../ui/Modal'
import { getAvatarUrl } from '../../utils/avatar'
import {
  formatPrice,
  getHoursUntilSession,
  calculateRefundPolicy,
} from '../../utils/bookingHelpers'
import type { Booking } from '../../types/booking.types'
import { bookingsService } from '../../services/bookings.service'

interface CancelBookingModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking
  onCancelled: () => void
}

const CancelBookingModal = ({
  isOpen,
  onClose,
  booking,
  onCancelled,
}: CancelBookingModalProps) => {
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const hoursRemaining = getHoursUntilSession(booking.scheduledAt)
  const refundPolicy = calculateRefundPolicy(hoursRemaining)
  const refundAmount =
    (booking.totalAmount * refundPolicy.refundPercentage) / 100

  const mentorName = `${booking.mentorId.userId.firstName} ${booking.mentorId.userId.lastName}`

  const handleSubmit = async () => {
    setError(null)
    setIsLoading(true)

    try {
      await bookingsService.cancelBooking({
        bookingId: booking._id,
        reason: reason.trim() || undefined,
      })

      setIsSuccess(true)
    } catch (err: any) {
      console.error('Error cancelling booking:', err)
      setError(
        err.response?.data?.message ||
          'Error al cancelar la sesion. Por favor intenta de nuevo.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setReason('')
      setError(null)
      setIsSuccess(false)
      onClose()
    }
  }

  const handleSuccessClose = () => {
    onCancelled()
    handleClose()
  }

  // Success view
  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleSuccessClose} size="md">
        <ModalBody className="text-center py-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sesion Cancelada
          </h2>
          <p className="text-gray-600 mb-6">
            Tu sesion ha sido cancelada exitosamente.
          </p>
          {refundPolicy.refundPercentage > 0 && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Reembolso:</strong> {formatPrice(refundAmount)} (
                {refundPolicy.refundPercentage}%)
              </p>
              <p className="text-xs text-green-600 mt-1">
                El reembolso se procesara en los proximos dias
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="justify-center">
          <button
            onClick={handleSuccessClose}
            className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all"
          >
            Entendido
          </button>
        </ModalFooter>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cancelar Sesion"
      size="lg"
    >
      <ModalBody>
        {/* Warning */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">
              Estas a punto de cancelar esta sesion
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Esta accion no se puede deshacer.
            </p>
          </div>
        </div>

        {/* Session info */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
          <img
            src={getAvatarUrl(booking.mentorId.userId.avatar)}
            alt={mentorName}
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
          />
          <div>
            <h3 className="font-bold text-gray-900">{mentorName}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {moment(booking.scheduledAt).format('D [de] MMMM')}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {moment(booking.scheduledAt).format('HH:mm')}
              </div>
            </div>
          </div>
        </div>

        {/* Refund policy */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">
            Politica de Reembolso
          </h4>

          <div className="space-y-3">
            <div
              className={`p-3 rounded-lg border ${
                hoursRemaining >= 24
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">Mas de 24 horas de anticipacion</span>
                <span className="font-bold text-green-600">100%</span>
              </div>
            </div>

            <div
              className={`p-3 rounded-lg border ${
                hoursRemaining >= 12 && hoursRemaining < 24
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">Entre 12 y 24 horas</span>
                <span className="font-bold text-amber-600">50%</span>
              </div>
            </div>

            <div
              className={`p-3 rounded-lg border ${
                hoursRemaining < 12
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">Menos de 12 horas</span>
                <span className="font-bold text-red-600">0%</span>
              </div>
            </div>
          </div>

          {/* Current status */}
          <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <p className="text-sm text-purple-800">
              <strong>Tu situacion:</strong> Faltan{' '}
              <span className="font-bold">
                {Math.round(hoursRemaining)} horas
              </span>{' '}
              para tu sesion
            </p>
            <p className="text-lg font-bold text-purple-900 mt-2">
              Reembolso: {formatPrice(refundAmount)} (
              {refundPolicy.refundPercentage}%)
            </p>
          </div>
        </div>

        {/* Reason (optional) */}
        <div className="mb-6">
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Razon de cancelacion{' '}
            <span className="text-gray-400">(opcional)</span>
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Cuentanos por que necesitas cancelar..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
            rows={3}
            maxLength={500}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
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
          Volver
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Cancelando...
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5" />
              Confirmar Cancelacion
            </>
          )}
        </button>
      </ModalFooter>
    </Modal>
  )
}

export default CancelBookingModal
