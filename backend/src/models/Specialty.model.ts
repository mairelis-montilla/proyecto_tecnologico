import { Schema, model, Document } from 'mongoose'

export interface ISpecialty extends Document {
  name: string
  description: string
  category: string
  icon?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const specialtySchema = new Schema<ISpecialty>(
  {
    name: {
      type: String,
      required: [true, 'Specialty name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    icon: {
      type: String,
      default: null,
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
specialtySchema.index({ name: 1 })
specialtySchema.index({ category: 1 })

export const Specialty = model<ISpecialty>('Specialty', specialtySchema)
