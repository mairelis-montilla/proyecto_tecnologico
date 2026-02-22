/**
 * AdminPaymentValidation.tsx
 *
 * Pantalla de administrador para validar comprobantes de pago.
 * Esquema de colores morado/púrpura (purple-600) - consistente con AdminAproveMentors.
 *
 * Endpoints consumidos:
 *   GET    /api/admin/payments/pending
 *   GET    /api/admin/payments
 *   PATCH  /api/admin/payments/:id/approve
 *   PATCH  /api/admin/payments/:id/reject   → body { reason: string }
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Loader2,
  CreditCard,
  Clock,
  DollarSign,
  User,
  Calendar,
  FileText,
  Image,
  X,
  ArrowLeft,
  ExternalLink,
  Eye,
} from 'lucide-react'
import { paymentAdminService } from '../services/admin.service'
import type { AdminPayment, Pagination } from '../types/payment.types'

type TabKey = 'pending' | 'all'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const paymentMethodLabels: Record<string, string> = {
  yape: 'Yape',
  plin: 'Plin',
  transfer: 'Transferencia',
  cash: 'Efectivo',
}

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
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

function getStudentName(payment: AdminPayment): string {
  const b = payment.bookingId
  if (b?.studentId?.userId) {
    return `${b.studentId.userId.firstName} ${b.studentId.userId.lastName}`
  }
  if (payment.studentId && 'firstName' in payment.studentId) {
    return `${payment.studentId.firstName} ${payment.studentId.lastName}`
  }
  return 'Estudiante'
}

function getMentorName(payment: AdminPayment): string {
  const b = payment.bookingId
  if (b?.mentorId?.userId) {
    return `${b.mentorId.userId.firstName} ${b.mentorId.userId.lastName}`
  }
  return 'Mentor'
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES PEQUEÑOS
// ─────────────────────────────────────────────────────────────────────────────

const PaymentStatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
      paymentStatusColors[status] || 'bg-gray-100 text-gray-700'
    }`}
  >
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${
        status === 'validated'
          ? 'bg-green-500'
          : status === 'pending_validation'
            ? 'bg-yellow-500'
            : status === 'rejected'
              ? 'bg-red-500'
              : 'bg-gray-400'
      }`}
    />
    {paymentStatusLabels[status] || status}
  </span>
)

const Spinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <div className="flex items-center justify-center w-full h-full">
    <Loader2 size={size} className="animate-spin text-purple-600" />
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE RECHAZO
// ─────────────────────────────────────────────────────────────────────────────

interface RejectModalProps {
  open: boolean
  studentName: string
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
}

const RejectModal: React.FC<RejectModalProps> = ({
  open,
  studentName,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setReason('')
      setTimeout(() => textRef.current?.focus(), 100)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async () => {
    if (!reason.trim() || reason.trim().length < 10) return
    setSubmitting(true)
    try {
      await onSubmit(reason.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full rounded-2xl shadow-2xl bg-white border border-gray-200 max-w-md mx-4">
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-base">
                Rechazar comprobante
              </h3>
              <p className="text-xs text-gray-600">{studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <label className="block text-xs font-medium mb-2 text-gray-700">
            Motivo de rechazo
            <span className="text-red-600"> *</span>
          </label>
          <textarea
            ref={textRef}
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={4}
            placeholder="Ej: El comprobante está borroso, el monto no coincide, imagen incorrecta..."
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors bg-gray-50 border border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
            style={{ minHeight: 110 }}
          />
          <p className="text-xs mt-1.5 text-gray-500">
            {reason.trim().length}/500 caracteres (mínimo 10)
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={reason.trim().length < 10 || submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Confirmar rechazo
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE IMAGEN (PREVIEW)
// ─────────────────────────────────────────────────────────────────────────────

interface ImagePreviewModalProps {
  open: boolean
  imageUrl: string
  onClose: () => void
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  open,
  imageUrl,
  onClose,
}) => {
  if (!open) return null

  const isPdf = imageUrl.toLowerCase().includes('.pdf')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative max-w-3xl max-h-[90vh] mx-4">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 p-1.5 rounded-full bg-white shadow-lg text-gray-600 hover:text-gray-900"
        >
          <X size={18} />
        </button>
        {isPdf ? (
          <div className="flex flex-col items-center gap-4 bg-white rounded-2xl p-8">
            <FileText size={48} className="text-purple-600" />
            <p className="text-sm text-gray-700">Comprobante en PDF</p>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"
            >
              <ExternalLink size={14} />
              Abrir PDF
            </a>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Comprobante de pago"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain bg-white"
          />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL DERECHO: DETALLE DEL PAGO
// ─────────────────────────────────────────────────────────────────────────────

interface DetailPanelProps {
  payment: AdminPayment
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
  onBack: () => void
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  payment,
  onApprove,
  onReject,
  onBack,
}) => {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const studentName = getStudentName(payment)
  const mentorName = getMentorName(payment)
  const booking = payment.bookingId

  const handleApprove = async () => {
    setActionLoading('approve')
    try {
      await onApprove(payment._id)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (reason: string) => {
    try {
      await onReject(payment._id, reason)
      setRejectOpen(false)
    } catch {
      setRejectOpen(false)
    }
  }

  const Section: React.FC<{
    icon: React.ReactNode
    title: string
    children: React.ReactNode
  }> = ({ icon, title, children }) => (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
          {title}
        </span>
      </div>
      <div className="pl-5">{children}</div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto text-gray-700">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs mb-4 md:hidden text-purple-600 hover:text-purple-700"
      >
        <ArrowLeft size={14} /> Volver a lista
      </button>

      {/* Header con monto y status */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {formatCurrency(payment.amount, payment.currency)}
          </h2>
          <p className="text-sm mt-1 text-gray-500">
            Método:{' '}
            {paymentMethodLabels[payment.paymentMethod] ||
              payment.paymentMethod}
          </p>
        </div>
        <PaymentStatusBadge status={payment.status} />
      </div>

      {/* Estudiante */}
      <Section
        icon={<User size={14} className="text-purple-600" />}
        title="Estudiante"
      >
        <div className="flex items-center gap-3">
          {booking?.studentId?.userId?.avatar && (
            <img
              src={booking.studentId.userId.avatar}
              alt={studentName}
              className="w-8 h-8 rounded-lg object-cover"
            />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{studentName}</p>
            {booking?.studentId?.userId?.email && (
              <p className="text-xs text-gray-500">
                {booking.studentId.userId.email}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* Mentor */}
      <Section
        icon={<User size={14} className="text-purple-600" />}
        title="Mentor"
      >
        <div className="flex items-center gap-3">
          {booking?.mentorId?.userId?.avatar && (
            <img
              src={booking.mentorId.userId.avatar}
              alt={mentorName}
              className="w-8 h-8 rounded-lg object-cover"
            />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{mentorName}</p>
            {booking?.mentorId?.title && (
              <p className="text-xs text-gray-500">{booking.mentorId.title}</p>
            )}
          </div>
        </div>
      </Section>

      {/* Sesión */}
      {booking && (
        <Section
          icon={<Calendar size={14} className="text-purple-600" />}
          title="Sesión"
        >
          <p className="text-sm text-gray-700">
            <span className="font-medium">Tema:</span> {booking.topic}
          </p>
          <p className="text-sm mt-1 text-gray-700">
            <span className="font-medium">Fecha:</span>{' '}
            {formatDate(booking.scheduledAt)}
          </p>
          <p className="text-sm mt-1 text-gray-700">
            <span className="font-medium">Duración:</span> {booking.duration}{' '}
            min
          </p>
          <p className="text-sm mt-1 text-gray-700">
            <span className="font-medium">Monto sesión:</span>{' '}
            {formatCurrency(booking.totalAmount)}
          </p>
        </Section>
      )}

      {/* Distribución del pago */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 rounded-xl p-3 bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign size={13} className="text-purple-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Comisión (10%)
            </span>
          </div>
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(payment.platformFee, payment.currency)}
          </p>
        </div>
        <div className="flex-1 rounded-xl p-3 bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign size={13} className="text-purple-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Mentor (90%)
            </span>
          </div>
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(payment.mentorEarnings, payment.currency)}
          </p>
        </div>
      </div>

      {/* Comprobante */}
      {payment.proofImage && (
        <Section
          icon={<Image size={14} className="text-purple-600" />}
          title="Comprobante"
        >
          <div className="flex flex-col gap-2">
            {payment.proofImage.toLowerCase().includes('.pdf') ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <FileText size={24} className="text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Archivo PDF
                  </p>
                  <p className="text-xs text-gray-500">
                    Subido{' '}
                    {payment.proofUploadedAt
                      ? formatDate(payment.proofUploadedAt)
                      : ''}
                  </p>
                </div>
                <button
                  onClick={() => setImagePreview(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100"
                >
                  <Eye size={13} /> Ver
                </button>
              </div>
            ) : (
              <div className="relative group">
                <img
                  src={payment.proofImage}
                  alt="Comprobante"
                  className="w-full max-h-48 object-contain rounded-xl border border-gray-200 bg-gray-50 cursor-pointer"
                  onClick={() => setImagePreview(true)}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-xl cursor-pointer"
                  onClick={() => setImagePreview(true)}
                >
                  <Eye
                    size={24}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                {payment.proofUploadedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Subido {formatDate(payment.proofUploadedAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Motivo de rechazo (si ya fue rechazado) */}
      {payment.status === 'rejected' && payment.rejectionReason && (
        <Section
          icon={<AlertTriangle size={14} className="text-red-500" />}
          title="Motivo de rechazo"
        >
          <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            {payment.rejectionReason}
          </p>
        </Section>
      )}

      {/* Fechas */}
      <Section
        icon={<Clock size={14} className="text-purple-600" />}
        title="Fechas"
      >
        <p className="text-xs text-gray-500">
          Creado: {formatDate(payment.createdAt)}
        </p>
        {payment.validatedAt && (
          <p className="text-xs text-gray-500 mt-0.5">
            Validado: {formatDate(payment.validatedAt)}
          </p>
        )}
      </Section>

      {/* Acciones solo para pendientes */}
      {payment.status === 'pending_validation' && (
        <div className="pt-4 flex flex-col gap-2.5 border-t border-gray-200">
          <button
            onClick={handleApprove}
            disabled={!!actionLoading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {actionLoading === 'approve' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Aprobar Pago
          </button>

          <button
            onClick={() => setRejectOpen(true)}
            disabled={!!actionLoading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle size={16} />
            Rechazar Comprobante
          </button>
        </div>
      )}

      <RejectModal
        open={rejectOpen}
        studentName={studentName}
        onClose={() => setRejectOpen(false)}
        onSubmit={handleReject}
      />

      <ImagePreviewModal
        open={imagePreview}
        imageUrl={payment.proofImage || ''}
        onClose={() => setImagePreview(false)}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const AdminPaymentValidation: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('pending')
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasPrevPage: false,
    hasNextPage: false,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AdminPayment | null>(null)
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'error'
  } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setSelected(null)
    try {
      const result =
        tab === 'pending'
          ? await paymentAdminService.getPending({ limit: 50 })
          : await paymentAdminService.getAll({ limit: 50 })
      setPayments(result.payments)
      setPagination(result.pagination)
    } catch {
      showToast('Error al cargar pagos', 'error')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  // Filtro local por búsqueda
  const filtered = payments.filter(p => {
    const t = search.toLowerCase()
    const student = getStudentName(p).toLowerCase()
    const mentor = getMentorName(p).toLowerCase()
    const topic = p.bookingId?.topic?.toLowerCase() || ''
    const method = (paymentMethodLabels[p.paymentMethod] || '').toLowerCase()
    return (
      student.includes(t) ||
      mentor.includes(t) ||
      topic.includes(t) ||
      method.includes(t)
    )
  })

  const handleApprove = async (id: string) => {
    await paymentAdminService.approve(id)
    showToast('Pago aprobado exitosamente', 'success')
    await fetchPayments()
  }

  const handleReject = async (id: string, reason: string) => {
    await paymentAdminService.reject(id, reason)
    showToast('Comprobante rechazado', 'success')
    await fetchPayments()
  }

  return (
    <div
      className="min-h-screen w-full bg-gray-50"
      style={{
        fontFamily:
          "'DM Sans', 'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[240px] ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
          style={{ animation: 'slideInToast 0.3s ease' }}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={18} className="text-green-600" />
          ) : (
            <AlertTriangle size={18} className="text-red-600" />
          )}
          <span
            className={`text-sm font-medium ${
              toast.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {toast.msg}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-600">
              <CreditCard size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Validación de Pagos
              </h1>
              <p className="text-xs text-gray-600">
                Panel de administrador - Comprobantes de pago
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
        <div className="flex gap-1 rounded-xl p-1 bg-gray-100">
          {(['pending', 'all'] as TabKey[]).map(key => {
            const label = key === 'pending' ? 'Pendientes' : 'Todos'
            const count =
              key === tab
                ? filtered.length
                : key === 'pending'
                  ? pagination.totalItems
                  : '—'
            const active = key === tab
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  active
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                    active
                      ? 'bg-purple-700 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-white border border-gray-300 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500">
            <Search size={15} className="text-gray-500" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar estudiante, mentor, tema..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={14} className="text-gray-500 hover:text-gray-700" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body: lista + detalle */}
      <div className="flex h-[calc(100vh-170px)] overflow-hidden">
        {/* Lista izquierda */}
        <div
          className={`overflow-y-auto px-3 pb-4 ${
            selected ? 'hidden md:block' : 'block'
          }`}
          style={{
            width: selected ? '38%' : '100%',
            minWidth: selected ? 300 : undefined,
          }}
        >
          {loading ? (
            <div className="h-64">
              <Spinner size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-100">
                <CreditCard size={26} className="text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">
                {tab === 'pending'
                  ? 'No hay pagos pendientes de validación'
                  : 'No se encontraron pagos'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(p => {
                const isSelected = selected?._id === p._id
                const studentName = getStudentName(p)
                return (
                  <button
                    key={p._id}
                    onClick={() => setSelected(p)}
                    className={`w-full text-left rounded-xl p-3.5 transition-all ${
                      isSelected
                        ? 'bg-purple-50 border border-purple-200 shadow-sm'
                        : 'bg-white border border-gray-200 hover:border-purple-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50">
                        <CreditCard size={18} className="text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {formatCurrency(p.amount, p.currency)}
                          </span>
                          <PaymentStatusBadge status={p.status} />
                        </div>
                        <p className="text-xs truncate mt-0.5 text-purple-600">
                          {studentName}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                            {paymentMethodLabels[p.paymentMethod] ||
                              p.paymentMethod}
                          </span>
                          {p.bookingId?.topic && (
                            <span className="text-xs text-gray-500 truncate">
                              {p.bookingId.topic}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(p.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Panel detalle derecho */}
        <div
          className={`flex-1 overflow-y-auto px-5 py-4 bg-white border-l border-gray-200 ${
            selected
              ? 'block'
              : 'hidden md:flex md:items-center md:justify-center'
          }`}
        >
          {selected ? (
            <DetailPanel
              payment={selected}
              onApprove={handleApprove}
              onReject={handleReject}
              onBack={() => setSelected(null)}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 opacity-40">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-purple-100">
                <CreditCard size={30} className="text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">
                Selecciona un pago para ver el detalle
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInToast {
          from { transform: translateY(-12px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        input::placeholder { color: #6b7280; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(147, 51, 234, 0.2); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(147, 51, 234, 0.4); }
      `}</style>
    </div>
  )
}

export default AdminPaymentValidation
