import { RatingStars } from './RatingStarts'
import type { Review } from '@/types/reviews.types'

interface ReviewCardProps {
  review: Review
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 30) return `Hace ${days} días`
  const months = Math.floor(days / 30)
  if (months < 12) return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  const years = Math.floor(months / 12)
  return `Hace ${years} ${years === 1 ? 'año' : 'años'}`
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

const avatarColors = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
]

function colorForId(id: string): string {
  return avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length]
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { studentId, rating, comment, createdAt } = review
  const fullName = `${studentId.firstName} ${studentId.lastName}`

  return (
    <article className="flex gap-4 py-5 border-b border-slate-100 last:border-0">
      <div className="shrink-0">
        {studentId.avatar ? (
          <img
            src={studentId.avatar}
            alt={fullName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white shadow-sm ${colorForId(studentId._id)}`}
          >
            {getInitials(studentId.firstName, studentId.lastName)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <span className="font-semibold text-slate-800 text-sm">
            {fullName}
          </span>
          <span className="text-xs text-slate-400">{timeAgo(createdAt)}</span>
        </div>
        <RatingStars value={rating} size="sm" />
        {comment && (
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {comment}
          </p>
        )}
      </div>
    </article>
  )
}
