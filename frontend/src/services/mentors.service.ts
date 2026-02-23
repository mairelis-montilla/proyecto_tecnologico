import { api } from './api'
import type {
  MentorsResponse,
  SearchMentorsResponse,
  MentorSearchFilters,
  Mentor,
} from '../types/mentor.types'

export interface Specialty {
  _id: string
  name: string
  category: string
  icon?: string
}

export interface GroupedSpecialties {
  [category: string]: Array<{
    _id: string
    name: string
    icon?: string
  }>
}

export interface PaymentInfoData {
  yape?: string
  plin?: string
  bankName?: string
  bankAccount?: string
  bankCci?: string
}

export interface UpdateMentorProfileData {
  title?: string
  bio?: string
  experience?: string
  yearsOfExperience?: number
  hourlyRate?: number
  specialties?: string[] // Array de IDs de especialidades
  avatar?: string // URL de la imagen (el upload a Cloudinary se hace por separado)
  profileStatus?: 'draft' | 'published'
  paymentInfo?: PaymentInfoData
}

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

  // Actualizar mi perfil
  updateMyProfile: async (data: UpdateMentorProfileData) => {
    const response = await api.put<{
      status: string
      message: string
      data: { mentor: Mentor }
    }>('/mentors/profile', data)
    return response
  },

  // Publicar perfil del mentor
  publishProfile: async (data: {
    title: string
    bio: string
    specialties: string[]
    hourlyRate: number
  }) => {
    const response = await api.put<{
      status: string
      message: string
      data: { mentor: Mentor }
    }>('/mentors/profile', { ...data, profileStatus: 'published' })
    return response
  },

  // Obtener especialidades disponibles agrupadas por categoría
  getAvailableSpecialties: async () => {
    const response = await api.get<{
      status: string
      data: {
        categories: Array<{
          category: string
          count: number
          specialties: Array<{ _id: string; name: string; icon?: string }>
        }>
      }
    }>('/specialties/categories')

    // Transformar la respuesta al formato GroupedSpecialties
    const grouped: GroupedSpecialties = {}
    response.data.data.categories.forEach(cat => {
      grouped[cat.category] = cat.specialties
    })

    return {
      data: {
        status: 'success',
        data: {
          specialties: grouped,
          total: response.data.data.categories.reduce(
            (acc, cat) => acc + cat.count,
            0
          ),
        },
      },
    }
  },

  // Subir avatar
  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await api.post<{
      status: string
      message: string
      data: { avatar: string }
    }>('/mentors/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response
  },

  getMyProfile: async () => {
    const response = await api.get<{
      status: string
      data: { mentor: Mentor }
    }>('/mentors/profile')
    return response
  },

  async getAvailabilityPreview(mentorId: string, weeks: number = 2) {
    const response = await api.get<{
      status: string
      data: Array<{
        date: string
        dayOfWeek: number
        startTime: string
        endTime: string
        startIso: string
        endIso: string
        duration: number
        slotId: string
      }>
    }>(`/mentors/${mentorId}/availability/preview`, { params: { weeks } })
    return response.data
  },

  // Obtener disponibilidad del mentor (para el mentor)
  async getMyAvailability(
    mentorId: string,
    startDate?: string,
    endDate?: string
  ) {
    const params: Record<string, string> = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const response = await api.get<{
      status: string
      data: Array<{
        _id: string
        date: string
        dayOfWeek: number
        startTime: string
        endTime: string
        duration: number
        recurrence: 'none' | 'daily' | 'weekly' | 'monthly'
        recurrenceEndDate?: string
        isActive: boolean
      }>
    }>(`/mentors/${mentorId}/availability`, { params })
    return response.data
  },

  // Agregar slots de disponibilidad
  async addAvailability(
    mentorId: string,
    slots: Array<{
      date: string
      startTime: string
      recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'
      recurrenceEndDate?: string
    }>,
    duration: number = 60
  ) {
    const response = await api.post<{
      status: string
      message: string
      data: Array<{
        _id: string
        date: string
        startTime: string
        endTime: string
        duration: number
      }>
    }>(`/mentors/${mentorId}/availability`, { slots, duration })
    return response.data
  },

  // Eliminar un slot de disponibilidad
  async deleteAvailability(mentorId: string, slotId: string) {
    const response = await api.delete<{
      status: string
      message: string
    }>(`/mentors/${mentorId}/availability/${slotId}`)
    return response.data
  },

  // Mis ingresos como mentor
  getMyEarnings: async (params?: {
    period?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/mentors/my-earnings', { params })
    return response.data
  },
}
