import { api } from './api'
import type {
  AuthResponse,
  LoginCredentials,
  RegisterStudentData,
  RegisterMentorData,
  User,
  Profile,
} from '@/types/auth.types'

export const authService = {
  async registerStudent(data: RegisterStudentData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register/student', data)
    return response.data
  },

  async registerMentor(data: RegisterMentorData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register/mentor', data)
    return response.data
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials)
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async getMe(): Promise<{ user: User; profile: Profile }> {
    const response = await api.get<{ status: string; data: { user: User; profile: Profile } }>(
      '/auth/me'
    )
    return response.data.data
  },
}
