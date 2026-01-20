import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

type UserType = 'student' | 'mentor'

export default function Register() {
  const navigate = useNavigate()
  const { registerStudent, registerMentor, isLoading, error, clearError } = useAuthStore()

  const [userType, setUserType] = useState<UserType>('student')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    // Campos de estudiante
    institution: '',
    career: '',
    semester: '',
    // Campos de mentor
    bio: '',
    experience: '',
    hourlyRate: '',
  })
  const [validationError, setValidationError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    clearError()
    setValidationError('')
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      if (userType === 'student') {
        await registerStudent({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          institution: formData.institution || undefined,
          career: formData.career || undefined,
          semester: formData.semester ? parseInt(formData.semester) : undefined,
        })
      } else {
        if (!formData.bio || !formData.experience) {
          setValidationError('La biografía y experiencia son requeridas para mentores')
          return
        }
        await registerMentor({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          bio: formData.bio,
          experience: formData.experience,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        })
      }
      navigate('/dashboard')
    } catch {
      // Error ya manejado en el store
    }
  }

  const displayError = validationError || error

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo via-purpura to-rosa flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 my-8">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purpura to-rosa bg-clip-text text-transparent">
              MentorMatch
            </h1>
          </Link>
          <p className="text-gray-600 mt-2">Crea tu cuenta</p>
        </div>

        {/* Selector de tipo de usuario */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => setUserType('student')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              userType === 'student'
                ? 'bg-white text-purpura shadow'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Soy Estudiante
          </button>
          <button
            type="button"
            onClick={() => setUserType('mentor')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              userType === 'mentor'
                ? 'bg-white text-purpura shadow'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Soy Mentor
          </button>
        </div>

        {displayError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campos comunes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Apellido
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition"
              placeholder="tu@email.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Campos específicos de estudiante */}
          {userType === 'student' && (
            <>
              <div>
                <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-1">
                  Institución (opcional)
                </label>
                <input
                  type="text"
                  id="institution"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition"
                  placeholder="Universidad o instituto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="career" className="block text-sm font-medium text-gray-700 mb-1">
                    Carrera (opcional)
                  </label>
                  <input
                    type="text"
                    id="career"
                    name="career"
                    value={formData.career}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition"
                    placeholder="Tu carrera"
                  />
                </div>
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                    Semestre (opcional)
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition"
                  >
                    <option value="">Seleccionar</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <option key={num} value={num}>
                        {num}° semestre
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Campos específicos de mentor */}
          {userType === 'mentor' && (
            <>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Biografía profesional *
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition resize-none"
                  placeholder="Cuéntanos sobre tu experiencia y especialidades..."
                />
              </div>
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                  Experiencia *
                </label>
                <input
                  type="text"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition"
                  placeholder="Ej: 5 años en desarrollo web"
                />
              </div>
              <div>
                <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Tarifa por hora (opcional)
                </label>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition"
                  placeholder="S/. 0.00"
                />
              </div>
              <p className="text-sm text-gray-500">
                * Los mentores requieren aprobación del administrador antes de aparecer en las búsquedas.
              </p>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purpura to-rosa text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creando cuenta...
              </span>
            ) : (
              `Crear cuenta como ${userType === 'student' ? 'estudiante' : 'mentor'}`
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-purpura font-semibold hover:text-rosa transition">
              Inicia sesión
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 transition">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
