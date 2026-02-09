// Estados de pago
export type PaymentStatus =
  | 'pending_proof'
  | 'pending_validation'
  | 'validated'
  | 'rejected'
  | 'refunded'

// Metodos de pago del modelo Payment
export type PaymentMethodBackend = 'yape' | 'plin' | 'transfer' | 'cash'

// Datos del booking populado dentro del payment
export interface PaymentBooking {
  _id: string
  scheduledAt: string
  duration: number
  topic: string
  status: string
  totalAmount: number
  studentId: {
    _id: string
    userId: {
      _id: string
      firstName: string
      lastName: string
      avatar?: string
      email: string
    }
  }
  mentorId: {
    _id: string
    userId: {
      _id: string
      firstName: string
      lastName: string
      avatar?: string
      email: string
    }
    hourlyRate: number
    title?: string
  }
}

// Entidad de pago (como viene del backend con populate)
export interface AdminPayment {
  _id: string
  bookingId: PaymentBooking
  studentId: {
    _id: string
    firstName: string
    lastName: string
    avatar?: string
    email: string
  }
  mentorId: string
  amount: number
  currency: 'PEN' | 'USD'
  paymentMethod: PaymentMethodBackend
  status: PaymentStatus
  proofImage?: string
  proofUploadedAt?: string
  validatedBy?: string
  validatedAt?: string
  rejectionReason?: string
  platformFee: number
  mentorEarnings: number
  notes?: string
  createdAt: string
  updatedAt: string
}

// Paginacion generica
export interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
}

// Response de lista de pagos
export interface PaymentsListResponse {
  status: string
  data: {
    payments: AdminPayment[]
    pagination: Pagination
  }
}

// Response de accion sobre un pago
export interface PaymentActionResponse {
  status: string
  message: string
  data: {
    payment: AdminPayment
  }
}

// Filtros para obtener pagos
export interface PaymentsFilter {
  page?: number
  limit?: number
  status?: PaymentStatus
}
