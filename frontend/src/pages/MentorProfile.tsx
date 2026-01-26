import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  Clock,
  DollarSign,
  Languages,
  Award,
  Calendar,
  Briefcase,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { mentorsService } from '../services/mentors.service'
import type { Mentor } from '../types/mentor.types'
import { getAvatarUrl } from '../utils/avatar'

interface Review {
  _id: string
  studentId: {
    _id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  rating: number
  comment: string
  createdAt: string
}

interface Availability {
  _id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

interface ReviewStats {
  averageRating: number
  distribution: Record<number, number>
}

const DAYS_OF_WEEK = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

const MentorProfile = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [mentor, setMentor] = useState<Mentor | null>(null)
  const [availability, setAvailability] = useState<Availability[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [totalReviews, setTotalReviews] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMentorProfile = async () => {
      if (!id) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await mentorsService.getMentorById(id)
        setMentor(response.data.mentor)
        setAvailability(response.data.availability)
        setReviews(response.data.reviews.items)
        setTotalReviews(response.data.reviews.total)
        setReviewStats(response.data.reviews.stats)
      } catch (err) {
        console.error('Error cargando perfil del mentor:', err)
        setError('No se pudo cargar el perfil del mentor.')
      } finally {
        setIsLoading(false)
      }
    }

    loadMentorProfile()
  }, [id])

  const getMentorName = () => {
    if (!mentor) return ''
    return `${mentor.userId.firstName} ${mentor.userId.lastName}`
  }

  const getMentorAvatar = () => {
    if (!mentor) return ''
    return getAvatarUrl(mentor.userId.avatar)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStudentAvatar = (review: Review) => {
    return getAvatarUrl(review.studentId.avatar)
  }

  // Agrupar disponibilidad por día
  const groupedAvailability = availability.reduce(
    (acc, slot) => {
      if (!acc[slot.dayOfWeek]) {
        acc[slot.dayOfWeek] = []
      }
      acc[slot.dayOfWeek].push(slot)
      return acc
    },
    {} as Record<number, Availability[]>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {error || 'Mentor no encontrado'}
          </p>
          <button
            onClick={() => navigate('/mentors')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Volver al marketplace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb / Volver */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/mentors')}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al marketplace</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header del perfil */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <img
                  src={getMentorAvatar()}
                  alt={getMentorName()}
                  className="w-32 h-32 rounded-full mx-auto sm:mx-0 bg-gray-100"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {getMentorName()}
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    {mentor.specialties[0]?.name || 'Mentor'}
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">
                        {mentor.rating.toFixed(1)}
                      </span>
                      <span className="text-gray-500">
                        ({totalReviews} reseñas)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{mentor.totalSessions} sesiones</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Sobre mí
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{mentor.bio}</p>
            </div>

            {/* Especialidades */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Especialidades
              </h2>
              <div className="flex flex-wrap gap-2">
                {mentor.specialties.map(spec => (
                  <span
                    key={spec._id}
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {spec.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mentor.experience && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Experiencia</p>
                      <p className="text-gray-900">{mentor.experience}</p>
                    </div>
                  </div>
                )}
                {mentor.languages && mentor.languages.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Languages className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Idiomas</p>
                      <p className="text-gray-900">
                        {mentor.languages.join(', ')}
                      </p>
                    </div>
                  </div>
                )}
                {mentor.credentials && mentor.credentials.length > 0 && (
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <Award className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Credenciales</p>
                      <ul className="text-gray-900 list-disc list-inside">
                        {mentor.credentials.map((cred, idx) => (
                          <li key={idx}>{cred}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reseñas */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Reseñas ({totalReviews})
                </h2>
              </div>

              {/* Estadísticas de calificación */}
              {reviewStats && totalReviews > 0 && (
                <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-gray-100">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">
                      {reviewStats.averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(reviewStats.averageRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {totalReviews} reseñas
                    </p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = reviewStats.distribution[rating] || 0
                      const percentage =
                        totalReviews > 0 ? (count / totalReviews) * 100 : 0
                      return (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 w-3">
                            {rating}
                          </span>
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-8">
                            {count}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Lista de reseñas */}
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div
                      key={review._id}
                      className="border-b border-gray-100 last:border-0 pb-6 last:pb-0"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={getStudentAvatar(review)}
                          alt={`${review.studentId.firstName} ${review.studentId.lastName}`}
                          className="w-10 h-10 rounded-full bg-gray-100"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">
                              {review.studentId.firstName}{' '}
                              {review.studentId.lastName}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-200 text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-700 mt-2">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Este mentor aún no tiene reseñas.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar - Tarifa y Reserva */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Tarjeta de reserva */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                    <span className="text-3xl font-bold text-gray-900">
                      {mentor.hourlyRate}
                    </span>
                  </div>
                  <p className="text-gray-500">por hora</p>
                </div>

                <button
                  onClick={() => {
                    // TODO: Implementar navegación a reserva
                    alert('Funcionalidad de reserva próximamente')
                  }}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
                >
                  Reservar Sesión
                  <ChevronRight className="w-5 h-5" />
                </button>

                <p className="text-sm text-gray-500 text-center mt-4">
                  Agenda una sesión de mentoría personalizada
                </p>
              </div>

              {/* Disponibilidad */}
              {Object.keys(groupedAvailability).length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Disponibilidad
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(groupedAvailability)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([day, slots]) => (
                        <div key={day} className="flex items-start gap-3">
                          <span className="text-sm font-medium text-gray-900 w-24">
                            {DAYS_OF_WEEK[Number(day)]}
                          </span>
                          <div className="flex-1 space-y-1">
                            {slots.map(slot => (
                              <span
                                key={slot._id}
                                className="block text-sm text-gray-600"
                              >
                                {slot.startTime} - {slot.endTime}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MentorProfile
