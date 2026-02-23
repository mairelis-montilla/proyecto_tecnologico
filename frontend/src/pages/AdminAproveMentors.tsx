/**
 * AdminMentorApproval.tsx
 *
 * Pantalla de administrador para aprobar / rechazar / revocar mentores.
 * ACTUALIZADO: Esquema de colores morado/púrpura (purple-600, etc.)
 *
 * Dependencias asumidas del proyecto:
 *   - React 18+  (useState, useEffect, useCallback, useRef)
 *   - Vite + TypeScript
 *   - Lucide-react  (iconos)
 *   - Axios o fetch nativo  →  se encapsula en `mentorAdminApi`
 *
 * Para integrar en tu proyecto:
 *   1. Mover este archivo a src/pages/ o src/components/
 *   2. Reemplazar la sección "── MOCK API ──" por llamadas reales a tu backend
 *      usando axios o tu instancia de fetch centralizada.
 *   3. Ajustar la ruta en tu router (react-router / tanstack).
 *
 * Endpoints consumidos (ya implementados según la imagen):
 *   GET    /api/admin/mentors/pending
 *   GET    /api/admin/mentors/approved          ← asumido simétrico
 *   PATCH  /api/admin/mentors/:id/approve
 *   PATCH  /api/admin/mentors/:id/reject        body: { reason: string }
 *   PATCH  /api/admin/mentors/:id/revoke
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Fragment,
} from 'react'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Loader2,
  User,
  BookOpen,
  Award,
  Clock,
  DollarSign,
  Globe,
  Mail,
  X,
  ShieldOff,
  ArrowLeft,
} from 'lucide-react'
import {
  mentorAdminService as mentorAdminApi,
  type MentorAdminItem,
  type PopulatedSpecialty,
} from '../services/admin.service'

type TabKey = 'pending' | 'approved'

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES PEQUEÑOS
// ─────────────────────────────────────────────────────────────────────────────

/** Chip de especialidad */
const SpecialtyChip: React.FC<{ specialty: PopulatedSpecialty }> = ({
  specialty,
}) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
    {specialty.icon && <span>{specialty.icon}</span>}
    {specialty.name}
  </span>
)

/** Badge de estado */
const StatusBadge: React.FC<{ approved: boolean }> = ({ approved }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
      approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
    }`}
  >
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${
        approved ? 'bg-green-500' : 'bg-yellow-500'
      }`}
    />
    {approved ? 'Aprobado' : 'Pendiente'}
  </span>
)

/** Spinner centrado */
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
  mentorName: string
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
}

