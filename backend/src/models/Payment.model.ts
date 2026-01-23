import { Schema, model, Document, Types } from 'mongoose'

export interface IPayment extends Document {
  bookingId: Types.ObjectId
  studentId: Types.ObjectId
  mentorId: Types.ObjectId
  amount: number
  currency: 'PEN' | 'USD'
  paymentMethod: 'yape' | 'plin' | 'transfer' | 'cash'
  status:
    | 'pending_proof'
    | 'pending_validation'
    | 'validated'
    | 'rejected'
    | 'refunded'
  // Comprobante de pago (imagen subida por estudiante)
  proofImage?: string
  proofUploadedAt?: Date
  // Validación por admin
  validatedBy?: Types.ObjectId
  validatedAt?: Date
  rejectionReason?: string
  // Distribución del pago
  platformFee: number
  mentorEarnings: number
  // Notas adicionales
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'Mentor',
      required: [true, 'Mentor ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    currency: {
      type: String,
      enum: ['PEN', 'USD'],
      default: 'PEN',
    },
    paymentMethod: {
      type: String,
      enum: ['yape', 'plin', 'transfer', 'cash'],
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: [
        'pending_proof',
        'pending_validation',
        'validated',
        'rejected',
        'refunded',
      ],
      default: 'pending_proof',
    },
    // Comprobante de pago
    proofImage: {
      type: String,
      default: null,
    },
    proofUploadedAt: {
      type: Date,
      default: null,
    },
    // Validación administrativa
    validatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    validatedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      maxlength: [500, 'Rejection reason must not exceed 500 characters'],
    },
    // Distribución del pago (calculado automáticamente)
    platformFee: {
      type: Number,
      required: true,
      min: 0,
    },
    mentorEarnings: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      default: null,
      maxlength: [500, 'Notes must not exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
)

// Índices
paymentSchema.index({ bookingId: 1 })
paymentSchema.index({ studentId: 1 })
paymentSchema.index({ mentorId: 1 })
paymentSchema.index({ status: 1 })
paymentSchema.index({ createdAt: -1 })
paymentSchema.index({ validatedBy: 1, status: 1 })

// Calcular comisión antes de guardar (10% plataforma, 90% mentor)
paymentSchema.pre('save', function (next) {
  if (this.isModified('amount')) {
    const PLATFORM_FEE_PERCENTAGE = 0.1 // 10%
    this.platformFee =
      Math.round(this.amount * PLATFORM_FEE_PERCENTAGE * 100) / 100
    this.mentorEarnings =
      Math.round((this.amount - this.platformFee) * 100) / 100
  }
  next()
})

export const Payment = model<IPayment>('Payment', paymentSchema)
