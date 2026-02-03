import { create } from 'zustand'
import { authService } from '@/services/auth.service'
import type {
  User,
  Profile,
  LoginCredentials,
  RegisterStudentData,
  RegisterMentorData,
} from '@/types/auth.types'

interface AuthState {
  user: User | null
  profile: Profile | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isInitialized: boolean
  error: string | null
  requiresVerification: boolean
  pendingVerificationEmail: string | null

  // Acciones
  login: (credentials: LoginCredentials) => Promise<{ requiresVerification: boolean; email: string }>
  registerStudent: (data: RegisterStudentData) => Promise<{ requiresVerification: boolean; email: string }>
  registerMentor: (data: RegisterMentorData) => Promise<{ requiresVerification: boolean; email: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
  setPendingVerificationEmail: (email: string | null) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('token'),
  isInitialized: false,
  error: null,
  requiresVerification: false,
  pendingVerificationEmail: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.login(credentials)
      const { user, profile, token, requiresVerification } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      set({
        user,
        profile,
        token,
        isAuthenticated: true,
        isLoading: false,
        requiresVerification: requiresVerification || false,
        pendingVerificationEmail: requiresVerification ? user.email : null,
      })

      return {
        requiresVerification: requiresVerification || false,
        email: user.email
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      const message =
        axiosError?.response?.data?.message || 'Error al iniciar sesión'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  registerStudent: async (data: RegisterStudentData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.registerStudent(data)
      const { user, profile, token, requiresVerification } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      set({
        user,
        profile,
        token,
        isAuthenticated: true,
        isLoading: false,
        requiresVerification: requiresVerification || false,
        pendingVerificationEmail: requiresVerification ? user.email : null,
      })

      return {
        requiresVerification: requiresVerification || false,
        email: user.email
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      const message =
        axiosError?.response?.data?.message || 'Error al registrar estudiante'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  registerMentor: async (data: RegisterMentorData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.registerMentor(data)
      const { user, profile, token, requiresVerification } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      set({
        user,
        profile,
        token,
        isAuthenticated: true,
        isLoading: false,
        requiresVerification: requiresVerification || false,
        pendingVerificationEmail: requiresVerification ? user.email : null,
      })

      return {
        requiresVerification: requiresVerification || false,
        email: user.email
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      const message =
        axiosError?.response?.data?.message || 'Error al registrar mentor'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authService.logout()
    } catch {
      // Ignorar errores de logout
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({
        user: null,
        profile: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        requiresVerification: false,
        pendingVerificationEmail: null,
      })
    }
  },

  checkAuth: async () => {
    // Evitar llamadas múltiples
    if (get().isInitialized || get().isLoading) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      set({
        isAuthenticated: false,
        user: null,
        profile: null,
        isInitialized: true,
      })
      return
    }

    set({ isLoading: true })
    try {
      const { user, profile } = await authService.getMe()
      set({
        user,
        profile,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        requiresVerification: !user.isEmailVerified,
        pendingVerificationEmail: !user.isEmailVerified ? user.email : null,
      })
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({
        user: null,
        profile: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      })
    }
  },

  refreshUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const { user, profile } = await authService.getMe()
      localStorage.setItem('user', JSON.stringify(user))
      set({
        user,
        profile,
        requiresVerification: !user.isEmailVerified,
        pendingVerificationEmail: !user.isEmailVerified ? user.email : null,
      })
    } catch {
      // Ignorar errores de refresh
    }
  },

  clearError: () => set({ error: null }),

  setPendingVerificationEmail: (email: string | null) =>
    set({ pendingVerificationEmail: email }),
}))
