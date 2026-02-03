import { api } from './api'
import type {
  AuthResponse,
  LoginCredentials,
  RegisterStudentData,
  RegisterMentorData,
  User,
  Profile,
  VerifyEmailData,
  ForgotPasswordData,
  ResetPasswordData,
  GenericResponse,
} from '@/types/auth.types'

export const authService = {
  async registerStudent(data: RegisterStudentData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      '/auth/register/student',
      data
    )
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
    const response = await api.get<{
      status: string
      data: { user: User; profile: Profile }
    }>('/auth/me')
    return response.data.data
  },

  // Verificación de email
  async verifyEmail(data: VerifyEmailData): Promise<GenericResponse> {
    const response = await api.post<GenericResponse>('/auth/verify-email', data)
    return response.data
  },

  async resendVerificationCode(email: string): Promise<GenericResponse> {
    const response = await api.post<GenericResponse>('/auth/resend-code', {
      email,
    })
    return response.data
  },

  // Recuperación de contraseña
  async forgotPassword(data: ForgotPasswordData): Promise<GenericResponse> {
    const response = await api.post<GenericResponse>(
      '/auth/forgot-password',
      data
    )
    return response.data
  },

  async resetPassword(data: ResetPasswordData): Promise<GenericResponse> {
    const response = await api.post<GenericResponse>(
      '/auth/reset-password',
      data
    )
    return response.data
  },
}
