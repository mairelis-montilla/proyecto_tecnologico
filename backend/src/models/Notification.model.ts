import { Schema, model, Document, Types } from 'mongoose'

export interface INotification extends Document {
  userId: Types.ObjectId
  type:
    | 'booking_request'
    | 'booking_confirmed'
    | 'booking_rejected'
    | 'booking_cancelled'
    | 'booking_reminder'
    | 'payment_pending'
    | 'payment_validated'
    | 'payment_rejected'
    | 'review_received'
    | 'mentor_approved'
    | 'system'
  title: string
  message: string
  relatedId?: Types.ObjectId
  relatedModel?: 'Booking' | 'Payment' | 'Review' | 'Mentor'
  isRead: boolean
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    type: {
      type: String,
      enum: [
        'booking_request',
        'booking_confirmed',
        'booking_rejected',
        'booking_cancelled',
        'booking_reminder',
        'payment_pending',
        'payment_validated',
        'payment_rejected',
        'review_received',
        'mentor_approved',
        'system',
      ],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title must not exceed 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [500, 'Message must not exceed 500 characters'],
    },
    // Referencia polimórfica al recurso relacionado
    relatedId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    relatedModel: {
      type: String,
      enum: ['Booking', 'Payment', 'Review', 'Mentor'],
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Índices
notificationSchema.index({ userId: 1, isRead: 1 })
notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ type: 1 })
// TTL: Auto-eliminar notificaciones leídas después de 30 días
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

export const Notification = model<INotification>('Notification', notificationSchema)
