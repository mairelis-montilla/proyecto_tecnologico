import { api } from './api'
import type { CategoriesResponse, SpecialtiesResponse } from '../types/mentor.types'

export const specialtiesService = {
  /**
   * Obtener todas las especialidades activas
   */
  async getSpecialties(params?: {
    category?: string
    includeCount?: boolean
  }): Promise<SpecialtiesResponse> {
    const response = await api.get('/specialties', {
      params: {
        ...params,
        includeCount: params?.includeCount ? 'true' : undefined,
      },
    })
    return response.data
  },

  /**
   * Obtener categorías con sus especialidades
   */
  async getCategories(): Promise<CategoriesResponse> {
    const response = await api.get('/specialties/categories')
    return response.data
  },

  /**
   * Obtener una especialidad por ID
   */
  async getSpecialtyById(id: string): Promise<{
    status: string
    data: {
      specialty: {
        _id: string
        name: string
        category: string
        description?: string
        icon?: string
        isActive: boolean
        mentorCount: number
      }
    }
  }> {
    const response = await api.get(`/specialties/${id}`)
    return response.data
  },
}
