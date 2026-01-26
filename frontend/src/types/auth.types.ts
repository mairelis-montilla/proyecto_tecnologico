export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'student' | 'mentor' | 'admin'
  avatar?: string
}

export interface StudentProfile {
  id: string
  bio?: string
  institution?: string
  career?: string
  semester?: number
  interests: string[]
  totalSessions: number
  isActive: boolean
}

export interface MentorProfile {
  id: string
  bio: string
  specialties: string[]
  experience: string
  yearsOfExperience: number
  credentials: string[]
  rating: number
  totalSessions: number
  hourlyRate?: number
  isApproved: boolean
  isActive: boolean
}

export type Profile = StudentProfile | MentorProfile

export interface AuthResponse {
  status: 'success' | 'error'
  message: string
  data: {
    user: User
    profile: Profile
    token: string
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterStudentData {
  email: string
  password: string
  firstName: string
  lastName: string
  bio?: string
  institution?: string
  career?: string
  semester?: number
}

export interface RegisterMentorData {
  email: string
  password: string
  firstName: string
  lastName: string
  bio: string
  experience: string
  yearsOfExperience?: number
  specialties?: string[]
  credentials?: string[]
  hourlyRate?: number
}

export interface ApiError {
  status: 'error'
  message: string
  errors?: Array<{
    msg: string
    param: string
  }>
}
