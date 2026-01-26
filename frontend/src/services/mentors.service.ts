import { api } from './api'
import type {
  MentorsResponse,
  SearchMentorsResponse,
  MentorSearchFilters,
  Mentor,
} from '../types/mentor.types'

export const mentorsService = {
  /**
   * Obtener lista de mentores con paginación
   */
  async getMentors(params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    specialty?: string
  }): Promise<MentorsResponse> {
    const response = await api.get('/mentors', { params })
    return response.data
  },

  /**
   * Buscar mentores con filtros avanzados
   */
  async searchMentors(
    filters: MentorSearchFilters
  ): Promise<SearchMentorsResponse> {
    // Limpiar filtros vacíos
    const cleanFilters: Record<string, string | number> = {}

    if (filters.q?.trim()) cleanFilters.q = filters.q.trim()
    if (filters.specialties) cleanFilters.specialties = filters.specialties
    if (filters.category?.trim())
      cleanFilters.category = filters.category.trim()
    if (filters.minRating && filters.minRating > 0)
      cleanFilters.minRating = filters.minRating
    if (filters.minRate && filters.minRate > 0)
      cleanFilters.minRate = filters.minRate
    if (filters.maxRate && filters.maxRate < 200)
      cleanFilters.maxRate = filters.maxRate
    if (filters.languages) cleanFilters.languages = filters.languages
    if (filters.page) cleanFilters.page = filters.page
    if (filters.limit) cleanFilters.limit = filters.limit
    if (filters.sortBy) cleanFilters.sortBy = filters.sortBy
    if (filters.sortOrder) cleanFilters.sortOrder = filters.sortOrder

    const response = await api.get('/mentors/search', { params: cleanFilters })
    return response.data
  },

  /**
   * Obtener perfil completo de un mentor
   */
  async getMentorById(id: string): Promise<{
    status: string
    data: {
      mentor: Mentor
      availability: Array<{
        _id: string
        dayOfWeek: number
        startTime: string
        endTime: string
        isActive: boolean
      }>
      reviews: {
        items: Array<{
          _id: string
          studentId: {
            _id: string
            firstName: string
            lastName: string
            avatar?: string
          }
          rating: number
          comment: string
          createdAt: string
        }>
        total: number
        stats: {
          averageRating: number
          distribution: Record<number, number>
        }
      }
    }
  }> {
    const response = await api.get(`/mentors/${id}`)
    return response.data
  },

  /**
   * Obtener mentores destacados
   */
  async getFeaturedMentors(limit: number = 6): Promise<{
    status: string
    data: {
      mentors: Mentor[]
      total: number
    }
  }> {
    const response = await api.get('/mentors/featured', { params: { limit } })
    return response.data
  },
}
