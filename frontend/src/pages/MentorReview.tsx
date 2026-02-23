import { useEffect } from 'react'
import { useReviewStore } from '@/stores/review.store'
import { ReviewStats } from './ReviewStats'
import { ReviewCard } from './ReviewCard'

interface MentorReviewsProps {
  mentorId?: string // opcional: si no se pasa, usa el endpoint /my-reviews
}

export function MentorReview({ mentorId }: MentorReviewsProps) {
  const {
    reviews,
    stats,
    pagination,
    isLoading,
    error,
    fetchReviews,
    fetchMyReviews,
    goToPage,
    clearError,
  } = useReviewStore()

  useEffect(() => {
    if (mentorId) {
      fetchReviews(mentorId)
    } else {
      fetchMyReviews()
    }
  }, [mentorId, fetchReviews, fetchMyReviews])

  const handleRetry = () => {
    clearError()
    if (mentorId) fetchReviews(mentorId)
    else fetchMyReviews()
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-slate-100 rounded-2xl" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 py-5">
            <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-slate-100 rounded" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          className="mt-3 text-xs font-medium text-red-700 underline underline-offset-2"
          onClick={handleRetry}
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
        <span className="text-3xl">✨</span>
        <p className="mt-3 text-sm font-medium text-slate-500">
          Aún no hay reseñas para este mentor.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          ¡Sé el primero en compartir tu experiencia!
        </p>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <ReviewStats stats={stats} />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6">
        {reviews.map(review => (
          <ReviewCard key={review._id} review={review} />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={!pagination.hasPrevPage}
            onClick={() => goToPage(pagination.currentPage - 1)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Anterior
          </button>

          <div className="flex gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={[
                    'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                    page === pagination.currentPage
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {page}
                </button>
              )
            )}
          </div>

          <button
            disabled={!pagination.hasNextPage}
            onClick={() => goToPage(pagination.currentPage + 1)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Siguiente →
          </button>
        </div>
      )}
    </section>
  )
}
