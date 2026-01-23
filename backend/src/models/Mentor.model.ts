import { Schema, model, Document, Types } from 'mongoose'

export interface IMentor extends Document {
  userId: Types.ObjectId
  bio: string
  specialties: Types.ObjectId[]
  experience: string
  credentials: string[]
  rating: number
  totalSessions: number
  hourlyRate?: number
  isApproved: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const mentorSchema = new Schema<IMentor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    bio: {
      type: String,
      required: [true, 'Bio is required'],
      trim: true,
      maxlength: [1000, 'Bio must not exceed 1000 characters'],
    },
    specialties: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Specialty',
      },
    ],
    experience: {
      type: String,
      required: [true, 'Experience is required'],
      trim: true,
    },
    credentials: [
      {
        type: String,
        trim: true,
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalSessions: {
      type: Number,
      default: 0,
      min: 0,
    },
    hourlyRate: {
      type: Number,
      default: null,
      min: 0,
    },
    isApproved: {
      type: Boolean,
      default: false,
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
mentorSchema.index({ userId: 1 })
mentorSchema.index({ specialties: 1 })
mentorSchema.index({ rating: -1 })
mentorSchema.index({ isApproved: 1, isActive: 1 })

export const Mentor = model<IMentor>('Mentor', mentorSchema)
