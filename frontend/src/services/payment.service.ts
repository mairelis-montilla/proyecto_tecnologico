import { api } from './api'
import type {
  StudentPayment,
  StudentPaymentsFilter,
  Pagination,
} from '../types/payment.types'

export interface StudentPaymentsResponse {
  status: string
  data: { payments: StudentPayment[] }
  pagination: Pagination
}

export const paymentService = {
  // GET /api/payments/my-payments — lista de pagos del estudiante
  getMyPayments: async (
    params?: StudentPaymentsFilter
  ): Promise<StudentPaymentsResponse> => {
    const response = await api.get<StudentPaymentsResponse>(
      '/payments/my-payments',
      { params }
    )
    return response.data
  },

  // GET /api/payments/history — historial completo (mismos datos)
  getPaymentHistory: async (
    params?: StudentPaymentsFilter
  ): Promise<StudentPaymentsResponse> => {
    const response = await api.get<StudentPaymentsResponse>(
      '/payments/history',
      { params }
    )
    return response.data
  },
}