const RejectModal: React.FC<RejectModalProps> = ({
  open,
  mentorName,
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
    if (!reason.trim()) return
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-base">
                Rechazar solicitud
              </h3>
              <p className="text-xs text-gray-600">{mentorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
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
            placeholder="Describe el motivo por el cual se rechaza esta solicitud..."
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors bg-gray-50 border border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
            style={{ minHeight: 110 }}
          />
          <p className="text-xs mt-1.5 text-gray-500">
            {reason.trim().length}/200 caracteres mínimo 20
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={reason.trim().length < 20 || submitting}
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
// PANEL DERECHO: DETALLE DEL MENTOR
// ─────────────────────────────────────────────────────────────────────────────
interface DetailPanelProps {
  mentor: MentorAdminItem
  tab: TabKey
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
  onRevoke: (id: string) => Promise<void>
  onBack: () => void
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  mentor,
  tab,
  onApprove,
  onReject,
  onRevoke,
  onBack,
}) => {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fullName = `${mentor.userId.firstName} ${mentor.userId.lastName}`

  const handleApprove = async () => {
    setActionLoading('approve')
    try {
      await onApprove(mentor._id)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (reason: string) => {
    try {
      await onReject(mentor._id, reason)
      setRejectOpen(false)
    } catch {
      setRejectOpen(false)
    }
  }

  const handleRevoke = async () => {
    setActionLoading('revoke')
    try {
      await onRevoke(mentor._id)
    } finally {
      setActionLoading(null)
    }
  }

  // ── Sección reutilizable ──
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
      {/* Botón "atrás" en mobile */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs mb-4 md:hidden text-purple-600 hover:text-purple-700"
      >
        <ArrowLeft size={14} /> Volver a lista
      </button>

      {/* Avatar + nombre */}
      <div className="flex items-start gap-4 mb-6">
        <img
          src={mentor.userId.avatar || 'https://i.pravatar.cc/150?img=1'}
          alt={fullName}
          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-200"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-gray-900 truncate">
              {fullName}
            </h2>
            <StatusBadge approved={mentor.isApproved} />
          </div>
          <p className="text-sm mt-0.5 text-purple-600">{mentor.title}</p>
          <p className="text-xs mt-0.5 text-gray-500">
            Registrado el{' '}
            {new Date(mentor.createdAt).toLocaleDateString('es-PE', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Info usuario asociado */}
      <Section
        icon={<User size={14} className="text-purple-600" />}
        title="Usuario asociado"
      >
        <p className="flex items-center gap-2 text-sm text-gray-700">
          <Mail size={13} className="text-gray-500" />
          {mentor.userId.email}
        </p>
        <p className="flex items-center gap-2 text-xs mt-1 text-gray-500">
          ID: <code className="text-xs">{mentor.userId._id}</code>
        </p>
      </Section>

      {/* Bio */}
      <Section
        icon={<BookOpen size={14} className="text-purple-600" />}
        title="Presentación"
      >
        <p className="text-sm leading-relaxed text-gray-700">
          {mentor.bio || <span className="text-gray-500">Sin bio</span>}
        </p>
      </Section>

      {/* Especialidades */}
      <Section
        icon={<Award size={14} className="text-purple-600" />}
        title="Especialidades"
      >
        <div className="flex flex-wrap gap-2">
          {(mentor.specialties ?? []).length > 0 ? (
            (mentor.specialties ?? []).map(s => (
              <SpecialtyChip key={s._id} specialty={s} />
            ))
          ) : (
            <span className="text-xs text-gray-500">Sin especialidades</span>
          )}
        </div>
      </Section>

      {/* Experiencia */}
      <Section
        icon={<Clock size={14} className="text-purple-600" />}
        title="Experiencia"
      >
        <p className="text-sm text-gray-700">
          {mentor.experience || (
            <span className="text-gray-500">Sin descripción</span>
          )}
        </p>
        <p className="text-xs mt-1 font-medium text-purple-600">
          {mentor.yearsOfExperience} año
          {mentor.yearsOfExperience !== 1 ? 's' : ''} de experiencia
        </p>
      </Section>

      {/* Credenciales */}
      {(mentor.credentials ?? []).length > 0 && (
        <Section
          icon={<Award size={14} className="text-purple-600" />}
          title="Credenciales"
        >
          <div className="flex flex-wrap gap-2">
            {(mentor.credentials ?? []).map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700 border border-green-200"
              >
                ✓ {c}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Idiomas & Tarifa */}
      <div className="flex gap-4 mb-5">
        <div className="flex-1 rounded-xl p-3 bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-1.5 mb-1">
            <Globe size={13} className="text-purple-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Idiomas
            </span>
          </div>
          <p className="text-xs capitalize text-gray-700">
            {(mentor.languages ?? []).length > 0
              ? (mentor.languages ?? []).join(', ')
              : 'No especificado'}
          </p>
        </div>
        <div className="flex-1 rounded-xl p-3 bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign size={13} className="text-purple-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Tarifa / hora
            </span>
          </div>
          <p className="text-sm font-bold text-gray-900">
            {mentor.hourlyRate ? `S/. ${mentor.hourlyRate}` : 'No definida'}
          </p>
        </div>
      </div>

      {/* ─── ACCIONES ─── */}
      <div className="pt-4 flex flex-col gap-2.5 border-t border-gray-200">
        {tab === 'pending' && (
          <Fragment>
            {/* Aprobar */}
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
              Aprobar Mentor
            </button>

            {/* Rechazar */}
            <button
              onClick={() => setRejectOpen(true)}
              disabled={!!actionLoading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle size={16} />
              Rechazar Solicitud
            </button>
          </Fragment>
        )}

        {tab === 'approved' && (
          <button
            onClick={handleRevoke}
            disabled={!!actionLoading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'revoke' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShieldOff size={16} />
            )}
            Revocar aprobación
          </button>
        )}
      </div>

      {/* Modal rechazo */}
      <RejectModal
        open={rejectOpen}
        mentorName={fullName}
        onClose={() => setRejectOpen(false)}
        onSubmit={handleReject}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
interface AdminMentorApprovalProps {
  title?: string
  description?: string
}

const AdminMentorApproval: React.FC<AdminMentorApprovalProps> = ({
  title = 'Gestión de Mentores',
  description = 'PTG3-33 · Panel de administrador',
}) => {
  // ── State ──
  const [tab, setTab] = useState<TabKey>('pending')
  const [mentors, setMentors] = useState<MentorAdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MentorAdminItem | null>(null)
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'error'
  } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // ── Fetch ──
  const fetchMentors = useCallback(async () => {
    setLoading(true)
    setSelected(null)
    try {
      const data =
        tab === 'pending'
          ? await mentorAdminApi.getPending()
          : await mentorAdminApi.getApproved()
      setMentors(data)
    } catch {
      showToast('Error al cargar mentores', 'error')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchMentors()
  }, [fetchMentors])

  // ── Toast helper ──
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  // ── Filtro local por búsqueda ──
  const filtered = mentors.filter(m => {
    const t = search.toLowerCase()
    return (
      `${m.userId.firstName} ${m.userId.lastName}`.toLowerCase().includes(t) ||
      m.title.toLowerCase().includes(t) ||
      m.specialties.some(s => s.name.toLowerCase().includes(t)) ||
      m.specialties.some(s => s.category.toLowerCase().includes(t))
    )
  })

  // ── Acciones ──
  const handleApprove = async (id: string) => {
    await mentorAdminApi.approve(id)
    showToast('Mentor aprobado exitosamente', 'success')
    await fetchMentors()
  }

  const handleReject = async (id: string, reason: string) => {
    await mentorAdminApi.reject(id, reason)
    showToast('Solicitud rechazada', 'success')
    await fetchMentors()
  }

  const handleRevoke = async (id: string) => {
    await mentorAdminApi.revoke(id)
    showToast('Aprobación revocada', 'success')
    await fetchMentors()
  }

  // ── Render ──
  return (
    <div
      className="min-h-screen w-full bg-gray-50"
      style={{
        fontFamily:
          "'DM Sans', 'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Toast ── */}
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

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-600">
              <Award size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{title}</h1>
              <p className="text-xs text-gray-600">{description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs + Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1 bg-gray-100">
          {(['pending', 'approved'] as TabKey[]).map(key => {
            const label = key === 'pending' ? 'Pendientes' : 'Aprobados'
            const count = key === tab ? filtered.length : '—'
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

        {/* Search */}
        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-white border border-gray-300 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500">
            <Search size={15} className="text-gray-500" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar mentor, especialidad..."
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

      {/* ── Body: lista + detalle ── */}
      <div className="flex overflow-hidden" style={{ minHeight: 400 }}>
        {/* Lista izquierda */}
        <div
          className={`overflow-y-auto px-3 pb-4 ${
            selected ? 'hidden md:block' : 'block'
          }`}
          style={{
            width: selected ? '38%' : '100%',
            minWidth: selected ? 280 : undefined,
          }}
        >
          {loading ? (
            <div className="h-64">
              <Spinner size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-100">
                <User size={26} className="text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">
                No hay mentores {tab === 'pending' ? 'pendientes' : 'aprobados'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(m => {
                const isSelected = selected?._id === m._id
                return (
                  <button
                    key={m._id}
                    onClick={() => setSelected(m)}
                    className={`w-full text-left rounded-xl p-3.5 transition-all ${
                      isSelected
                        ? 'bg-purple-50 border border-purple-200 shadow-sm'
                        : 'bg-white border border-gray-200 hover:border-purple-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={
                          m.userId.avatar || 'https://i.pravatar.cc/150?img=1'
                        }
                        alt={m.userId.firstName}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {m.userId.firstName} {m.userId.lastName}
                          </span>
                          <StatusBadge approved={m.isApproved} />
                        </div>
                        <p className="text-xs truncate mt-0.5 text-purple-600">
                          {m.title}
                        </p>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {m.specialties.slice(0, 3).map(s => (
                            <span
                              key={s._id}
                              className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700"
                            >
                              {s.icon} {s.name}
                            </span>
                          ))}
                          {m.specialties.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{m.specialties.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Panel detalle derecho */}
        {selected && (
          <div className="flex-1 overflow-y-auto px-5 py-4 bg-white border-l border-gray-200">
            <DetailPanel
              mentor={selected}
              tab={tab}
              onApprove={handleApprove}
              onReject={handleReject}
              onRevoke={handleRevoke}
              onBack={() => setSelected(null)}
            />
          </div>
        )}
      </div>

      {/* ── Keyframes globales ── */}
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

export default AdminMentorApproval
