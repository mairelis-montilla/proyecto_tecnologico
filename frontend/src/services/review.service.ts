import type {
    GetReviewsResponse,
    CreateReviewPayload,
    CreateReviewResponse,
} from '../types/reviews.types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

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
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params

        const query = new URLSearchParams({
            page: String(page),
            limit: String(limit),
            sortBy,
            sortOrder,
        })

        const response = await fetch(
            `${API_BASE_URL}/reviews/mentor/${mentorId}?${query.toString()}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            }
        )

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.message ?? `Error ${response.status}`)
        }

        return response.json() as Promise<GetReviewsResponse>
    },

    /**
     * POST /api/reviews
     * Crea una nueva reseña para un mentor tras una sesión completada.
     */
    async createReview(payload: CreateReviewPayload): Promise<CreateReviewResponse> {
        const response = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.message ?? `Error ${response.status}`)
        }

        return response.json() as Promise<CreateReviewResponse>
    },
}