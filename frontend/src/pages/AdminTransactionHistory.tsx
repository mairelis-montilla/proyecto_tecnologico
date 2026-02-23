/**
 * AdminTransactionHistory.tsx
 *
 * Historial completo de transacciones con:
 * - Tabla paginada con todos los pagos
 * - Filtros: fecha, estado, método de pago
 * - Búsqueda por nombre de usuario
 * - Exportar a CSV
 * - Cards de resumen: total recaudado, pendientes, rechazados
 * - Ver detalle de cada transacción
 *
 * Endpoints:
 *   GET /api/admin/payments         → historial con filtros
 *   GET /api/admin/payments/summary → resumen financiero
 *   GET /api/admin/payments/export  → exportar CSV
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search,
  Loader2,
  Download,
  DollarSign,
  Clock,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import {
  paymentAdminService,
  paymentSummaryService,
  PaymentsSummary,
} from '../services/admin.service'
import type { AdminPayment, Pagination } from '../types/payment.types'
import { api } from '../services/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const paymentStatusLabels: Record<string, string> = {
  pending_proof: 'Sin comprobante',
  pending_validation: 'Pendiente',
  validated: 'Aprobado',
  rejected: 'Rechazado',
  refunded: 'Reembolsado',
}

const paymentStatusColors: Record<string, string> = {
  pending_proof: 'bg-gray-100 text-gray-700',
  pending_validation: 'bg-yellow-100 text-yellow-700',
  validated: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  refunded: 'bg-blue-100 text-blue-700',
}

const paymentMethodLabels: Record<string, string> = {
  yape: 'Yape',
  plin: 'Plin',
  transfer: 'Transferencia',
  cash: 'Efectivo',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount: number, currency = 'PEN'): string {
  return currency === 'PEN'
    ? `S/. ${amount.toFixed(2)}`
    : `$ ${amount.toFixed(2)}`
}

function getStudentName(p: AdminPayment): string {
  const b = p.bookingId
  if (b?.studentId?.userId) {
    return `${b.studentId.userId.firstName} ${b.studentId.userId.lastName}`
  }
  if (
    p.studentId &&
    typeof p.studentId === 'object' &&
    'firstName' in p.studentId
  ) {
    return `${p.studentId.firstName} ${(p.studentId as any).lastName}`
  }
  return 'Estudiante'
}

function getMentorName(p: AdminPayment): string {
  const b = p.bookingId
  if (b?.mentorId?.userId) {
    return `${b.mentorId.userId.firstName} ${b.mentorId.userId.lastName}`
  }
  return 'Mentor'
}

// ─── Modal de detalle ─────────────────────────────────────────────────────────

interface DetailModalProps {
  payment: AdminPayment
  onClose: () => void
}

function DetailModal({ payment, onClose }: DetailModalProps) {
  const booking = payment.bookingId

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            Detalle de Transacción
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Estado */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                paymentStatusColors[payment.status] ??
                'bg-gray-100 text-gray-700'
              }`}
            >
              {paymentStatusLabels[payment.status] ?? payment.status}
            </span>
            <span className="text-sm text-gray-500">
              {formatDateTime(payment.createdAt)}
            </span>
          </div>

          {/* Montos */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monto total</span>
              <span className="font-semibold text-gray-800">
                {formatCurrency(payment.amount, payment.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Comisión plataforma (10%)</span>
              <span className="font-medium text-purple-700">
                {formatCurrency(payment.platformFee, payment.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ganancia mentor (90%)</span>
              <span className="font-medium text-green-700">
                {formatCurrency(payment.mentorEarnings, payment.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-600">Método de pago</span>
              <span className="font-medium text-gray-800">
                {paymentMethodLabels[payment.paymentMethod] ??
                  payment.paymentMethod}
              </span>
            </div>
          </div>

          {/* Participantes */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold">
                E
              </div>
              <div>
                <p className="text-xs text-gray-500">Estudiante</p>
                <p className="text-sm font-medium text-gray-800">
                  {getStudentName(payment)}
                </p>
                {booking?.studentId?.userId?.email && (
                  <p className="text-xs text-gray-400">
                    {booking.studentId.userId.email}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-semibold">
                M
              </div>
              <div>
                <p className="text-xs text-gray-500">Mentor</p>
                <p className="text-sm font-medium text-gray-800">
                  {getMentorName(payment)}
                </p>
                {booking?.mentorId?.userId?.email && (
                  <p className="text-xs text-gray-400">
                    {booking.mentorId.userId.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sesión */}
          {booking && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Sesión
              </p>
              <p className="text-sm font-medium text-gray-800">
                {booking.topic}
              </p>
              {booking.scheduledAt && (
                <p className="text-xs text-gray-500">
                  {formatDateTime(booking.scheduledAt)} · {booking.duration} min
                </p>
              )}
            </div>
          )}

          {/* Comprobante */}
          {payment.proofImage && (
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                Comprobante
              </p>
              <img
                src={payment.proofImage}
                alt="Comprobante de pago"
                className="w-full rounded-xl border border-gray-200 object-cover max-h-48"
              />
            </div>
          )}

          {/* Motivo de rechazo */}
          {payment.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs text-red-600 font-medium mb-1">
                Motivo de rechazo
              </p>
              <p className="text-sm text-red-700">{payment.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Card de resumen ──────────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string
  value: string
  count?: number
  icon: React.ReactNode
  color: string
}

function SummaryCard({ title, value, count, icon, color }: SummaryCardProps) {
  return (
    <div className={`rounded-xl p-4 flex items-center gap-3 ${color}`}>
      <div className="p-2 bg-white/30 rounded-lg">{icon}</div>
      <div>
        <p className="text-xs font-medium opacity-80">{title}</p>
        <p className="text-lg font-bold">{value}</p>
        {count !== undefined && (
          <p className="text-xs opacity-70">{count} transacciones</p>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminTransactionHistory() {
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [summary, setSummary] = useState<PaymentsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(
    null
  )

  // Filtros
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(15)
  const [exporting, setExporting] = useState(false)

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit }
      if (status) params.status = status
      if (paymentMethod) params.paymentMethod = paymentMethod
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      if (search.trim().length >= 2) params.search = search.trim()

      const result = await paymentAdminService.getAll(params as any)
      setPayments(result.payments)
      setPagination(result.pagination)
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [page, limit, status, paymentMethod, dateFrom, dateTo, search])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  useEffect(() => {
    const loadSummary = async () => {
      setSummaryLoading(true)
      try {
        const s = await paymentSummaryService.getSummary()
        setSummary(s)
      } catch {
        // ignorar
      } finally {
        setSummaryLoading(false)
      }
    }
    loadSummary()
  }, [])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => {
      loadPayments()
    }, 500)
  }

  const handleFilterChange = () => {
    setPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params: Record<string, string> = {}
      if (status) params.status = status
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo

      const query = new URLSearchParams(params).toString()
      const response = await api.get(`/admin/payments/export?${query}`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `transacciones_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Error al exportar. Intenta de nuevo.')
    } finally {
      setExporting(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('')
    setPaymentMethod('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const hasFilters = search || status || paymentMethod || dateFrom || dateTo

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Historial de Transacciones
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Control financiero completo de la plataforma
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-purpura text-white rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-60"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Exportar CSV
        </button>
      </div>

      {/* Cards de resumen */}
      {!summaryLoading && summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            title="Total Recaudado"
            value={`S/. ${summary.totalRecaudado.toFixed(2)}`}
            count={summary.countValidated}
            icon={<DollarSign className="w-5 h-5 text-emerald-700" />}
            color="bg-emerald-100 text-emerald-800"
          />
          <SummaryCard
            title="Pendientes"
            value={`S/. ${summary.totalPendientes.toFixed(2)}`}
            count={summary.countPending}
            icon={<Clock className="w-5 h-5 text-yellow-700" />}
            color="bg-yellow-100 text-yellow-800"
          />
          <SummaryCard
            title="Rechazados"
            value={`S/. ${summary.totalRechazados.toFixed(2)}`}
            count={summary.countRejected}
            icon={<XCircle className="w-5 h-5 text-red-700" />}
            color="bg-red-100 text-red-800"
          />
          <SummaryCard
            title="Reembolsados"
            value={`S/. ${summary.totalReembolsados.toFixed(2)}`}
            count={summary.countRefunded}
            icon={<RefreshCw className="w-5 h-5 text-blue-700" />}
            color="bg-blue-100 text-blue-800"
          />
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-red-500 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Búsqueda */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purpura/30"
            />
          </div>

          {/* Estado */}
          <select
            value={status}
            onChange={e => {
              setStatus(e.target.value)
              handleFilterChange()
            }}
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purpura/30 text-gray-700"
          >
            <option value="">Todos los estados</option>
            <option value="pending_proof">Sin comprobante</option>
            <option value="pending_validation">Pendiente</option>
            <option value="validated">Aprobado</option>
            <option value="rejected">Rechazado</option>
            <option value="refunded">Reembolsado</option>
          </select>

          {/* Método de pago */}
          <select
            value={paymentMethod}
            onChange={e => {
              setPaymentMethod(e.target.value)
              handleFilterChange()
            }}
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purpura/30 text-gray-700"
          >
            <option value="">Todos los métodos</option>
            <option value="yape">Yape</option>
            <option value="plin">Plin</option>
            <option value="transfer">Transferencia</option>
            <option value="cash">Efectivo</option>
          </select>

          {/* Placeholder col para alinear */}
          <div />
        </div>

        {/* Rango de fechas */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Desde:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => {
                setDateFrom(e.target.value)
                handleFilterChange()
              }}
              className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purpura/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Hasta:</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => {
                setDateTo(e.target.value)
                handleFilterChange()
              }}
              className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purpura/30"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-7 h-7 animate-spin text-purpura" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">No se encontraron transacciones</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Fecha
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Estudiante
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Mentor
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Monto
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Método
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Comisión
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => (
                  <tr
                    key={p._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 max-w-[140px] truncate">
                        {getStudentName(p)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700 max-w-[140px] truncate">
                        {getMentorName(p)}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {paymentMethodLabels[p.paymentMethod] ?? p.paymentMethod}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          paymentStatusColors[p.status] ??
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.status === 'validated' && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {p.status === 'rejected' && (
                          <XCircle className="w-3 h-3" />
                        )}
                        {paymentStatusLabels[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-purple-700 font-medium whitespace-nowrap">
                      {formatCurrency(p.platformFee, p.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-purpura transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {pagination.totalItems} transacciones · Página{' '}
              {pagination.currentPage} de {pagination.totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 px-2">
                {pagination.currentPage}
              </span>
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedPayment && (
        <DetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  )
}
