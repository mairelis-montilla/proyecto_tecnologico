import { Schema, model, Document, Types } from 'mongoose'

export interface IPaymentInfo {
  yape?: string
  plin?: string
  bankName?: string
  bankAccount?: string
  bankCci?: string
}

export interface IMentor extends Document {
  userId: Types.ObjectId
  title: string
  bio: string
  timezone: string
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
  paymentInfo?: IPaymentInfo
  createdAt: Date
  updatedAt: Date
}

const paymentInfoSchema = new Schema<IPaymentInfo>(
  {
    yape: { type: String, trim: true, default: '' },
    plin: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    bankAccount: { type: String, trim: true, default: '' },
    bankCci: { type: String, trim: true, default: '' },
  },
  { _id: false }
)

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
    timezone: {
      type: String,
      default: 'America/Lima',
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
    paymentInfo: {
      type: paymentInfoSchema,
      default: () => ({}),
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
