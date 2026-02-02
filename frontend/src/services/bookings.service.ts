import { api } from './api'
import type {
  Booking,
  BookingResponse,
  BookingsListResponse,
  CreateBookingRequest,
  PaymentProofRequest,
  CancelBookingRequest,
  RefundPolicy,
  RefundPolicyResponse,
  BookingsFilter,
} from '../types/booking.types'

export const bookingsService = {
  /**
   * Crear una nueva reserva (US2)
   */
  async createBooking(data: CreateBookingRequest): Promise<BookingResponse> {
    const response = await api.post<BookingResponse>('/bookings', data)
    return response.data
  },

  /**
   * Subir comprobante de pago (US3)
   */
  async uploadPaymentProof(data: PaymentProofRequest): Promise<BookingResponse> {
    const formData = new FormData()
    formData.append('paymentMethod', data.paymentMethod)
    formData.append('amountPaid', data.amountPaid.toString())
    formData.append('proofImage', data.proofImage)

    const response = await api.post<BookingResponse>(
      `/bookings/${data.bookingId}/payment-proof`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * Obtener mis reservas como estudiante (US4)
   */
  async getMyBookings(params?: BookingsFilter): Promise<BookingsListResponse> {
    const response = await api.get<BookingsListResponse>('/bookings/my', {
      params,
    })
    return response.data
  },

  /**
   * Obtener detalles de una reserva
   */
  async getBookingById(id: string): Promise<BookingResponse> {
    const response = await api.get<BookingResponse>(`/bookings/${id}`)
    return response.data
  },

  /**
   * Cancelar una reserva (US5)
   */
  async cancelBooking(data: CancelBookingRequest): Promise<BookingResponse> {
    const response = await api.post<BookingResponse>(
      `/bookings/${data.bookingId}/cancel`,
      { reason: data.reason }
    )
    return response.data
  },

  /**
   * Obtener politica de reembolso para una reserva
   */
  async getRefundPolicy(bookingId: string): Promise<RefundPolicyResponse> {
    const response = await api.get<RefundPolicyResponse>(
      `/bookings/${bookingId}/refund-policy`
    )
    return response.data
  },

  /**
   * Calcular reembolso basado en horas antes de la sesion (helper del lado del cliente)
   */
  calculateRefund(hoursBeforeSession: number): RefundPolicy {
    if (hoursBeforeSession >= 24) {
      return {
        hoursBeforeSession,
        refundPercentage: 100,
        description:
          'Reembolso completo (100%) - Cancelacion con mas de 24 horas de anticipacion',
      }
    } else if (hoursBeforeSession >= 12) {
      return {
        hoursBeforeSession,
        refundPercentage: 50,
        description:
          'Reembolso parcial (50%) - Cancelacion entre 12 y 24 horas de anticipacion',
      }
    } else {
      return {
        hoursBeforeSession,
        refundPercentage: 0,
        description:
          'Sin reembolso (0%) - Cancelacion con menos de 12 horas de anticipacion',
      }
    }
  },
}
