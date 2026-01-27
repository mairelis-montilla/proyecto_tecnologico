import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera,
  Save,
  X,
  Loader2,
  Check,
  ArrowLeft,
  Mail,
  Pencil,
  Briefcase,
  Award,
  DollarSign,
  BadgeCheck,
  Send,
} from 'lucide-react'
import { useAuthStore } from '../stores/auth.store'
import { getAvatarUrl } from '../utils/avatar'
import type { MentorProfile } from '../types/auth.types'
import { GroupedSpecialties, mentorsService } from '@/services/mentors.service'

const MentorProfile = () => {
  const navigate = useNavigate()
  const { user, profile, refreshUser, isLoading: authLoading } = useAuthStore()

  // Cast profile to MentorProfile (del auth.types)
  const mentorProfile = profile as MentorProfile | null

  // Modo de visualización
  const [isEditMode, setIsEditMode] = useState(false)

  // Estado del formulario
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [experience, setExperience] = useState('')
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0)
  const [hourlyRate, setHourlyRate] = useState<number>(0)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [profileStatus, setProfileStatus] = useState<'draft' | 'published'>(
    'draft'
  )

  // Estado de la UI
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  // Línea donde defines el estado
  const [availableSpecialties, setAvailableSpecialties] =
    useState<GroupedSpecialties>({})

  // Cargar datos iniciales
  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Cargar perfil del mentor y especialidades disponibles en paralelo
      const [profileRes, specialtiesRes] = await Promise.all([
        mentorsService.getMyProfile(),
        mentorsService.getAvailableSpecialties(),
      ])

      const mentorData = profileRes.data.data.mentor

      // Establecer las especialidades disponibles
      if (specialtiesRes.data.data.specialties) {
        setAvailableSpecialties(specialtiesRes.data.data.specialties)
      }

      if (mentorData) {
        setTitle(mentorData.title || '')
        setBio(mentorData.bio || '')
        setExperience(mentorData.experience || '')
        setYearsOfExperience(mentorData.yearsOfExperience || 0)
        setHourlyRate(mentorData.hourlyRate || 0)
        setProfileStatus(mentorData.profileStatus || 'draft')

        // Establecer las especialidades seleccionadas del mentor
        if (mentorData.specialties && Array.isArray(mentorData.specialties)) {
          setSelectedSpecialties(
            mentorData.specialties.map((s: any) => s._id || s)
          )
        }

        if (mentorData.userId?.avatar) {
          setAvatarPreview(mentorData.userId.avatar)
        }
      }
    } catch (err: any) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar los datos del perfil')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona una imagen válida')
        return
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB')
        return
      }

      setAvatarFile(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleSpecialtys = (specialtyId: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialtyId)
        ? prev.filter(id => id !== specialtyId)
        : [...prev, specialtyId]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Subir avatar si hay uno nuevo seleccionado
      if (avatarFile) {
        await mentorsService.uploadAvatar(avatarFile)
        setAvatarFile(null)
      }

      // Actualizar el resto del perfil
      await mentorsService.updateMyProfile({
        title: title || undefined,
        bio: bio || undefined,
        experience: experience || undefined,
        yearsOfExperience: yearsOfExperience || undefined,
        hourlyRate: hourlyRate || undefined,
        specialties: selectedSpecialties,
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

  const handleCancel = () => {
    // Restaurar valores originales (igual que StudentProfile)
    if (mentorProfile) {
      setTitle(mentorProfile.title || '')
      setBio(mentorProfile.bio || '')
      setExperience(mentorProfile.experience || '')
      setYearsOfExperience(mentorProfile.yearsOfExperience || 0)
      setHourlyRate(mentorProfile.hourlyRate || 0)
      setSelectedSpecialties(mentorProfile.specialties || [])
      setAvatarPreview(user?.avatar ? getAvatarUrl(user.avatar) : null)
      setAvatarFile(null)
    }
    setError(null)
    setIsEditMode(false)
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    setError(null)
    setSuccess(null)

    try {
      await mentorsService.publishProfile({
        title,
        bio,
        specialties: selectedSpecialties,
        hourlyRate,
      })
      await loadData()
      setSuccess('Perfil publicado correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || 'Error al publicar el perfil'
      setError(errorMessage)
    } finally {
      setIsPublishing(false)
    }
  }

  const getAvatarDisplay = () => {
    if (avatarPreview) return avatarPreview
    return getAvatarUrl(user?.avatar)
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  // Verificar que el usuario sea un mentor
  if (user?.role !== 'mentor') {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-screen bg-gray-50">
        <X className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-lg text-gray-600">
          Acceso denegado. Esta página es solo para mentores.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Volver al Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Header - Igual que StudentProfile */}
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
              <h1 className="text-xl font-bold text-gray-900">
                Mi Perfil de Mentor
              </h1>
              <p className="text-gray-500 text-sm">
                {isEditMode
                  ? 'Edita tu información profesional'
                  : 'Tu información profesional'}
              </p>
            </div>
          </div>
          {!isEditMode && (
            <div className="flex items-center gap-2">
              {profileStatus === 'draft' && (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Publicar
                </button>
              )}
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
            </div>
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
              {user?.email || 'No disponible'}
            </div>
          </div>

          {/* Título Profesional */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Título Profesional{' '}
              {profileStatus === 'draft' && (
                <span className="text-red-500">*</span>
              )}
            </label>
            {isEditMode ? (
              <input
                type="text"
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej: Senior Full Stack Developer"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {title || (
                  <span className="text-gray-400">No especificado</span>
                )}
              </div>
            )}
            {profileStatus === 'draft' && (
              <p className="text-sm text-gray-500 mt-1">
                Requerido para publicar tu perfil
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Biografía Profesional
            </label>
            {isEditMode ? (
              <>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 500))}
                  placeholder="Describe tu experiencia y especialización profesional..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-sm text-gray-500 mt-1 text-right">
                  {bio.length}/500 caracteres
                </p>
              </>
            ) : (
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 min-h-[100px]">
                {bio || <span className="text-gray-400">Sin descripción</span>}
              </div>
            )}
          </div>

          {/* Experiencia Laboral */}
          <div>
            <label
              htmlFor="experience"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <Briefcase className="w-4 h-4 inline-block mr-1" />
              Experiencia Laboral
            </label>
            {isEditMode ? (
              <input
                type="text"
                id="experience"
                value={experience}
                onChange={e => setExperience(e.target.value)}
                placeholder="Ej: Senior Developer en Google"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {experience || (
                  <span className="text-gray-400">No especificada</span>
                )}
              </div>
            )}
          </div>

          {/* Grid de 2 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Años de Experiencia */}
            <div>
              <label
                htmlFor="yearsOfExperience"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <Award className="w-4 h-4 inline-block mr-1" />
                Años de Experiencia
              </label>
              {isEditMode ? (
                <input
                  type="number"
                  id="yearsOfExperience"
                  value={yearsOfExperience}
                  onChange={e => setYearsOfExperience(Number(e.target.value))}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              ) : (
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                  {yearsOfExperience} años
                </div>
              )}
            </div>

            {/* Tarifa por Hora */}
            <div>
              <label
                htmlFor="hourlyRate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <DollarSign className="w-4 h-4 inline-block mr-1" />
                Tarifa por Hora (S/.)
              </label>
              {isEditMode ? (
                <input
                  type="number"
                  id="hourlyRate"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(Number(e.target.value))}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              ) : (
                <div className="w-full px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 font-bold">
                  S/. {hourlyRate}
                </div>
              )}
            </div>
          </div>

          {/* Estados del Perfil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Estado de Publicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Publicación
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`px-4 py-2 text-sm font-medium rounded-full ${
                    profileStatus === 'published'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {profileStatus === 'published'
                    ? '🌐 Publicado'
                    : '📝 Borrador'}
                </span>
              </div>
              {profileStatus === 'draft' && (
                <p className="text-sm text-gray-500 mt-2">
                  Tu perfil no es visible para estudiantes.
                </p>
              )}
            </div>

            {/* Estado de Aprobación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Aprobación
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`px-4 py-2 text-sm font-medium rounded-full ${
                    mentorProfile?.isApproved
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {mentorProfile?.isApproved ? '✓ Aprobado' : '⏳ Pendiente'}
                </span>
              </div>
              {!mentorProfile?.isApproved && (
                <p className="text-sm text-gray-500 mt-2">
                  Revisión pendiente por administración.
                </p>
              )}
            </div>
          </div>

          {/* Especialidades */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BadgeCheck className="w-4 h-4 inline-block mr-1" />
              Áreas de Especialidad
            </label>

            {isEditMode ? (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Selecciona las áreas en las que tienes experiencia
                </p>

                {Object.keys(availableSpecialties).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(availableSpecialties).map(
                      ([category, specs]) => (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                            {category}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {specs.map(
                              (spec: {
                                _id: string
                                name: string
                                icon?: string
                              }) => (
                                <button
                                  key={spec._id}
                                  type="button"
                                  onClick={() => toggleSpecialtys(spec._id)}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    selectedSpecialties.includes(spec._id)
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {spec.icon && (
                                    <span className="mr-1">{spec.icon}</span>
                                  )}
                                  {spec.name}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No hay especialidades disponibles
                  </p>
                )}

                {selectedSpecialties.length > 0 && (
                  <p className="text-sm text-purple-600 mt-3">
                    {selectedSpecialties.length} especialidad(es)
                    seleccionada(s)
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSpecialties.length > 0 ? (
                  selectedSpecialties.map(specialtyId => {
                    // Buscar la especialidad en todas las categorías
                    let foundSpecialty:
                      | { _id: string; name: string; icon?: string }
                      | undefined
                    Object.values(availableSpecialties).forEach(specs => {
                      const found = specs.find(
                        (s: { _id: string; name: string; icon?: string }) =>
                          s._id === specialtyId
                      )
                      if (found) foundSpecialty = found
                    })

                    return (
                      <span
                        key={specialtyId}
                        className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {foundSpecialty?.icon && (
                          <span className="mr-1">{foundSpecialty.icon}</span>
                        )}
                        {foundSpecialty?.name || specialtyId}
                      </span>
                    )
                  })
                ) : (
                  <span className="text-gray-400">
                    No has seleccionado especialidades
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Estadísticas */}
          {!isEditMode && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Estadísticas
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Calificación</p>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500 text-lg">★</span>
                    <span className="text-lg font-bold text-gray-800">
                      {mentorProfile?.rating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-sm text-gray-500">/ 5.0</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">
                    Sesiones completadas
                  </p>
                  <p className="text-lg font-bold text-gray-800">
                    {mentorProfile?.totalSessions || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

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

export default MentorProfile
