/**
 * AdminUserManagement.tsx
 *
 * Pantalla de administrador para gestionar usuarios.
 * Funcionalidades:
 *   - Tabla con paginación
 *   - Filtros: rol (estudiante/mentor/admin), estado (activo/bloqueado)
 *   - Búsqueda por nombre o email
 *   - Modal de detalle con formulario de edición
 *
 * Dependencias:
 *   - React 18+
 *   - Lucide-react
 *   - userAdmin.service.ts
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
Search,
X,
Loader2,
User,
Calendar,
Edit2,
ChevronLeft,
ChevronRight,
CheckCircle,
AlertTriangle,
Users,
Award,
BookOpen,
ShieldOff,
ShieldAlert,
Clock,
} from 'lucide-react'
import {
userAdminService,
type UserAdminItem,
type UserDetail,
type UserRole,
type UsersFilter,
type UpdateUserData,
type BlockHistoryItem,
} from '../services/admin.service'
import { Pagination } from '@/types/payment.types'

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES AUXILIARES
// ─────────────────────────────────────────────────────────────────────────────

const Spinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
<div className="flex items-center justify-center w-full h-full">
    <Loader2 size={size} className="animate-spin text-purple-600" />
</div>
)

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
const config = {
    student: { label: 'Estudiante', bg: 'bg-blue-100', text: 'text-blue-700' },
    mentor: { label: 'Mentor', bg: 'bg-purple-100', text: 'text-purple-700' },
    admin: { label: 'Admin', bg: 'bg-red-100', text: 'text-red-700' },
}
const c = config[role]
return (
    <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}
    >
    {c.label}
    </span>
)
}

const StatusBadge: React.FC<{ isActive: boolean; isBlocked: boolean }> = ({
isActive,
isBlocked,
}) => {
if (isBlocked) {
    return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
        Bloqueado
    </span>
    )
}
if (isActive) {
    return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
        Activo
    </span>
    )
}
return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
    <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500" />
    Inactivo
    </span>
)
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE BLOQUEO/DESBLOQUEO
// ─────────────────────────────────────────────────────────────────────────────
interface BlockActionModalProps {
open: boolean
action: 'block' | 'unblock'
userName: string
onClose: () => void
onSubmit: (reason: string) => Promise<void>
}

const BlockActionModal: React.FC<BlockActionModalProps> = ({
open,
action,
userName,
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

const isBlock = action === 'block'

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
            <div
            className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                isBlock ? 'bg-red-100' : 'bg-green-100'
            }`}
            >
            {isBlock ? (
                <ShieldOff size={20} className="text-red-600" />
            ) : (
                <ShieldAlert size={20} className="text-green-600" />
            )}
            </div>
            <div>
            <h3 className="text-gray-900 font-semibold text-base">
                {isBlock ? 'Bloquear usuario' : 'Desbloquear usuario'}
            </h3>
            <p className="text-xs text-gray-600">{userName}</p>
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
            Motivo {isBlock ? 'del bloqueo' : 'del desbloqueo'}
            <span className="text-red-600"> *</span>
        </label>
        <textarea
            ref={textRef}
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={4}
            placeholder={
            isBlock
                ? 'Describe el motivo por el cual se bloqueará este usuario...'
                : 'Describe el motivo por el cual se desbloqueará este usuario...'
            }
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors bg-gray-50 border border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
            style={{ minHeight: 110 }}
        />
        <p className="text-xs mt-1.5 text-gray-500">
            {reason.trim().length} caracteres (mínimo 10)
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
            disabled={reason.trim().length < 10 || submitting}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed ${
            isBlock
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
        >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Confirmar {isBlock ? 'bloqueo' : 'desbloqueo'}
        </button>
        </div>
    </div>
    </div>
)
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE DETALLE Y EDICIÓN
// ─────────────────────────────────────────────────────────────────────────────
interface UserDetailModalProps {
userId: string | null
onClose: () => void
onUpdate: () => void
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
userId,
onClose,
onUpdate,
}) => {
const [user, setUser] = useState<UserDetail | null>(null)
const [loading, setLoading] = useState(true)
const [editing, setEditing] = useState(false)
const [saving, setSaving] = useState(false)
const [formData, setFormData] = useState<UpdateUserData>({})
const [blockHistory, setBlockHistory] = useState<BlockHistoryItem[]>([])
const [loadingHistory, setLoadingHistory] = useState(false)
const [blockModalOpen, setBlockModalOpen] = useState(false)
const [blockAction, setBlockAction] = useState<'block' | 'unblock'>('block')

useEffect(() => {
    if (!userId) return
    const fetchUser = async () => {
    setLoading(true)
    try {
        const data = await userAdminService.getById(userId)
        setUser(data)
        setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
        isBlocked: data.isBlocked,
        phone: data.phone || '',
        })
    } catch {
        onClose()
    } finally {
        setLoading(false)
    }
    }
    fetchUser()
}, [userId, onClose])

useEffect(() => {
    if (!userId) return
    const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
        const history = await userAdminService.getBlockHistory(userId)
        setBlockHistory(history)
    } catch {
        // silently fail, history is not critical
    } finally {
        setLoadingHistory(false)
    }
    }
    fetchHistory()
}, [userId])

const handleSave = async () => {
    if (!userId || !user) return
    setSaving(true)
    try {
    await userAdminService.update(userId, formData)
    onUpdate()
    setEditing(false)
    } catch {
    // handle error
    } finally {
    setSaving(false)
    }
}

const handleBlockAction = async (reason: string) => {
    if (!userId) return
    try {
    if (blockAction === 'block') {
        await userAdminService.block(userId, reason)
    } else {
        await userAdminService.unblock(userId, reason)
    }
    setBlockModalOpen(false)
    onUpdate()
    } catch {
    setBlockModalOpen(false)
    }
}

if (!userId) return null

return (
    <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    onClick={e => {
        if (e.target === e.currentTarget) onClose()
    }}
    >
    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {loading ? (
        <div className="h-96">
            <Spinner size={32} />
        </div>
        ) : user ? (
        <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <img
                src={user.avatar || 'https://i.pravatar.cc/150?img=1'}
                alt={user.firstName}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-200"
                />
                <div>
                <h2 className="text-lg font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-gray-600">{user.email}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {!editing && (
                <button
                    onClick={() => setEditing(true)}
                    className="p-2 rounded-lg transition-colors text-purple-600 hover:bg-purple-50"
                >
                    <Edit2 size={18} />
                </button>
                )}
                <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                <X size={18} />
                </button>
            </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
            {/* Info básica */}
            <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-600 mb-3">
                Información básica
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nombre
                    </label>
                    {editing ? (
                    <input
                        type="text"
                        value={formData.firstName || ''}
                        onChange={e =>
                        setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    ) : (
                    <p className="text-sm text-gray-900">{user.firstName}</p>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                    Apellido
                    </label>
                    {editing ? (
                    <input
                        type="text"
                        value={formData.lastName || ''}
                        onChange={e =>
                        setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    ) : (
                    <p className="text-sm text-gray-900">{user.lastName}</p>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                    </label>
                    {editing ? (
                    <input
                        type="email"
                        value={formData.email || ''}
                        onChange={e =>
                        setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    ) : (
                    <p className="text-sm text-gray-900">{user.email}</p>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                    Teléfono
                    </label>
                    {editing ? (
                    <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={e =>
                        setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    ) : (
                    <p className="text-sm text-gray-900">
                        {user.phone || '—'}
                    </p>
                    )}
                </div>
                </div>
            </div>

            {/* Rol y estado */}
            <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-600 mb-3">
                Permisos y estado
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                    Rol
                    </label>
                    {editing ? (
                    <select
                        value={formData.role || user.role}
                        onChange={e =>
                        setFormData({
                            ...formData,
                            role: e.target.value as UserRole,
                        })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="student">Estudiante</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                    </select>
                    ) : (
                    <RoleBadge role={user.role} />
                    )}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                    Estado
                    </label>
                    {editing ? (
                    <label className="flex items-center gap-2">
                        <input
                        type="checkbox"
                        checked={formData.isActive ?? user.isActive}
                        onChange={e =>
                            setFormData({
                            ...formData,
                            isActive: e.target.checked,
                            })
                        }
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-900">Activo</span>
                    </label>
                    ) : (
                    <StatusBadge
                        isActive={user.isActive}
                        isBlocked={user.isBlocked}
                    />
                    )}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                    Bloqueo
                    </label>
                    {editing ? (
                    <label className="flex items-center gap-2">
                        <input
                        type="checkbox"
                        checked={formData.isBlocked ?? user.isBlocked}
                        onChange={e =>
                            setFormData({
                            ...formData,
                            isBlocked: e.target.checked,
                            })
                        }
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-900">Bloqueado</span>
                    </label>
                    ) : null}
                </div>
                </div>
            </div>

            {/* Fechas */}
            <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-600 mb-3">
                Actividad
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar size={14} className="text-gray-500" />
                    <span>
                    Registro:{' '}
                    {new Date(user.createdAt).toLocaleDateString('es-PE')}
                    </span>
                </div>
                {user.lastLogin && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar size={14} className="text-gray-500" />
                    <span>
                        Último acceso:{' '}
                        {new Date(user.lastLogin).toLocaleDateString('es-PE')}
                    </span>
                    </div>
                )}
                </div>
            </div>

            {/* Bloqueo */}
            <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-600 mb-3">
                Bloqueo
                </h3>
                {user.isBlocked && user.blockReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
                    <div className="flex items-start gap-2">
                    <ShieldOff size={16} className="text-red-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-900">
                        Usuario bloqueado
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                        {user.blockReason}
                        </p>
                        {user.blockedAt && (
                        <p className="text-xs text-red-600 mt-1">
                            Bloqueado el{' '}
                            {new Date(user.blockedAt).toLocaleDateString(
                            'es-PE',
                            {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            }
                            )}
                        </p>
                        )}
                    </div>
                    </div>
                </div>
                )}
                <button
                onClick={() => {
                    setBlockAction(user.isBlocked ? 'unblock' : 'block')
                    setBlockModalOpen(true)
                }}
                disabled={editing}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    user.isBlocked
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
                >
                {user.isBlocked ? (
                    <>
                    <ShieldAlert size={16} />
                    Desbloquear usuario
                    </>
                ) : (
                    <>
                    <ShieldOff size={16} />
                    Bloquear usuario
                    </>
                )}
                </button>
            </div>

            {/* Historial de bloqueos */}
            {blockHistory.length > 0 && (
                <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-600 mb-3">
                    Historial de bloqueos
                </h3>
                {loadingHistory ? (
                    <div className="h-20">
                    <Spinner size={20} />
                    </div>
                ) : (
                    <div className="space-y-2">
                    {blockHistory.map(item => (
                        <div
                        key={item._id}
                        className={`rounded-xl p-3 border ${
                            item.action === 'block'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                        >
                        <div className="flex items-start gap-2">
                            {item.action === 'block' ? (
                            <ShieldOff
                                size={14}
                                className="text-red-600 mt-0.5"
                            />
                            ) : (
                            <ShieldAlert
                                size={14}
                                className="text-green-600 mt-0.5"
                            />
                            )}
                            <div className="flex-1 min-w-0">
                            <p
                                className={`text-xs font-medium ${
                                item.action === 'block'
                                    ? 'text-red-900'
                                    : 'text-green-900'
                                }`}
                            >
                                {item.action === 'block'
                                ? 'Bloqueado'
                                : 'Desbloqueado'}{' '}
                                por {item.adminId.firstName}{' '}
                                {item.adminId.lastName}
                            </p>
                            <p
                                className={`text-xs mt-0.5 ${
                                item.action === 'block'
                                    ? 'text-red-700'
                                    : 'text-green-700'
                                }`}
                            >
                                {item.reason}
                            </p>
                            <p
                                className={`text-xs mt-1 flex items-center gap-1 ${
                                item.action === 'block'
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }`}
                            >
                                <Clock size={12} />
                                {new Date(item.createdAt).toLocaleString(
                                'es-PE',
                                {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }
                                )}
                            </p>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </div>
            )}

            {/* Perfil de mentor */}
            {user.mentorProfile && (
                <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-600 mb-3 flex items-center gap-2">
                    <Award size={14} />
                    Perfil de mentor
                </h3>
                <div className="bg-purple-50 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-medium text-gray-900">
                    {user.mentorProfile.title}
                    </p>
                    <p className="text-xs text-gray-700">
                    {user.mentorProfile.bio}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>Rating: {user.mentorProfile.rating}/5</span>
                    <span>Sesiones: {user.mentorProfile.totalSessions}</span>
                    <span>
                        Tarifa: S/. {user.mentorProfile.hourlyRate || '—'}
                    </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                    {user.mentorProfile.specialties.map(s => (
                        <span
                        key={s._id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700"
                        >
                        {s.icon} {s.name}
                        </span>
                    ))}
                    </div>
                </div>
                </div>
            )}

            {/* Perfil de estudiante */}
            {user.studentProfile && (
                <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-600 mb-3 flex items-center gap-2">
                    <BookOpen size={14} />
                    Perfil de estudiante
                </h3>
                <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-gray-700">
                    Sesiones inscritas: {user.studentProfile.enrolledSessions}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                    {user.studentProfile.interests.map(i => (
                        <span
                        key={i._id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                        >
                        {i.icon} {i.name}
                        </span>
                    ))}
                    </div>
                </div>
                </div>
            )}
            </div>

            {/* Footer - solo visible si está editando */}
            {editing && (
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                onClick={() => {
                    setEditing(false)
                    setFormData({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    isBlocked: user.isBlocked,
                    phone: user.phone || '',
                    })
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                Cancelar
                </button>
                <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Guardar cambios
                </button>
            </div>
            )}
        </>
        ) : null}

        {/* Modal de bloqueo/desbloqueo */}
        <BlockActionModal
        open={blockModalOpen}
        action={blockAction}
        userName={user ? `${user.firstName} ${user.lastName}` : ''}
        onClose={() => setBlockModalOpen(false)}
        onSubmit={handleBlockAction}
        />
    </div>
    </div>
)
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
interface AdminUserManagementProps {
title?: string
description?: string
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
title = 'Gestión de Usuarios',
description = 'Administrar todos los usuarios de la plataforma',
}) => {
const [users, setUsers] = useState<UserAdminItem[]>([])
const [pagination, setPagination] = useState<Pagination | null>(null)
const [loading, setLoading] = useState(true)
const [filters, setFilters] = useState<UsersFilter>({
    page: 1,
    limit: 10,
})
const [search, setSearch] = useState('')
const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'error'
} | null>(null)
const searchTimeoutRef = useRef<number>()

const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
}

const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
    const data = await userAdminService.getAll(filters)
    setUsers(data.users)
    setPagination(data.pagination)
    } catch {
    showToast('Error al cargar usuarios', 'error')
    } finally {
    setLoading(false)
    }
}, [filters])

useEffect(() => {
    fetchUsers()
}, [fetchUsers])

// Debounce search
useEffect(() => {
    if (searchTimeoutRef.current) {
    clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
    setFilters(prev => ({ ...prev, search: search || undefined, page: 1 }))
    }, 500)
}, [search])

const handleFilterChange = (key: keyof UsersFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
}

const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
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
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-600">
            <Users size={18} className="text-white" />
            </div>
            <div>
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            <p className="text-xs text-gray-600">{description}</p>
            </div>
        </div>
        </div>
    </div>

    {/* Filters y search */}
    <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="flex-1">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-gray-50 border border-gray-300 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500">
            <Search size={15} className="text-gray-500" />
            <input
                type="text"
                placeholder="Buscar por nombre o email..."
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

        {/* Filters */}
        <div className="flex gap-2">
            <select
            value={filters.role || ''}
            onChange={e =>
                handleFilterChange(
                'role',
                e.target.value || undefined
                )
            }
            className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
            <option value="">Todos los roles</option>
            <option value="student">Estudiantes</option>
            <option value="mentor">Mentores</option>
            <option value="admin">Admins</option>
            </select>

            <select
            value={
                filters.isBlocked !== undefined
                ? filters.isBlocked
                    ? 'blocked'
                    : 'active'
                : ''
            }
            onChange={e => {
                const val = e.target.value
                if (val === 'blocked') {
                handleFilterChange('isBlocked', true)
                handleFilterChange('isActive', undefined)
                } else if (val === 'active') {
                handleFilterChange('isBlocked', false)
                handleFilterChange('isActive', true)
                } else {
                handleFilterChange('isBlocked', undefined)
                handleFilterChange('isActive', undefined)
                }
            }}
            className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="blocked">Bloqueados</option>
            </select>
        </div>
        </div>
    </div>

    {/* Table */}
    <div className="p-5">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
            <div className="h-96">
            <Spinner size={32} />
            </div>
        ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-100">
                <Users size={26} className="text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">
                No se encontraron usuarios
            </p>
            </div>
        ) : (
            <>
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Rol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Registro
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Acciones
                    </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {users.map(u => (
                    <tr
                        key={u._id}
                        className="hover:bg-gray-50 transition-colors"
                    >
                        <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                            <img
                            src={
                                u.avatar || 'https://i.pravatar.cc/150?img=1'
                            }
                            alt={u.firstName}
                            className="w-8 h-8 rounded-lg object-cover"
                            />
                            <div>
                            <p className="text-sm font-medium text-gray-900">
                                {u.firstName} {u.lastName}
                            </p>
                            </div>
                        </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                        {u.email}
                        </td>
                        <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                        </td>
                        <td className="px-4 py-3">
                        <StatusBadge
                            isActive={u.isActive}
                            isBlocked={u.isBlocked}
                        />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(u.createdAt).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-4 py-3">
                        <button
                            onClick={() => setSelectedUserId(u._id)}
                            className="p-2 rounded-lg transition-colors text-purple-600 hover:bg-purple-50"
                        >
                            <User size={16} />
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                    Página {pagination.currentPage} de {pagination.totalPages} ·{' '}
                    {pagination.totalItems} total
                </div>
                <div className="flex gap-2">
                    <button
                    onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                    }
                    disabled={!pagination.hasPrevPage}
                    className="p-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <ChevronLeft size={16} />
                    </button>
                    <button
                    onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                    }
                    disabled={!pagination.hasNextPage}
                    className="p-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <ChevronRight size={16} />
                    </button>
                </div>
                </div>
            )}
            </>
        )}
        </div>
    </div>

    {/* Modal de detalle */}
    <UserDetailModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onUpdate={() => {
        setSelectedUserId(null)
        fetchUsers()
        showToast('Usuario actualizado exitosamente', 'success')
        }}
    />

    <style>{`
        @keyframes slideInToast {
        from { transform: translateY(-12px); opacity: 0; }
        to   { transform: translateY(0);     opacity: 1; }
        }
    `}</style>
    </div>
)
}

export default AdminUserManagement