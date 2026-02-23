import { useState, useEffect, useCallback } from 'react'
import {
  Loader2,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { mentorsService } from '../services/mentors.service'
import type {
  MentorEarning,
  EarningsSummary,
  PaymentStatus,
} from '../types/payment.types'

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

const formatCurrency = (amount: number) => `S/. ${amount.toFixed(2)}`

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const PERIODS = [
  { key: 'all', label: 'Todo' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year', label: 'Año' },
] as const

type Period = (typeof PERIODS)[number]['key']

// ─── Main page ────────────────────────────────────────────
export default function MentorEarnings() {
  const [period, setPeriod] = useState<Period>('month')
  const [earnings, setEarnings] = useState<MentorEarning[]>([])
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    currentMonth: 0,
    pendingAmount: 0,
    pendingCount: 0,
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEarnings = useCallback(
    async (page = 1) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await mentorsService.getMyEarnings({
          period,
          page,
          limit: 10,
        })
        setSummary(result.data.summary)
        setEarnings(result.data.earnings)
        setPagination(result.pagination)
      } catch {
        setError('Error al cargar los ingresos')
      } finally {
        setIsLoading(false)
      }
    },
    [period]
  )

  useEffect(() => {
    fetchEarnings(1)
  }, [fetchEarnings])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          Mis Ingresos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Resumen de tus ganancias como mentor
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Total ganado */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Total ganado</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary.totalEarnings)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Todos los tiempos</p>
        </div>

        {/* Mes actual */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Mes actual</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary.currentMonth)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Este mes</p>
        </div>

        {/* Pendientes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Pendientes</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary.pendingAmount)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {summary.pendingCount} pago(s) en revisión
          </p>
        </div>
      </div>

      {/* Filtro de período + título lista */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Transacciones</h2>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p.key
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Lista de transacciones */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : earnings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-500">Sin transacciones</p>
          <p className="text-sm mt-1">Aquí aparecerán tus pagos recibidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {earnings.map(earning => {
            const booking = earning.bookingId
            const studentUser = booking?.studentId?.userId

            return (
              <div
                key={earning._id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Info izquierda */}
                  <div className="flex-1 min-w-0">
                    {/* Estudiante */}
                    <div className="flex items-center gap-2 mb-2">
                      {studentUser?.avatar ? (
                        <img
                          src={studentUser.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-700 text-xs font-bold">
                            {studentUser?.firstName?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {studentUser
                          ? `${studentUser.firstName} ${studentUser.lastName}`
                          : 'Estudiante'}
                      </p>
                    </div>

                    {booking?.topic && (
                      <p className="text-sm text-gray-700 truncate mb-1">
                        {booking.topic}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{formatDate(earning.createdAt)}</span>
                      {booking?.scheduledAt && (
                        <span>Sesión: {formatDate(booking.scheduledAt)}</span>
                      )}
                      {booking?.duration && <span>{booking.duration} min</span>}
                    </div>
                  </div>

                  {/* Info derecha */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {/* Mi ganancia (90%) */}
                    <div className="text-right">
                      <p className="text-base font-bold text-green-700">
                        {formatCurrency(earning.mentorEarnings)}
                      </p>
                      <p className="text-xs text-gray-400">
                        de {formatCurrency(earning.amount)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[earning.status]}`}
                    >
                      {STATUS_ICONS[earning.status]}
                      {STATUS_LABELS[earning.status]}
                    </span>
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
            onClick={() => fetchEarnings(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage || isLoading}
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {pagination.currentPage} de {pagination.totalPages}
            <span className="ml-2 text-gray-400">
              ({pagination.totalItems} registros)
            </span>
          </span>
          <button
            onClick={() => fetchEarnings(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage || isLoading}
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 text-sm"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
