// Estados de reserva/sesion
export type BookingStatus =
  | 'pending_payment' // Reserva creada, esperando comprobante
  | 'payment_uploaded' // Comprobante subido, esperando validacion del admin
  | 'payment_validated' // Pago validado por admin, esperando aprobacion del mentor
  | 'confirmed' // Aprobada por mentor
  | 'completed' // Sesion realizada
  | 'cancelled' // Cancelada
  | 'refunded' // Reembolsada
  | 'rejected' // Rechazada por mentor

// Metodos de pago disponibles
export type PaymentMethod = 'yape' | 'plin' | 'transferencia'

// Slot de tiempo del calendario
export interface TimeSlot {
  date: string
  dayOfWeek: number
  startTime: string
  endTime: string
  startIso: string
  endIso: string
  duration: number
}

// Datos del mentor en una reserva
export interface BookingMentor {
  _id: string
  userId: {
    _id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  hourlyRate: number
  title?: string
}

// Datos del estudiante en una reserva
export interface BookingStudent {
  _id: string
  userId: {
    _id: string
    firstName: string
    lastName: string
    avatar?: string
  }
}

// Comprobante de pago
export interface PaymentProof {
  imageUrl: string
  method: PaymentMethod
  amountPaid: number
  uploadedAt: string
}

// Informacion de cancelacion
export interface CancellationInfo {
  reason?: string
  cancelledAt: string
  cancelledBy: 'student' | 'mentor' | 'admin' | 'system'
  refundPercentage: number
}

// Informacion de rechazo
export interface RejectionInfo {
  reason: string
  rejectedAt: string
}

// Entidad de reserva/sesion
export interface Booking {
  _id: string
  mentorId: BookingMentor
  studentId: BookingStudent
  scheduledAt: string // ISO datetime
  duration: number // minutos
  topic: string
  message?: string
  status: BookingStatus
  totalAmount: number
  paymentDeadline?: string // ISO datetime - limite para subir comprobante
  isWithin24Hours?: boolean // calculado por el backend
  hasReview?: boolean // calculado por el backend: si ya existe una calificación
  meetLink?: string // Link de Google Meet (se agrega al confirmar)
  paymentProof?: PaymentProof
  cancellation?: CancellationInfo
  rejection?: RejectionInfo
  createdAt: string
  updatedAt: string
}

// Request para crear una reserva
export interface CreateBookingRequest {
  mentorId: string
  slotStartIso: string
  slotEndIso: string
  topic: string // Requerido
  message?: string // Opcional
}

// Request para subir comprobante de pago
export interface PaymentProofRequest {
  bookingId: string
  paymentMethod: PaymentMethod
  amountPaid: number
  proofImage: File // PNG, JPG, PDF - max 5MB
}

// Request para cancelar reserva
export interface CancelBookingRequest {
  bookingId: string
  reason?: string
}

// Politica de reembolso
export interface RefundPolicy {
  hoursBeforeSession: number
  refundPercentage: number
  description: string
}

// Response de una reserva
export interface BookingResponse {
  status: string
  data: {
    booking: Booking
  }
}

// Response de cancelacion con info de reembolso
export interface CancelBookingResponse {
  status: string
  data: {
    booking: Booking
    refundAmount: number
    refundPercentage: number
    hoursBeforeSession: number
  }
}

// Response de lista de reservas
export interface BookingsListResponse {
  status: string
  data: {
    bookings: Booking[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
    }
  }
}

// Response de politica de reembolso
export interface RefundPolicyResponse {
  status: string
  data: {
    policy: RefundPolicy
    hoursRemaining: number
    refundPercentage: number
  }
}

// Request para rechazar reserva (mentor)
export interface RejectBookingRequest {
  bookingId: string
  reason: string
}

// Response del conteo de pendientes (mentor)
export interface PendingCountResponse {
  status: string
  data: {
    pendingCount: number
  }
}

// Filtros para obtener reservas
export interface BookingsFilter {
  status?:
    | 'upcoming'
    | 'past'
    | 'cancelled'
    | 'pending_review'
    | 'confirmed'
    | 'completed'
  page?: number
  limit?: number
}
