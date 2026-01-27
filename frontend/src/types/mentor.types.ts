export interface Specialty {
  _id: string
  name: string
  category: string
  description?: string
  icon?: string
  isActive: boolean
}

export interface MentorUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
}

export interface Mentor {
  _id: string
  userId: MentorUser
  title?: string
  bio: string
  experience?: string
  credentials?: string[]
  specialties: Specialty[]
  rating: number
  totalReviews?: number
  totalSessions: number
  hourlyRate: number
  yearsOfExperience: number
  languages?: string[]
  isApproved: boolean
  isActive: boolean
  profileStatus?: 'draft' | 'published'
  createdAt: string
}

export interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface MentorsResponse {
  status: string
  data: {
    mentors: Mentor[]
    pagination: Pagination
  }
}

export interface MentorSearchFilters {
  q?: string
  specialties?: string
  category?: string
  minRating?: number
  minRate?: number
  maxRate?: number
  languages?: string
  page?: number
  limit?: number
  sortBy?: 'rating' | 'totalSessions' | 'hourlyRate' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchMentorsResponse {
  status: string
  data: {
    mentors: Mentor[]
    pagination: Pagination
    appliedFilters: {
      query: string | null
      specialties: string | null
      category: string | null
      minRating: string | null
      minRate: string | null
      maxRate: string | null
      languages: string | null
    }
  }
}

export interface CategoryWithSpecialties {
  category: string
  count: number
  specialties: {
    _id: string
    name: string
    icon?: string
  }[]
}

export interface CategoriesResponse {
  status: string
  data: {
    categories: CategoryWithSpecialties[]
  }
}

export interface SpecialtiesResponse {
  status: string
  data: {
    specialties: (Specialty & { mentorCount?: number })[]
  }
}
