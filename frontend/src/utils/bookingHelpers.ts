import moment from 'moment-timezone'
import type { BookingStatus, RefundPolicy } from '../types/booking.types'

/**
 * Obtener etiqueta de estado en español
 */
export const getStatusLabel = (status: BookingStatus): string => {
  const labels: Record<BookingStatus, string> = {
    pending_payment: 'Pendiente de pago',
    payment_uploaded: 'Pago en revision',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    refunded: 'Reembolsada',
  }
  return labels[status]
}

/**
 * Obtener clases de color para el estado
 */
export const getStatusColor = (status: BookingStatus): string => {
  const colors: Record<BookingStatus, string> = {
    pending_payment: 'bg-amber-100 text-amber-800 border-amber-200',
    payment_uploaded: 'bg-blue-100 text-blue-800 border-blue-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    refunded: 'bg-purple-100 text-purple-800 border-purple-200',
  }
  return colors[status]
}

/**
 * Verificar si la sesion esta dentro de las proximas 24 horas
 */
export const isWithin24Hours = (dateIso: string): boolean => {
  const sessionTime = moment(dateIso)
  const now = moment()
  const hoursUntil = sessionTime.diff(now, 'hours')
  return hoursUntil >= 0 && hoursUntil <= 24
}

/**
 * Verificar si se puede cancelar la sesion (debe ser en el futuro)
 */
export const canCancel = (dateIso: string): boolean => {
  const sessionTime = moment(dateIso)
  const now = moment()
  return sessionTime.diff(now, 'hours') > 0
}

/**
 * Obtener horas restantes hasta la sesion
 */
export const getHoursUntilSession = (dateIso: string): number => {
  const sessionTime = moment(dateIso)
  const now = moment()
  return Math.max(0, sessionTime.diff(now, 'hours'))
}

/**
 * Calcular politica de reembolso basada en horas restantes
 */
export const calculateRefundPolicy = (hoursBeforeSession: number): RefundPolicy => {
  if (hoursBeforeSession >= 24) {
    return {
      hoursBeforeSession,
      refundPercentage: 100,
      description: 'Reembolso completo del 100%',
    }
  } else if (hoursBeforeSession >= 12) {
    return {
      hoursBeforeSession,
      refundPercentage: 50,
      description: 'Reembolso parcial del 50%',
    }
  } else {
    return {
      hoursBeforeSession,
      refundPercentage: 0,
      description: 'Sin reembolso disponible',
    }
  }
}

/**
 * Formatear fecha para mostrar
 */
export const formatSessionDate = (dateIso: string): string => {
  return moment(dateIso).format('dddd, D [de] MMMM [de] YYYY')
}

/**
 * Formatear hora para mostrar
 */
export const formatSessionTime = (dateIso: string): string => {
  return moment(dateIso).format('HH:mm')
}

/**
 * Formatear fecha y hora completa
 */
export const formatSessionDateTime = (dateIso: string): string => {
  return moment(dateIso).format('dddd, D [de] MMMM [a las] HH:mm')
}

/**
 * Formatear duracion en minutos
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}min`
}

/**
 * Formatear precio en soles
 */
export const formatPrice = (amount: number): string => {
  return `S/. ${amount.toFixed(2)}`
}

/**
 * Verificar si la sesion es pasada
 */
export const isPastSession = (dateIso: string): boolean => {
  return moment(dateIso).isBefore(moment())
}

/**
 * Verificar si la sesion es futura
 */
export const isFutureSession = (dateIso: string): boolean => {
  return moment(dateIso).isAfter(moment())
}
