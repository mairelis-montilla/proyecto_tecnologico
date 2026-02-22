import { RatingStars } from './RatingStarts'
import type { ReviewStats as ReviewStatsType } from '@/types/reviews.types'

interface ReviewStatsProps {
    stats: ReviewStatsType
}

export function ReviewStats({ stats }: ReviewStatsProps) {
    const { averageRating, totalReviews, ratingDistribution } = stats

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row gap-6 items-center">
            {/* Promedio */}
            <div className="flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-6xl font-black text-slate-800 leading-none tracking-tighter">
                    {averageRating.toFixed(1)}
                </span>
                <div className="mt-2">
                    <RatingStars value={Math.round(averageRating)} size="md" />
                </div>
                <span className="mt-1.5 text-xs text-slate-400 font-medium">
                    {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'}
                </span>
            </div>

            <div className="hidden sm:block w-px h-24 bg-slate-100" />
            <div className="sm:hidden w-full h-px bg-slate-100" />

            {/* Distribución */}
            <div className="flex flex-col gap-2 w-full">
                {([5, 4, 3, 2, 1] as const).map(star => {
                    const count = ratingDistribution[star]
                    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0

                    return (
                        <div key={star} className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-500 w-4 text-right shrink-0">
                                {star}
                            </span>
                            <svg className="w-3 h-3 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-amber-400 transition-all duration-700 ease-out"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="text-xs text-slate-400 w-6 text-right shrink-0">{count}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}