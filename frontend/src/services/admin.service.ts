/**
 * mentorAdmin.service.ts
 *
 * Servicio de administración de mentores (aprobar / rechazar / revocar).
 * Rutas consumidas (backend PTG3-33):
 *   GET    /admin/mentors/pending
 *   GET    /admin/mentors/approved
 *   PATCH  /admin/mentors/:id/approve
 *   PATCH  /admin/mentors/:id/reject   → body { reason }
 *   PATCH  /admin/mentors/:id/revoke
 *
 * Ubicación sugerida: src/services/mentorAdmin.service.ts
 */

import { api } from './api'
import type {
  AdminPayment,
  Pagination,
  PaymentsFilter,
  PaymentActionResponse,
} from '../types/payment.types'
export type UserRole = 'student' | 'mentor' | 'admin'
export type UserStatus = 'active' | 'blocked'

// ─── Tipos (espejo de lo que devuelve el backend con populate) ───────────────

interface PopulatedUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
}

export interface PopulatedSpecialty {
  _id: string
  name: string
  category: string
  icon?: string
}

export interface MentorAdminItem {
  _id: string
  userId: PopulatedUser
  title: string
  bio: string
  specialties: PopulatedSpecialty[]
  experience: string
  yearsOfExperience: number
  credentials: string[]
  languages: string[]
  hourlyRate: number | null
  profileStatus: 'draft' | 'published'
  isApproved: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}
