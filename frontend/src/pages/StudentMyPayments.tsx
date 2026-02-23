import { useState, useEffect, useCallback } from 'react'
import {
  Loader2,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { paymentService } from '../services/payment.service'
import { bookingsService } from '../services/bookings.service'
import FileUpload from '../components/ui/FileUpload'
import type {
  StudentPayment,
  PaymentStatus,
  StudentPaymentsFilter,
} from '../types/payment.types'
import type { PaymentMethod } from '../types/booking.types'

// ─── helpers ─────────────────────────────────────────────
const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending_proof: 'Sin comprobante',
  pending_validation: 'En revisión',
  validated: 'Aprobado',
  rejected: 'Rechazado',
  refunded: 'Reembolsado',
}

const STATUS_COLORS: Record<PaymentStatus, string> = {
  pending_proof: 'bg-gray-100 text-gray-700',
  pending_validation: 'bg-yellow-100 text-yellow-700',
  validated: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  refunded: 'bg-blue-100 text-blue-700',
}

const STATUS_ICONS: Record<PaymentStatus, JSX.Element> = {
  pending_proof: <Clock className="w-3.5 h-3.5" />,
  pending_validation: <RefreshCw className="w-3.5 h-3.5" />,
  validated: <CheckCircle className="w-3.5 h-3.5" />,
  rejected: <AlertCircle className="w-3.5 h-3.5" />,
  refunded: <RefreshCw className="w-3.5 h-3.5" />,
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const formatCurrency = (amount: number) => `S/. ${amount.toFixed(2)}`

const METHOD_LABELS: Record<string, string> = {
  yape: 'Yape',
  plin: 'Plin',
  transfer: 'Transferencia',
  cash: 'Efectivo',
}

const TABS: { key: PaymentStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending_validation', label: 'En revisión' },
  { key: 'validated', label: 'Aprobados' },
  { key: 'rejected', label: 'Rechazados' },
]

const PERIOD_OPTIONS = [
  { value: '', label: 'Todo el tiempo' },
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 3 meses' },
]

// ─── Payment detail modal ─────────────────────────────────
function PaymentDetailModal({
  payment,
  onClose,
  onResubmit,
}: {
  payment: StudentPayment
  onClose: () => void
  onResubmit: () => void
}) {
  const booking = payment.bookingId
  const mentor = booking?.mentorId

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">Detalle del pago</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Estado */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[payment.status]}`}
            >
              {STATUS_ICONS[payment.status]}
              {STATUS_LABELS[payment.status]}
            </span>
          </div>

          {/* Monto */}
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Monto pagado</p>
            <p className="text-3xl font-bold text-purple-700">
              {formatCurrency(payment.amount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Método:{' '}
              {METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
            </p>
          </div>

          {/* Sesión */}
          {booking && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Sesión
              </p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                <p className="text-sm font-medium text-gray-900">
                  {booking.topic}
                </p>
                {mentor?.userId && (
                  <p className="text-sm text-gray-600">
                    Mentor: {mentor.userId.firstName} {mentor.userId.lastName}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {formatDate(booking.scheduledAt)} · {booking.duration} min
                </p>
              </div>
            </div>
          )}

          {/* Comprobante */}
          {payment.proofImage && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Comprobante
              </p>
              {payment.proofImage.toLowerCase().endsWith('.pdf') ? (
                <a
                  href={payment.proofImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-600 hover:underline text-sm"
                >
                  <Eye className="w-4 h-4" /> Ver PDF
                </a>
              ) : (
                <img
                  src={payment.proofImage}
                  alt="Comprobante"
                  className="w-full rounded-lg border border-gray-200 max-h-48 object-contain cursor-pointer"
                  onClick={() => window.open(payment.proofImage, '_blank')}
                />
              )}
              {payment.proofUploadedAt && (
                <p className="text-xs text-gray-400">
                  Subido el {formatDate(payment.proofUploadedAt)}
                </p>
              )}
            </div>
          )}

          {/* Motivo de rechazo */}
          {payment.status === 'rejected' && payment.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-700 mb-1">
                Motivo de rechazo
              </p>
              <p className="text-sm text-red-600">{payment.rejectionReason}</p>
            </div>
          )}

          {/* Fecha de aprobación */}
          {payment.validatedAt && (
            <p className="text-xs text-gray-400">
              Aprobado el {formatDate(payment.validatedAt)}
            </p>
          )}

          <p className="text-xs text-gray-400">
            Creado el {formatDate(payment.createdAt)}
          </p>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex gap-3">
          {payment.status === 'rejected' && (
            <button
              onClick={() => {
                onClose()
                onResubmit()
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
            >
              <Upload className="w-4 h-4" />
              Resubir Comprobante
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Resubmit proof modal ─────────────────────────────────
function ResubmitModal({
  payment,
  onClose,
  onSuccess,
}: {
  payment: StudentPayment
  onClose: () => void
  onSuccess: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [amount, setAmount] = useState(payment.amount.toString())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Por favor sube el comprobante')
      return
    }
    if (!method) {
      setError('Por favor selecciona el método de pago')
      return
    }
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Monto inválido')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await bookingsService.uploadPaymentProof({
        bookingId: payment.bookingId._id,
        paymentMethod: method as PaymentMethod,
        amountPaid: amountNum,
        proofImage: file,
      })
      setDone(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al subir el comprobante')
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Comprobante enviado
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Tu comprobante está en revisión.
          </p>
          <button
            onClick={() => {
              onSuccess()
            }}
            className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            Aceptar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            Resubir Comprobante
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['yape', 'plin', 'transferencia'] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    method === m
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto pagado (S/.)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Comprobante */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprobante de pago
            </label>
            <FileUpload onFileSelect={setFile} />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isLoading ? 'Subiendo...' : 'Enviar comprobante'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────
export default function StudentMyPayments() {
  const [activeTab, setActiveTab] = useState<PaymentStatus | 'all'>('all')
  const [period, setPeriod] = useState('')
  const [payments, setPayments] = useState<StudentPayment[]>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<StudentPayment | null>(null)
  const [resubmitPayment, setResubmitPayment] = useState<StudentPayment | null>(
    null
  )

  const fetchPayments = useCallback(
    async (page = 1) => {
      setIsLoading(true)
      setError(null)
      try {
        const params: StudentPaymentsFilter = { page, limit: 10 }
        if (activeTab !== 'all') params.status = activeTab
        if (period) {
          const days = parseInt(period)
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - days)
          params.startDate = startDate.toISOString()
        }
        const result = await paymentService.getMyPayments(params)
        setPayments(result.data.payments)
        setPagination(result.pagination as typeof pagination)
      } catch {
        setError('Error al cargar los pagos')
      } finally {
        setIsLoading(false)
      }
    },
    [activeTab, period]
  )

  useEffect(() => {
    fetchPayments(1)
  }, [fetchPayments])

  const handleResubmitSuccess = () => {
    setResubmitPayment(null)
    fetchPayments(1)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-purple-600" />
          Mis Pagos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Historial y estado de todos tus pagos
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Tabs de estado */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filtro de período */}
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          {PERIOD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-500">No tienes pagos</p>
          <p className="text-sm mt-1">
            Aquí aparecerán tus pagos cuando reserves sesiones
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(payment => {
            const booking = payment.bookingId
            const mentor = booking?.mentorId
            const mentorUser = mentor?.userId

            return (
              <div
                key={payment._id}
                onClick={() => setSelected(payment)}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Info izquierda */}
                  <div className="flex-1 min-w-0">
                    {/* Mentor avatar + nombre */}
                    <div className="flex items-center gap-2 mb-2">
                      {mentorUser?.avatar ? (
                        <img
                          src={mentorUser.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-700 text-xs font-bold">
                            {mentorUser?.firstName?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {mentorUser
                            ? `${mentorUser.firstName} ${mentorUser.lastName}`
                            : 'Mentor'}
                        </p>
                        {mentor?.title && (
                          <p className="text-xs text-gray-500 truncate">
                            {mentor.title}
                          </p>
                        )}
                      </div>
                    </div>

                    {booking?.topic && (
                      <p className="text-sm text-gray-700 truncate mb-1">
                        {booking.topic}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{formatDate(payment.createdAt)}</span>
                      {booking?.scheduledAt && (
                        <span>Sesión: {formatDate(booking.scheduledAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Info derecha */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-base font-bold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[payment.status]}`}
                    >
                      {STATUS_ICONS[payment.status]}
                      {STATUS_LABELS[payment.status]}
                    </span>
                    {payment.status === 'rejected' && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setResubmitPayment(payment)
                        }}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        Resubir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => fetchPayments(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage || isLoading}
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {pagination.currentPage} de {pagination.totalPages}
            <span className="ml-2 text-gray-400">
              ({pagination.totalItems} pagos)
            </span>
          </span>
          <button
            onClick={() => fetchPayments(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage || isLoading}
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 text-sm"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modales */}
      {selected && !resubmitPayment && (
        <PaymentDetailModal
          payment={selected}
          onClose={() => setSelected(null)}
          onResubmit={() => setResubmitPayment(selected)}
        />
      )}
      {resubmitPayment && (
        <ResubmitModal
          payment={resubmitPayment}
          onClose={() => setResubmitPayment(null)}
          onSuccess={handleResubmitSuccess}
        />
      )}
    </div>
  )
}
