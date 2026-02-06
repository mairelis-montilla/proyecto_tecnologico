import type { BookingStatus } from '../../types/booking.types'
import { getStatusLabel, getStatusColor } from '../../utils/bookingHelpers'

interface StatusBadgeProps {
  status: BookingStatus
  size?: 'sm' | 'md'
  className?: string
}

const StatusBadge = ({
  status,
  size = 'md',
  className = '',
}: StatusBadgeProps) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${getStatusColor(status)}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {getStatusLabel(status)}
    </span>
  )
}

export default StatusBadge
