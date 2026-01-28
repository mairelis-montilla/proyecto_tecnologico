import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Calendar,
  School,
  User,
  Loader2,
} from 'lucide-react'
import { studentsService, Student } from '../services/students.service'
import { getAvatarUrl } from '../utils/avatar'

const PublicStudentProfile = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [student, setStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStudent = async () => {
      if (!id) return

      setIsLoading(true)
      setError(null)
      try {
        const response = await studentsService.getStudentById(id)
        if (response.data && response.data.student) {
          setStudent(response.data.student)
        } else {
          setError('Estudiante no encontrado')
        }
      } catch (err: any) {
        console.error('Error loading student:', err)
        setError(
          'Error al cargar el perfil del estudiante. Es posible que no exista.'
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadStudent()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-screen bg-gray-50">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <p className="text-xl font-bold text-gray-900 mb-2">
            ¡Ups! Algo salió mal
          </p>
          <p className="text-gray-600 max-w-md mx-auto">
            {error || 'No se pudo cargar la información del estudiante'}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Volver
        </button>
      </div>
    )
  }

  const fullName = `${student.userId.firstName} ${student.userId.lastName}`

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
                  src={getAvatarUrl(student.userId.avatar)}
                  alt={fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {fullName}
              </h1>
              <p className="text-purple-600 font-medium mb-4">Estudiante</p>

              <div className="w-full space-y-3 text-left">
                {student.institution && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <School className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Institución
                      </p>
                      <p className="text-gray-900 font-medium">
                        {student.institution}
                      </p>
                    </div>
                  </div>
                )}

                {student.career && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Carrera
                      </p>
                      <p className="text-gray-900 font-medium">
                        {student.career}
                      </p>
                    </div>
                  </div>
                )}

                {student.semester && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Ciclo</p>
                      <p className="text-gray-900 font-medium">
                        {student.semester}° Ciclo
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Detalles Completos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Sobre mí
              </h2>
              <div className="prose prose-purple max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                {student.bio ||
                  'Este estudiante no ha añadido una descripción todavía.'}
              </div>
            </div>

            {/* Intereses */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Intereses de Aprendizaje
              </h2>
              <div className="flex flex-wrap gap-2">
                {student.interests && student.interests.length > 0 ? (
                  student.interests.map((interest: any) => (
                    <span
                      key={interest._id || interest}
                      className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold border border-purple-100 flex items-center gap-2"
                    >
                      {interest.name || interest}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">
                    No se han especificado intereses.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicStudentProfile
