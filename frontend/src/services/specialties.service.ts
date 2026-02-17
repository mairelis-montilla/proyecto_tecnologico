import { api } from './api'
import type {
  CategoriesResponse,
  SpecialtiesResponse,
  Specialty,
} from '../types/mentor.types'

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

  // ==================== ADMIN METHODS ====================

  /**
   * Listar todas las especialidades (Admin - con paginación y filtros)
   */
  async getAllAdmin(params?: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
  }): Promise<{
    status: string
    data: {
      specialties: (Specialty & { mentorCount: number })[]
      pagination: {
        currentPage: number
        totalPages: number
        totalItems: number
        itemsPerPage: number
      }
    }
  }> {
    const response = await api.get('/admin/specialties', { params })
    return response.data
  },

  /**
   * Crear especialidad
   */
  async create(data: Partial<Specialty>): Promise<{
    status: string
    data: { specialty: Specialty }
  }> {
    const response = await api.post('/admin/specialties', data)
    return response.data
  },

  /**
   * Actualizar especialidad
   */
  async update(
    id: string,
    data: Partial<Specialty>
  ): Promise<{
    status: string
    data: { specialty: Specialty }
  }> {
    const response = await api.put(`/admin/specialties/${id}`, data)
    return response.data
  },

  /**
   * Eliminar especialidad
   */
  async delete(id: string): Promise<{
    status: string
    message: string
  }> {
    const response = await api.delete(`/admin/specialties/${id}`)
    return response.data
  },
}

