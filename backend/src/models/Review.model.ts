import { Schema, model, Document, Types } from 'mongoose'

export interface IReview extends Document {
  bookingId: Types.ObjectId
  studentId: Types.ObjectId
  mentorId: Types.ObjectId
  rating: number
  comment: string
  createdAt: Date
  updatedAt: Date
}

const reviewSchema = new Schema<IReview>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'Mentor',
      required: [true, 'Mentor ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [1000, 'Comment must not exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
)

// Índices
reviewSchema.index({ bookingId: 1 })
reviewSchema.index({ mentorId: 1 })
reviewSchema.index({ studentId: 1 })
reviewSchema.index({ rating: -1 })

export const Review = model<IReview>('Review', reviewSchema)
