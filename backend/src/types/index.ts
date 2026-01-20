// Tipos globales y compartidos

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error'
  data?: T
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}
