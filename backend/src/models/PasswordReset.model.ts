import { Schema, model, Document, Types } from 'mongoose'
import crypto from 'crypto'

export interface IPasswordReset extends Document {
  userId: Types.ObjectId
  token: string
  expiresAt: Date
  isUsed: boolean
  usedAt?: Date
  createdAt: Date
}

const passwordResetSchema = new Schema<IPasswordReset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Índices
passwordResetSchema.index({ userId: 1 })
passwordResetSchema.index({ token: 1 })
// TTL: Auto-eliminar tokens expirados después de 24 horas
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Método estático para generar token seguro
passwordResetSchema.statics.generateToken = function (): string {
  return crypto.randomBytes(32).toString('hex')
}

// Método estático para crear un nuevo reset con expiración de 1 hora
passwordResetSchema.statics.createReset = async function (
  userId: Types.ObjectId
) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

  // Invalidar tokens anteriores del usuario
  await this.updateMany({ userId, isUsed: false }, { isUsed: true })

  return this.create({
    userId,
    token,
    expiresAt,
  })
}

// Método para verificar si el token es válido
passwordResetSchema.methods.isValid = function (): boolean {
  return !this.isUsed && this.expiresAt > new Date()
}

export const PasswordReset = model<IPasswordReset>(
  'PasswordReset',
  passwordResetSchema
)
