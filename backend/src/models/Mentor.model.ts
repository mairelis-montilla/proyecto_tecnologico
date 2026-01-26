import { Schema, model, Document, Types } from 'mongoose'

export interface IMentor extends Document {
  userId: Types.ObjectId
  title: string
  bio: string
  specialties: Types.ObjectId[]
  experience: string
  yearsOfExperience: number
  credentials: string[]
  languages: string[]
  rating: number
  totalSessions: number
  hourlyRate?: number
  profileStatus: 'draft' | 'published'
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
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title must not exceed 100 characters'],
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio must not exceed 500 characters'],
      default: '',
    },
    specialties: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Specialty',
      },
    ],
    experience: {
      type: String,
      trim: true,
      default: '',
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
      max: 50,
    },
    credentials: [
      {
        type: String,
        trim: true,
      },
    ],
    languages: [
      {
        type: String,
        trim: true,
        lowercase: true,
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
    profileStatus: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
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

// Índices (userId ya tiene índice por unique: true)
mentorSchema.index({ specialties: 1 })
mentorSchema.index({ rating: -1 })
mentorSchema.index({ isApproved: 1, isActive: 1 })
mentorSchema.index({ profileStatus: 1 })
mentorSchema.index({ languages: 1 })

export const Mentor = model<IMentor>('Mentor', mentorSchema)
