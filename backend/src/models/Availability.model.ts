import { Schema, model, Document, Types } from 'mongoose'

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly'

export interface IAvailability extends Document {
  mentorId: Types.ObjectId
  // Para slots de fecha específica
  date?: Date
  // Para slots recurrentes (legacy - opcional si hay date)
  dayOfWeek?: number
  startTime: string
  endTime: string
  duration: number
  isActive: boolean
  // Configuración de recurrencia
  recurrence: RecurrenceType
  recurrenceEndDate?: Date
  createdAt: Date
  updatedAt: Date
}

const availabilitySchema = new Schema<IAvailability>(
  {
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'Mentor',
      required: [true, 'Mentor ID is required'],
    },
    // Fecha específica para el slot
    date: {
      type: Date,
      default: null,
    },
    // Día de la semana (0-6, donde 0 = domingo) - solo para recurrencia semanal legacy
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: null,
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
      enum: [45, 60],
      default: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none',
    },
    recurrenceEndDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Índices
availabilitySchema.index({ mentorId: 1, date: 1 })
availabilitySchema.index({ mentorId: 1, dayOfWeek: 1 })
availabilitySchema.index({ isActive: 1 })
availabilitySchema.index({ date: 1 })

export const Availability = model<IAvailability>(
  'Availability',
  availabilitySchema
)
