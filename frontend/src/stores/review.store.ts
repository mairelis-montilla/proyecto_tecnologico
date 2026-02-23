import { create } from 'zustand'
import { reviewService } from '@/services/review.service'
import type {
  Review,
  ReviewStats,
  ReviewPagination,
  CreateReviewPayload,
} from '@/types/reviews.types'

interface ReviewState {
  // Estado lista de reseñas
  reviews: Review[]
  stats: ReviewStats | null
  pagination: ReviewPagination | null
  currentMentorId: string | null
  isLoading: boolean
  error: string | null

  // Estado formulario de calificación
  isSubmitting: boolean
  submitError: string | null
  submitSuccess: boolean

  // Acciones
  fetchReviews: (mentorId: string, page?: number) => Promise<void>
  fetchMyReviews: (page?: number) => Promise<void>
  goToPage: (page: number) => void
  submitReview: (payload: CreateReviewPayload) => Promise<Review | null>
  resetSubmitState: () => void
  clearError: () => void
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  stats: null,
  pagination: null,
  currentMentorId: null,
  isLoading: false,
  error: null,

  isSubmitting: false,
  submitError: null,
  submitSuccess: false,

  fetchReviews: async (mentorId: string, page = 1) => {
    set({ isLoading: true, error: null, currentMentorId: mentorId })
    try {
      const response = await reviewService.getReviewsByMentor(mentorId, {
        page,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      set({
        reviews: response.data.reviews,
        stats: response.data.stats,
        pagination: response.data.pagination,
        isLoading: false,
      })
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } }
        message?: string
      }
      const message =
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        'Error al cargar las reseñas'
      set({ error: message, isLoading: false })
    }
  },

  fetchMyReviews: async (page = 1) => {
    set({ isLoading: true, error: null, currentMentorId: 'me' })
    try {
      const response = await reviewService.getMyReviews({ page, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
      set({ reviews: response.data.reviews, stats: response.data.stats, pagination: response.data.pagination, isLoading: false })
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string }
      set({ error: axiosError?.response?.data?.message || axiosError?.message || 'Error al cargar las reseñas', isLoading: false })
    }
  },

  goToPage: (page: number) => {
    const mentorId = get().currentMentorId
    if (mentorId === 'me') {
      get().fetchMyReviews(page)
    } else if (mentorId) {
      get().fetchReviews(mentorId, page)
    }
  },

  submitReview: async (payload: CreateReviewPayload) => {
    set({ isSubmitting: true, submitError: null, submitSuccess: false })
    try {
      const response = await reviewService.createReview(payload)
      set({ isSubmitting: false, submitSuccess: true })
      // Refrescar la lista automáticamente si estamos viendo al mismo mentor
      if (get().currentMentorId === payload.mentorId) {
        get().fetchReviews(payload.mentorId, 1)
      }
      return response.data.review
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } }
        message?: string
      }
      const message =
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        'No se pudo enviar la reseña'
      set({ submitError: message, isSubmitting: false })
      return null
    }
  },

  resetSubmitState: () =>
    set({ isSubmitting: false, submitError: null, submitSuccess: false }),

  clearError: () => set({ error: null }),
}))
