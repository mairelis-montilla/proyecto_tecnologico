import { api } from './api'
import type {
  GetReviewsResponse,
  CreateReviewPayload,
  CreateReviewResponse,
} from '../types/reviews.types'

interface GetReviewsParams {
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'rating'
  sortOrder?: 'asc' | 'desc'
}

export const reviewService = {
  /**
   * GET /api/reviews/mentor/:mentorId
   * Obtiene las reseñas paginadas de un mentor junto con sus estadísticas.
   */
  async getReviewsByMentor(
    mentorId: string,
    params: GetReviewsParams = {}
  ): Promise<GetReviewsResponse> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params

    const response = await api.get<GetReviewsResponse>(
      `/reviews/mentor/${mentorId}`,
      { params: { page, limit, sortBy, sortOrder } }
    )
    return response.data
  },

  /**
   * POST /api/reviews
   * Crea una nueva reseña para un mentor tras una sesión completada.
   */
  async createReview(
    payload: CreateReviewPayload
  ): Promise<CreateReviewResponse> {
    const response = await api.post<CreateReviewResponse>('/reviews', payload)
    return response.data
  },
}
