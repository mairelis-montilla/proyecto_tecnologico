import { Calendar, Clock, User, FileText, MessageSquare, DollarSign } from 'lucide-react'
import moment from 'moment-timezone'
import { getAvatarUrl } from '../../utils/avatar'
import { formatSessionDate, formatSessionTime, formatDuration, formatPrice } from '../../utils/bookingHelpers'
import StatusBadge from '../ui/StatusBadge'
import type { Booking } from '../../types/booking.types'

interface SessionRequestCardProps {
    booking: Booking
    onApprove?: (bookingId: string) => void
    onReject?: (bookingId: string) => void
    onViewDetails?: (booking: Booking) => void
    onCancel?: () => void
}

const SessionRequestCard = ({
    booking,
    onApprove,
    onReject,
    onViewDetails,
    onCancel,
}: SessionRequestCardProps) => {
    const student = booking.studentId as any
    const user = student?.userId
    const studentName = user ? `${user.firstName} ${user.lastName}` : 'Estudiante Desconocido'

    // Check if it is within 24 hours
    const isWithin24Hours = booking.isWithin24Hours

    return (
        <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all p-6">
            {/* Header con estudiante y estado */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <img
                        src={getAvatarUrl(user?.avatar)}
                        alt={studentName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-purple-100"
                    />
                    <div>
                        <h3 className="font-bold text-gray-900">{studentName}</h3>
                        <p className="text-sm text-gray-500">
                            Solicitud #{booking._id.slice(-6)}
                        </p>
                    </div>
                </div>
                <StatusBadge status={booking.status} />
            </div>

            {/* Información de la sesión */}
            <div className="space-y-3 mb-4">
                {/* Fecha y hora */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700">{formatSessionDate(booking.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700">{formatSessionTime(booking.scheduledAt)}</span>
                    </div>
                </div>

                {/* Tema */}
                <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Tema:</p>
                        <p className="text-sm text-gray-900 font-medium line-clamp-2">
                            {booking.topic}
                        </p>
                    </div>
                </div>

                {/* Mensaje adicional */}
                {booking.message && (
                    <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Mensaje:</p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                                {booking.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Monto */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Total</span>
                    <span className="text-lg font-bold text-purple-600">
                        {formatPrice(booking.totalAmount)}
                    </span>
                </div>
            </div>

            {/* Alerta si es dentro de 24 horas */}
            {isWithin24Hours && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 font-medium">
                        ⚠️ Sesión programada en menos de 24 horas
                    </p>
                </div>
            )}

            {/* Comprobante de pago */}
            {booking.paymentProof && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-800 font-medium mb-2">
                        ✓ Comprobante de pago recibido
                    </p>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-green-700">
                            {booking.paymentProof.method.toUpperCase()}
                        </span>
                        <span className="text-green-700">
                            {formatPrice(booking.paymentProof.amountPaid)}
                        </span>
                    </div>
                </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-2">
                {/* Botón ver detalles siempre visible */}
                <button
                    onClick={() => onViewDetails?.(booking)}
                    className="flex-1 px-4 py-2.5 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                    Ver Detalles
                </button>

                {/* Botones aprobar/rechazar solo si se pasan las funciones */}
                {onApprove && onReject && (
                    <>
                        <button
                            onClick={() => onReject(booking._id)}
                            className="flex-1 px-4 py-2.5 text-red-600 font-medium rounded-lg border border-red-300 hover:bg-red-50 transition-colors"
                        >
                            Rechazar
                        </button>
                        <button
                            onClick={() => onApprove(booking._id)}
                            className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all shadow-sm"
                        >
                            Aprobar
                        </button>
                    </>
                )}

                {/* Botón cancelar si se pasa la función */}
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 text-red-600 font-medium rounded-lg border border-red-300 hover:bg-red-50 transition-colors"
                    >
                        Cancelar
                    </button>
                )}
            </div>
        </div>
    )
}

export default SessionRequestCard