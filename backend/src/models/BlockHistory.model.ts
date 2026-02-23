import { Schema, model, Document, Types } from 'mongoose'

export interface IBlockHistory extends Document {
  userId: Types.ObjectId
  action: 'block' | 'unblock'
  reason: string
  adminId: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const blockHistorySchema = new Schema<IBlockHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    action: {
      type: String,
      enum: ['block', 'unblock'],
      required: [true, 'Action is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [500, 'Reason must not exceed 500 characters'],
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required'],
    },
  },
  {
    timestamps: true,
  }
)

blockHistorySchema.index({ userId: 1, createdAt: -1 })
blockHistorySchema.index({ adminId: 1 })

export const BlockHistory = model<IBlockHistory>(
  'BlockHistory',
  blockHistorySchema
)
