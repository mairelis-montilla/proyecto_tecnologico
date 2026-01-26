import { api } from './api'

export interface StudentUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
}

export interface Interest {
  _id: string
  name: string
  category: string
  icon?: string
}

export interface Student {
  _id: string
  userId: StudentUser
  bio?: string
  institution?: string
  career?: string
  semester?: number
  interests: Interest[]
  totalSessions: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateStudentProfileData {
  bio?: string
  institution?: string
  career?: string
  semester?: number
  interests?: string[]
  avatar?: string // URL de la imagen (el upload a Cloudinary se hace por separado)
}

export interface GroupedInterests {
  [category: string]: Array<{
    _id: string
    name: string
    icon?: string
  }>
}

export const studentsService = {
  // Obtener mi perfil de estudiante
  getMyProfile: async () => {
    const response = await api.get<{
      status: string
      data: { student: Student }
    }>('/students/profile')
    return response
  },

  // Actualizar mi perfil de estudiante
  updateMyProfile: async (data: UpdateStudentProfileData) => {
    const response = await api.put<{
      status: string
      message: string
      data: { student: Student }
    }>('/students/profile', data)
    return response
  },

  // Obtener intereses disponibles
  getAvailableInterests: async () => {
    const response = await api.get<{
      status: string
      data: { interests: GroupedInterests; total: number }
    }>('/students/interests')
    return response
  },

  // Subir avatar del estudiante
  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await api.post<{
      status: string
      message: string
      data: { avatar: string }
    }>('/students/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response
  },
}
