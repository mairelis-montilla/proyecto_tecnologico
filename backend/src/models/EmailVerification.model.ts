import { Schema, model, Document, Types } from 'mongoose'

export interface IEmailVerification extends Document {
  userId: Types.ObjectId
  code: string
  type: 'email_verification' | 'password_reset'
  expiresAt: Date
  isUsed: boolean
  usedAt?: Date
  attempts: number
  createdAt: Date
}

const emailVerificationSchema = new Schema<IEmailVerification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    code: {
      type: String,
      required: [true, 'Code is required'],
    },
    type: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      required: [true, 'Type is required'],
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
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Índices
emailVerificationSchema.index({ userId: 1, type: 1 })
emailVerificationSchema.index({ code: 1, type: 1 })
// TTL: Auto-eliminar códigos expirados
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Método estático para generar código de 6 dígitos
emailVerificationSchema.statics.generateCode = function (): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Método estático para crear una nueva verificación
emailVerificationSchema.statics.createVerification = async function (
  userId: Types.ObjectId,
  type: 'email_verification' | 'password_reset'
) {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

  // Invalidar códigos anteriores del mismo tipo para este usuario
  await this.updateMany({ userId, type, isUsed: false }, { isUsed: true })

  return this.create({
    userId,
    code,
    type,
    expiresAt,
  })
}

// Método para verificar si el código es válido
emailVerificationSchema.methods.isValid = function (): boolean {
  return !this.isUsed && this.expiresAt > new Date() && this.attempts < 5
}

// Método para incrementar intentos
emailVerificationSchema.methods.incrementAttempts =
  async function (): Promise<void> {
    this.attempts += 1
    await this.save()
  }

// Método para marcar como usado
emailVerificationSchema.methods.markAsUsed = async function (): Promise<void> {
  this.isUsed = true
  this.usedAt = new Date()
  await this.save()
}

export const EmailVerification = model<IEmailVerification>(
  'EmailVerification',
  emailVerificationSchema
)
