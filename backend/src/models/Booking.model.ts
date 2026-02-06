import { Schema, model, Document, Types } from 'mongoose'

export type BookingStatus =
  | 'pending_payment'
  | 'payment_uploaded'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export type PaymentMethod = 'yape' | 'plin' | 'transferencia'

export interface IPaymentProof {
  imageUrl: string
  method: PaymentMethod
  amountPaid: number
  uploadedAt: Date
}

export interface ICancellation {
  reason?: string
  cancelledAt: Date
  cancelledBy: 'student' | 'mentor' | 'admin'
  refundPercentage: number
}

export interface IBooking extends Document {
  studentId: Types.ObjectId
  mentorId: Types.ObjectId
  scheduledAt: Date
  duration: number
  topic: string
  message?: string
  status: BookingStatus
  totalAmount: number
  paymentProof?: IPaymentProof
  cancellation?: ICancellation
  createdAt: Date
  updatedAt: Date
}

const paymentProofSchema = new Schema<IPaymentProof>(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      enum: ['yape', 'plin', 'transferencia'],
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
)

const cancellationSchema = new Schema<ICancellation>(
  {
    reason: {
      type: String,
      maxlength: 500,
    },
    cancelledAt: {
      type: Date,
      required: true,
    },
    cancelledBy: {
      type: String,
      enum: ['student', 'mentor', 'admin'],
      required: true,
    },
    refundPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
)

const bookingSchema = new Schema<IBooking>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'Mentor',
      required: [true, 'Mentor ID is required'],
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      default: 60,
      enum: [45, 60],
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      maxlength: [200, 'Topic must not exceed 200 characters'],
    },
    message: {
      type: String,
      maxlength: [500, 'Message must not exceed 500 characters'],
    },
    status: {
      type: String,
      enum: [
        'pending_payment',
        'payment_uploaded',
        'confirmed',
        'completed',
        'cancelled',
        'refunded',
      ],
      default: 'pending_payment',
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    paymentProof: paymentProofSchema,
    cancellation: cancellationSchema,
  },
  {
    timestamps: true,
  }
)

// Índices
bookingSchema.index({ studentId: 1, status: 1 })
bookingSchema.index({ mentorId: 1, status: 1 })
bookingSchema.index({ scheduledAt: 1 })
bookingSchema.index({ status: 1 })

// Prevenir duplicados en la misma fecha/hora para el mentor
bookingSchema.index(
  { mentorId: 1, scheduledAt: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['cancelled', 'refunded'] } },
  }
)

export const Booking = model<IBooking>('Booking', bookingSchema)
