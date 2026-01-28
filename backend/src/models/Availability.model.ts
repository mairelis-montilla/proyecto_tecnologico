import { Schema, model, Document, Types } from 'mongoose'

export interface IAvailability extends Document {
  mentorId: Types.ObjectId
  dayOfWeek: number
  startTime: string
  endTime: string
  duration: number
  isActive: boolean
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
    dayOfWeek: {
      type: Number,
      required: [true, 'Day of week is required'],
      min: 0,
      max: 6,
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
  },
  {
    timestamps: true,
  }
)

// Índices
availabilitySchema.index({ mentorId: 1, dayOfWeek: 1 })
availabilitySchema.index({ isActive: 1 })

export const Availability = model<IAvailability>(
  'Availability',
  availabilitySchema
)