export interface UserAdminItem {
  _id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  role: UserRole
  isActive: boolean
  isBlocked: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

export interface UserDetail extends UserAdminItem {
  // Campos adicionales que solo vienen en el GET /:id
  phone?: string
  bio?: string
  // Campos de bloqueo
  blockReason?: string
  blockedAt?: string
  // Si es mentor
  mentorProfile?: {
    _id: string
    title: string
    bio: string
    specialties: Array<{
      _id: string
      name: string
      category: string
      icon?: string
    }>
    hourlyRate?: number
    rating: number
    totalSessions: number
    isApproved: boolean
  }
  // Si es estudiante
  studentProfile?: {
    _id: string
    interests: Array<{
      _id: string
      name: string
      category: string
      icon?: string
    }>
    enrolledSessions: number
  }
}

export interface UsersFilter {
  page?: number
  limit?: number
  role?: UserRole
  isActive?: boolean
  isBlocked?: boolean
  search?: string // busca en firstName, lastName, email
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  email?: string
  role?: UserRole
  isActive?: boolean
  isBlocked?: boolean
  phone?: string
}

export interface BlockHistoryItem {
  _id: string
  userId: string
  action: 'block' | 'unblock'
  reason: string
  adminId: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
}

// ─── Servicio ────────────────────────────────────────────────────────────────

export const mentorAdminService = {
  /**
   * Trae todos los mentores con isApproved === false
   * GET /admin/mentors/pending
   */
  async getPending(): Promise<MentorAdminItem[]> {
    const response = await api.get<{
      status: string
      data: { mentors: MentorAdminItem[] }
    }>('/admin/mentors/pending')

    return response.data.data.mentors
  },

  /**
   * Trae todos los mentores con isApproved === true
   * GET /admin/mentors/approved
   */
  async getApproved(): Promise<MentorAdminItem[]> {
    const response = await api.get<{
      status: string
      data: { mentors: MentorAdminItem[] }
    }>('/admin/mentors/approved')

    return response.data.data.mentors
  },

  /**
   * Aprueba un mentor por ID
   * PATCH /admin/mentors/:id/approve
   */
  async approve(id: string): Promise<MentorAdminItem> {
    const response = await api.patch<{
      status: string
      data: { mentor: MentorAdminItem }
    }>(`/admin/mentors/${id}/approve`)

    return response.data.data.mentor
  },

  /**
   * Rechaza un mentor por ID con motivo obligatorio
   * PATCH /admin/mentors/:id/reject
   */
  async reject(
    id: string,
    reason: string
  ): Promise<{ id: string; reason: string }> {
    const response = await api.patch<{
      status: string
      data: { id: string; reason: string }
    }>(`/admin/mentors/${id}/reject`, { reason })

    return response.data.data
  },

  /**
   * Revoca la aprobación de un mentor por ID
   * PATCH /admin/mentors/:id/revoke
   */
  async revoke(id: string): Promise<{ id: string }> {
    const response = await api.patch<{
      status: string
      data: { id: string }
    }>(`/admin/mentors/${id}/revoke`)

    return response.data.data
  },
}

// ─── Servicio de pagos para admin ─────────────────────────────────────────────

export const paymentAdminService = {
  /**
   * Obtener pagos pendientes de validación
   * GET /admin/payments/pending
   */
  async getPending(
    params?: PaymentsFilter
  ): Promise<{ payments: AdminPayment[]; pagination: Pagination }> {
    const response = await api.get<{
      status: string
      data: { payments: AdminPayment[]; pagination: Pagination }
    }>('/admin/payments/pending', { params })

    return response.data.data
  },

  /**
   * Obtener todos los pagos (historial)
   * GET /admin/payments
   */
  async getAll(
    params?: PaymentsFilter
  ): Promise<{ payments: AdminPayment[]; pagination: Pagination }> {
    const response = await api.get<{
      status: string
      data: { payments: AdminPayment[]; pagination: Pagination }
    }>('/admin/payments', { params })

    return response.data.data
  },

  /**
   * Aprobar un pago
   * PATCH /admin/payments/:id/approve
   */
  async approve(id: string): Promise<AdminPayment> {
    const response = await api.patch<PaymentActionResponse>(
      `/admin/payments/${id}/approve`
    )

    return response.data.data.payment
  },

  /**
   * Rechazar un pago con motivo obligatorio
   * PATCH /admin/payments/:id/reject
   */
  async reject(id: string, reason: string): Promise<AdminPayment> {
    const response = await api.patch<PaymentActionResponse>(
      `/admin/payments/${id}/reject`,
      { reason }
    )

    return response.data.data.payment
  },
}
//----- Servicios de gestión de usuarios (bloquear/desbloquear) y detalles de usuario para admin -----
export const userAdminService = {
  /**
   * Obtener lista de usuarios con filtros y paginación
   * GET /admin/users
   */
  async getAll(
    filters?: UsersFilter
  ): Promise<{ users: UserAdminItem[]; pagination: Pagination }> {
    const response = await api.get<{
      status: string
      data: { users: UserAdminItem[]; pagination: Pagination }
    }>('/admin/users', { params: filters })

    return response.data.data
  },

  /**
   * Obtener detalle completo de un usuario
   * GET /admin/users/:id
   */
  async getById(id: string): Promise<UserDetail> {
    const response = await api.get<{
      status: string
      data: { user: UserDetail }
    }>(`/admin/users/${id}`)

    return response.data.data.user
  },

  /**
   * Actualizar datos básicos de un usuario
   * PATCH /admin/users/:id
   */
  async update(id: string, data: UpdateUserData): Promise<UserDetail> {
    const response = await api.patch<{
      status: string
      data: { user: UserDetail }
    }>(`/admin/users/${id}`, data)

    return response.data.data.user
  },

  /**
   * Bloquear un usuario con motivo obligatorio
   * PATCH /admin/users/:id/block
   */
  async block(id: string, reason: string): Promise<UserDetail> {
    const response = await api.patch<{
      status: string
      data: { user: UserDetail }
    }>(`/admin/users/${id}/block`, { reason })

    return response.data.data.user
  },

  /**
   * Desbloquear un usuario con motivo obligatorio
   * PATCH /admin/users/:id/unblock
   */
  async unblock(id: string, reason: string): Promise<UserDetail> {
    const response = await api.patch<{
      status: string
      data: { user: UserDetail }
    }>(`/admin/users/${id}/unblock`, { reason })

    return response.data.data.user
  },

  /**
   * Obtener historial de bloqueos de un usuario
   * GET /admin/users/:id/block-history
   */
  async getBlockHistory(id: string): Promise<BlockHistoryItem[]> {
    const response = await api.get<{
      status: string
      data: { history: BlockHistoryItem[] }
    }>(`/admin/users/${id}/block-history`)

    return response.data.data.history
  },
}
