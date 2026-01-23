import { Schema, model, Document, Types } from 'mongoose'

export interface IBooking extends Document {
  studentId: Types.ObjectId
  mentorId: Types.ObjectId
  specialty: Types.ObjectId
  scheduledDate: Date
  startTime: string
  endTime: string
  duration: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  meetingLink?: string
  notes?: string
  cancellationReason?: string
  createdAt: Date
  updatedAt: Date
}

const bookingSchema = new Schema<IBooking>(
  {
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
    specialty: {
      type: Schema.Types.ObjectId,
      ref: 'Specialty',
      required: [true, 'Specialty is required'],
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Invalid time format (HH:MM)',
      ],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Invalid time format (HH:MM)',
      ],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      default: 60,
      min: 15,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    meetingLink: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
      maxlength: [500, 'Notes must not exceed 500 characters'],
    },
    cancellationReason: {
      type: String,
      default: null,
      maxlength: [500, 'Cancellation reason must not exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
)

// Índices
bookingSchema.index({ studentId: 1, status: 1 })
bookingSchema.index({ mentorId: 1, status: 1 })
bookingSchema.index({ scheduledDate: 1 })
bookingSchema.index({ status: 1 })

// Prevenir duplicados en la misma fecha/hora
bookingSchema.index(
  { mentorId: 1, scheduledDate: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } }
)

export const Booking = model<IBooking>('Booking', bookingSchema)
