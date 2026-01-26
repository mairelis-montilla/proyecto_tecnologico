import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Camera,
  Save,
  X,
  Loader2,
  Check,
  ArrowLeft,
  Mail,
  Pencil,
  Building,
  GraduationCap,
  BookOpen,
} from 'lucide-react'
import {
  studentsService,
  Student,
  GroupedInterests,
} from '../services/students.service'
import { getAvatarUrl } from '../utils/avatar'
import { useAuthStore } from '../stores/auth.store'

const StudentProfile = () => {
  const navigate = useNavigate()
  const refreshUser = useAuthStore(state => state.refreshUser)

  // Modo de visualización
  const [isEditMode, setIsEditMode] = useState(false)

  // Estado del formulario
  const [bio, setBio] = useState('')
  const [institution, setInstitution] = useState('')
  const [career, setCareer] = useState('')
  const [semester, setSemester] = useState<number | ''>('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Estado de la UI
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [availableInterests, setAvailableInterests] =
    useState<GroupedInterests>({})
  const [student, setStudent] = useState<Student | null>(null)

  // Cargar datos iniciales
  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Cargar perfil e intereses en paralelo
      const [profileRes, interestsRes] = await Promise.all([
        studentsService.getMyProfile(),
        studentsService.getAvailableInterests(),
      ])

      const studentData = profileRes.data.data.student
      setStudent(studentData)

      // Llenar el formulario con datos existentes
      if (studentData) {
        setBio(studentData.bio || '')
        setInstitution(studentData.institution || '')
        setCareer(studentData.career || '')
        setSemester(studentData.semester || '')
        setSelectedInterests(studentData.interests?.map(i => i._id) || [])
        if (studentData.userId?.avatar) {
          setAvatarPreview(studentData.userId.avatar)
        }
      }

      setAvailableInterests(interestsRes.data.data.interests)
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar los datos del perfil')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Manejar selección de imagen
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona una imagen válida')
        return
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB')
        return
      }

      // Guardar archivo para subir después
      setAvatarFile(file)

      // Crear preview local
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Toggle de intereses
  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  // Guardar perfil
  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Subir avatar si hay uno nuevo seleccionado
      if (avatarFile) {
        await studentsService.uploadAvatar(avatarFile)
        setAvatarFile(null)
      }

      // Actualizar el resto del perfil
      await studentsService.updateMyProfile({
        bio: bio || undefined,
        institution: institution || undefined,
        career: career || undefined,
        semester: semester ? Number(semester) : undefined,
        interests: selectedInterests,
      })

      // Refrescar datos del usuario en el store (actualiza avatar en header, etc.)
      await refreshUser()

      // Recargar datos del perfil
      await loadData()

      setSuccess('Perfil actualizado correctamente')
      setIsEditMode(false)

      // Limpiar mensaje de éxito después de unos segundos
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error('Error guardando perfil:', err)
      setError('Error al guardar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  // Cancelar edición
  const handleCancel = () => {
    // Restaurar datos originales
    if (student) {
      setBio(student.bio || '')
      setInstitution(student.institution || '')
      setCareer(student.career || '')
      setSemester(student.semester || '')
      setSelectedInterests(student.interests?.map(i => i._id) || [])
      setAvatarPreview(student.userId?.avatar || null)
      setAvatarFile(null)
    }
    setError(null)
    setIsEditMode(false)
  }

  // Obtener avatar o placeholder
  const getAvatarDisplay = () => {
    if (avatarPreview) return avatarPreview
    return getAvatarUrl(student?.userId?.avatar)
  }

  // Obtener el nombre de un interés por su ID
  const getInterestName = (interestId: string): string => {
    for (const interests of Object.values(availableInterests)) {
      const interest = interests.find(i => i._id === interestId)
      if (interest) return interest.name
    }
    return ''
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-500 text-sm">
                {isEditMode
                  ? 'Edita tu información personal'
                  : 'Tu información personal'}
              </p>
            </div>
          </div>
          {!isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Mensajes de error/éxito */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <X className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 flex-shrink-0" />
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Foto de perfil */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={getAvatarDisplay()}
                alt="Avatar"
                className="w-32 h-32 rounded-full bg-gray-100 object-cover"
              />
              {isEditMode && (
                <label className="absolute bottom-0 right-0 p-2 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-700 transition-colors">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {isEditMode && (
              <p className="text-sm text-gray-500 mt-2">
                Haz clic en el ícono para cambiar tu foto
              </p>
            )}
          </div>

          {/* Email (siempre solo lectura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline-block mr-1" />
              Correo electrónico
            </label>
            <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
              {student?.userId?.email || 'No disponible'}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Bio
            </label>
            {isEditMode ? (
              <>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 200))}
                  placeholder="Cuéntanos un poco sobre ti..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-sm text-gray-500 mt-1 text-right">
                  {bio.length}/200 caracteres
                </p>
              </>
            ) : (
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 min-h-[80px]">
                {bio || <span className="text-gray-400">Sin descripción</span>}
              </div>
            )}
          </div>

          {/* Institución */}
          <div>
            <label
              htmlFor="institution"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <Building className="w-4 h-4 inline-block mr-1" />
              Institución
            </label>
            {isEditMode ? (
              <input
                type="text"
                id="institution"
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                placeholder="Ej: Universidad Nacional"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {institution || (
                  <span className="text-gray-400">No especificada</span>
                )}
              </div>
            )}
          </div>

          {/* Carrera */}
          <div>
            <label
              htmlFor="career"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <GraduationCap className="w-4 h-4 inline-block mr-1" />
              Carrera
            </label>
            {isEditMode ? (
              <input
                type="text"
                id="career"
                value={career}
                onChange={e => setCareer(e.target.value)}
                placeholder="Ej: Ingeniería de Sistemas"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {career || (
                  <span className="text-gray-400">No especificada</span>
                )}
              </div>
            )}
          </div>

          {/* Semestre */}
          <div>
            <label
              htmlFor="semester"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <BookOpen className="w-4 h-4 inline-block mr-1" />
              Semestre
            </label>
            {isEditMode ? (
              <select
                id="semester"
                value={semester}
                onChange={e =>
                  setSemester(e.target.value ? Number(e.target.value) : '')
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Seleccionar semestre</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(s => (
                  <option key={s} value={s}>
                    {s}° Semestre
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {semester ? (
                  `${semester}° Semestre`
                ) : (
                  <span className="text-gray-400">No especificado</span>
                )}
              </div>
            )}
          </div>

          {/* Intereses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline-block mr-1" />
              Temas de interés
            </label>

            {isEditMode ? (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Selecciona los temas que te interesan para recibir
                  recomendaciones personalizadas
                </p>

                {Object.keys(availableInterests).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(availableInterests).map(
                      ([category, interests]) => (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">
                            {category}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {interests.map(interest => (
                              <button
                                key={interest._id}
                                type="button"
                                onClick={() => toggleInterest(interest._id)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                  selectedInterests.includes(interest._id)
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {interest.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No hay intereses disponibles
                  </p>
                )}

                {selectedInterests.length > 0 && (
                  <p className="text-sm text-purple-600 mt-3">
                    {selectedInterests.length} interés(es) seleccionado(s)
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedInterests.length > 0 ? (
                  selectedInterests.map(interestId => (
                    <span
                      key={interestId}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {getInterestName(interestId)}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">
                    No has seleccionado intereses
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción (solo en modo edición) */}
          {isEditMode && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentProfile
