import { useState } from 'react'

interface RatingStarsProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (value: number) => void
}

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
}

export function RatingStars({
  value,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
}: RatingStarsProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const display = hovered ?? value

  return (
    <div
      className="flex items-center gap-0.5"
      role={interactive ? 'radiogroup' : undefined}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1
        const filled = starValue <= display

        return (
          <button
            key={starValue}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            onMouseEnter={() => interactive && setHovered(starValue)}
            onMouseLeave={() => interactive && setHovered(null)}
            className={[
              'transition-transform duration-150',
              interactive
                ? 'cursor-pointer hover:scale-110 focus:outline-none'
                : 'cursor-default pointer-events-none',
            ].join(' ')}
            aria-label={
              interactive ? `Calificar ${starValue} estrellas` : undefined
            }
          >
            <svg
              className={[sizeMap[size], 'transition-colors duration-150'].join(
                ' '
              )}
              viewBox="0 0 24 24"
              fill={filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={filled ? 0 : 1.5}
              style={{ color: filled ? '#F59E0B' : '#D1D5DB' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
