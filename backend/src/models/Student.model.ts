import { Schema, model, Document, Types } from 'mongoose'

export interface IStudent extends Document {
  userId: Types.ObjectId
  bio?: string
  institution?: string
  career?: string
  semester?: number
  interests: Types.ObjectId[]
  totalSessions: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const studentSchema = new Schema<IStudent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio must not exceed 500 characters'],
      default: null,
    },
    institution: {
      type: String,
      trim: true,
      default: null,
    },
    career: {
      type: String,
      trim: true,
      default: null,
    },
    semester: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
    },
    interests: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Specialty',
      },
    ],
    totalSessions: {
      type: Number,
      default: 0,
      min: 0,
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
studentSchema.index({ institution: 1 })
studentSchema.index({ interests: 1 })
studentSchema.index({ isActive: 1 })

export const Student = model<IStudent>('Student', studentSchema)
