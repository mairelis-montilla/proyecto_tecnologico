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
