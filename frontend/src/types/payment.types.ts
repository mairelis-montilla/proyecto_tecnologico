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
  hasPrevPage: boolean
  hasNextPage: boolean
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

// ---- Student payments ----

// Mentor populado dentro del booking del pago de estudiante
export interface StudentPaymentMentor {
  _id: string
  title?: string
  hourlyRate?: number
  userId: {
    _id: string
    firstName: string
    lastName: string
    avatar?: string
  }
}

// Booking populado dentro del pago del estudiante
export interface StudentPaymentBooking {
  _id: string
  topic: string
  scheduledAt: string
  duration: number
  totalAmount: number
  mentorId: StudentPaymentMentor
}

// Pago del estudiante (como lo devuelve /payments/my-payments)
export interface StudentPayment {
  _id: string
  bookingId: StudentPaymentBooking
  amount: number
  currency: 'PEN' | 'USD'
  paymentMethod: PaymentMethodBackend
  status: PaymentStatus
  proofImage?: string
  proofUploadedAt?: string
  validatedAt?: string
  rejectionReason?: string
  platformFee: number
  mentorEarnings: number
  createdAt: string
  updatedAt: string
}

export interface StudentPaymentsFilter {
  status?: PaymentStatus
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}

// ---- Mentor earnings ----

export interface EarningsSummary {
  totalEarnings: number
  currentMonth: number
  pendingAmount: number
  pendingCount: number
}

// Estudiante populado dentro del booking del earning
export interface EarningStudent {
  _id: string
  userId: {
    _id: string
    firstName: string
    lastName: string
    avatar?: string
  }
}

export interface EarningBooking {
  _id: string
  topic: string
  scheduledAt: string
  duration: number
  studentId: EarningStudent
}

// Ingreso individual del mentor
export interface MentorEarning {
  _id: string
  bookingId: EarningBooking
  amount: number
  mentorEarnings: number
  platformFee: number
  currency: 'PEN' | 'USD'
  paymentMethod: PaymentMethodBackend
  status: PaymentStatus
  validatedAt?: string
  createdAt: string
}

export interface EarningsFilter {
  period?: 'week' | 'month' | 'year' | 'all'
  page?: number
  limit?: number
}
