export interface ReviewStudent {
    _id: string
    firstName: string
    lastName: string
    avatar?: string
}

export interface Review {
    _id: string
    mentorId: string
    studentId: ReviewStudent
    rating: number
    comment: string
    createdAt: string
    updatedAt: string
}

export interface RatingDistribution {
    1: number
    2: number
    3: number
    4: number
    5: number
}

export interface ReviewStats {
    averageRating: number
    totalReviews: number
    ratingDistribution: RatingDistribution
}

export interface ReviewPagination {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
}

export interface GetReviewsResponse {
    status: string
    data: {
        reviews: Review[]
        stats: ReviewStats
        pagination: ReviewPagination
    }
}

export interface CreateReviewPayload {
    mentorId: string
    sessionId: string
    rating: number
    comment: string
}

export interface CreateReviewResponse {
    status: string
    data: {
        review: Review
    }
}