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
} from 'lucide-react'
import { useAuthStore } from '../stores/auth.store'
import { getAvatarUrl } from '../utils/avatar'
import type { MentorProfile } from '../types/auth.types'
import { Specialty } from '../types/mentor.types'

const MentorProfile = () => {
  const navigate = useNavigate()
  const { user, profile, token, refreshUser, isLoading: authLoading } = useAuthStore()

  // Cast profile to MentorProfile (del auth.types)
  const mentorProfile = profile as MentorProfile | null

  // Modo de visualización
  const [isEditMode, setIsEditMode] = useState(false)

  // Estado del formulario
  const [bio, setBio] = useState('')
  const [experience, setExperience] = useState('')
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0)
  const [hourlyRate, setHourlyRate] = useState<number>(0)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Estado de la UI
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>([])

  // Cargar especialidades disponibles
  const loadSpecialties = async () => {
    try {
      const response = await fetch('/api/specialties')
      const data = await response.json()
      setAvailableSpecialties(data.data?.specialties || data.specialties || [])
    } catch (err) {
      console.error('Error loading specialties:', err)
    }
  }

  // Cargar datos del perfil desde el store (igual que StudentProfile)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)

      // Cargar especialidades
      await loadSpecialties()

      if (mentorProfile) {
        setBio(mentorProfile.bio || '')
        setExperience(mentorProfile.experience || '')
        setYearsOfExperience(mentorProfile.yearsOfExperience || 0)
        setHourlyRate(mentorProfile.hourlyRate || 0)
        setSelectedSpecialties(mentorProfile.specialties || [])

        if (user?.avatar) {
          setAvatarPreview(getAvatarUrl(user.avatar))
        }
      }

      setIsLoading(false)
    }

    if (!authLoading) {
      loadData()
    }
  }, [mentorProfile, user, authLoading])

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
      reader.onloadend = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Subir avatar si hay uno nuevo
      if (avatarFile) {
        const formData = new FormData()
        formData.append('avatar', avatarFile)
        const avatarResponse = await fetch('/api/mentors/profile/avatar', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        })

        if (!avatarResponse.ok) {
          throw new Error('Error al subir el avatar')
        }
      }

      // Actualizar perfil de mentor
      const response = await fetch('/api/mentors/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bio,
          experience,
          yearsOfExperience,
          hourlyRate,
          specialties: selectedSpecialties
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al guardar el perfil')
      }

      // Refrescar el usuario (igual que StudentProfile)
      await refreshUser()

      setSuccess('Perfil actualizado correctamente')
      setIsEditMode(false)
      setAvatarFile(null)

      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error guardando perfil:', err)
      setError(err.message || 'Error al guardar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Restaurar valores originales (igual que StudentProfile)
    if (mentorProfile) {
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

  // Obtener avatar (igual que StudentProfile)
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
        <p className="text-lg text-gray-600">Acceso denegado. Esta página es solo para mentores.</p>
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
              <h1 className="text-xl font-bold text-gray-900">Mi Perfil de Mentor</h1>
              <p className="text-gray-500 text-sm">
                {isEditMode
                  ? 'Edita tu información profesional'
                  : 'Tu información profesional'}
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
              {user?.email || 'No disponible'}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Biografía Profesional
            </label>
            {isEditMode ? (
              <>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 500))}
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
            <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 inline-block mr-1" />
              Experiencia Laboral
            </label>
            {isEditMode ? (
              <input
                type="text"
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Ej: Senior Developer en Google"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {experience || <span className="text-gray-400">No especificada</span>}
              </div>
            )}
          </div>

          {/* Grid de 2 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Años de Experiencia */}
            <div>
              <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
                <Award className="w-4 h-4 inline-block mr-1" />
                Años de Experiencia
              </label>
              {isEditMode ? (
                <input
                  type="number"
                  id="yearsOfExperience"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
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
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline-block mr-1" />
                Tarifa por Hora (S/.)
              </label>
              {isEditMode ? (
                <input
                  type="number"
                  id="hourlyRate"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
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

          {/* Estado de Aprobación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de Aprobación
            </label>
            <div className="flex items-center gap-2">
              <span
                className={`px-4 py-2 text-sm font-medium rounded-full ${mentorProfile?.isApproved
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
                  }`}
              >
                {mentorProfile?.isApproved
                  ? '✓ Perfil Aprobado'
                  : '⏳ Pendiente de aprobación'}
              </span>
            </div>
            {!mentorProfile?.isApproved && (
              <p className="text-sm text-gray-500 mt-2">
                Tu perfil está siendo revisado por el equipo de administración.
              </p>
            )}
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

                {availableSpecialties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableSpecialties.map(spec => (
                      <button
                        key={spec._id}
                        type="button"
                        onClick={() => {
                          setSelectedSpecialties(prev =>
                            prev.includes(spec._id)
                              ? prev.filter(id => id !== spec._id)
                              : [...prev, spec._id]
                          )
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedSpecialties.includes(spec._id)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {spec.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No hay especialidades disponibles
                  </p>
                )}

                {selectedSpecialties.length > 0 && (
                  <p className="text-sm text-purple-600 mt-3">
                    {selectedSpecialties.length} especialidad(es) seleccionada(s)
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSpecialties.length > 0 ? (
                  selectedSpecialties.map(specialtyId => {
                    const specialty = availableSpecialties.find(s => s._id === specialtyId)
                    return (
                      <span
                        key={specialtyId}
                        className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {specialty?.name || specialtyId}
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
              <h4 className="text-sm font-medium text-gray-700 mb-3">Estadísticas</h4>
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
                  <p className="text-xs text-gray-500 mb-1">Sesiones completadas</p>
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