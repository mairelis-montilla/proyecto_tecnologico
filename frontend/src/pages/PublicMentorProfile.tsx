import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  Award,
  DollarSign,
  BadgeCheck,
  Star,
  Languages,
  Loader2,
  Calendar,
  MessageSquare,
} from 'lucide-react'
import { mentorsService } from '../services/mentors.service'
import { getAvatarUrl } from '../utils/avatar'
import type { Mentor } from '../types/mentor.types'

const PublicMentorProfile = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [mentor, setMentor] = useState<Mentor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado para la disponibilidad y reseñas (si quisieras mostrarlas)
  // const [availability, setAvailability] = useState<any[]>([])
  // const [reviews, setReviews] = useState<any>(null)

  useEffect(() => {
    const loadMentor = async () => {
      if (!id) return

      setIsLoading(true)
      setError(null)
      try {
        const response = await mentorsService.getMentorById(id)
        if (response.data && response.data.mentor) {
          setMentor(response.data.mentor)
          // setAvailability(response.data.availability || [])
          // setReviews(response.data.reviews || null)
        } else {
          setError('Mentor no encontrado')
        }
      } catch (err: any) {
        console.error('Error loading mentor:', err)
        setError('Error al cargar el perfil del mentor. Es posible que no exista o haya sido desactivado.')
      } finally {
        setIsLoading(false)
      }
    }

    loadMentor()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error || !mentor) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-screen bg-gray-50">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <p className="text-xl font-bold text-gray-900 mb-2">¡Ups! Algo salió mal</p>
          <p className="text-gray-600 max-w-md mx-auto">{error || 'No se pudo cargar la información del mentor'}</p>
        </div>
        <button
          onClick={() => navigate('/mentors')}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Volver a buscar mentores
        </button>
      </div>
    )
  }

  const fullName = `${mentor.userId.firstName} ${mentor.userId.lastName}`

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header / Portada simple */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Información Principal */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center border border-gray-100">
              <div className="relative mb-4">
                <img
                  src={getAvatarUrl(mentor.userId.avatar)}
                  alt={fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-2 border-white" title="Disponible"></div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-1">{fullName}</h1>
              <p className="text-purple-600 font-medium mb-4">{mentor.title || 'Mentor Especialista'}</p>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-gray-800">{mentor.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-xs text-gray-500">({mentor.totalSessions} sesiones)</span>
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-sm w-full px-4 py-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Tarifa/hora
                  </span>
                  <span className="font-bold text-gray-900 text-lg">S/. {mentor.hourlyRate}</span>
                </div>

                <button className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 shadow-purple-200 shadow-md flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Reservar Sesión
                </button>

                <button className="w-full py-3 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-200 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Enviar Mensaje
                </button>
              </div>
            </div>

            {/* Detalles Adicionales Cortos */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-purple-500" />
                  Idiomas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(mentor.languages && mentor.languages.length > 0) ? mentor.languages.map(lang => (
                    <span key={lang} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                      {lang}
                    </span>
                  )) : (
                    <span className="text-gray-500 text-sm">Español</span>
                  )}
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  Experiencia
                </h3>
                <p className="text-gray-600 text-sm">
                  <span className="font-medium text-gray-900">{mentor.yearsOfExperience || 0} años</span> de trayectoria
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Detalles Completos */}
          <div className="lg:col-span-2 space-y-6">

            {/* Acerca de */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                Acerca de mí
              </h2>
              <div className="prose prose-purple max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                {mentor.bio || 'Este mentor no ha añadido una descripción todavía.'}
              </div>
            </div>

            {/* Especialidades */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-purple-600" />
                Áreas de Especialización
              </h2>
              <div className="flex flex-wrap gap-2">
                {mentor.specialties && mentor.specialties.length > 0 ? (
                  mentor.specialties.map((spec: any) => (
                    <span key={spec._id || spec} className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold border border-purple-100 flex items-center gap-2">
                      {spec.name || spec}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No se han especificado especialidades.</p>
                )}
              </div>
            </div>

            {/* Experiencia Laboral Detallada */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                Experiencia Laboral
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {mentor.experience || 'No se ha especificado experiencia laboral detallada.'}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicMentorProfile
