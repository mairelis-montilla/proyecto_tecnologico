import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import type { StudentProfile, MentorProfile } from '@/types/auth.types'
import { getAvatarUrl } from '@/utils/avatar'

export default function Dashboard() {
  const { user, profile, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purpura"></div>
      </div>
    )
  }

  const isStudent = user?.role === 'student'
  const isMentor = user?.role === 'mentor'
  const isAdmin = user?.role === 'admin'
  const studentProfile = profile as StudentProfile | null
  const mentorProfile = profile as MentorProfile | null

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-purpura to-rosa rounded-2xl p-6 md:p-8 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          ¡Bienvenido
          {isStudent
            ? ', estudiante'
            : isMentor
              ? ', mentor'
              : isAdmin
                ? ', administrador'
                : ''}
          !
        </h2>
        <p className="text-white/80">
          {isStudent
            ? 'Encuentra mentores que te ayuden a alcanzar tus metas académicas.'
            : isMentor
              ? 'Comparte tu conocimiento y ayuda a estudiantes a crecer.'
              : isAdmin
                ? 'Gestiona la plataforma y aprueba nuevos mentores.'
                : 'Tu panel de control está listo.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Mi Perfil
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={getAvatarUrl(user?.avatar)}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full bg-gray-100 object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-800">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${isStudent
                        ? 'bg-blue-100 text-blue-700'
                        : isMentor
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                  >
                    {isStudent ? 'Estudiante' : isMentor ? 'Mentor' : 'Admin'}
                  </span>
                </div>
              </div>

              {/* Student Profile Details */}
              {isStudent && studentProfile && (
                <div className="border-t pt-4 space-y-2">
                  {studentProfile.institution && (
                    <div>
                      <p className="text-xs text-gray-500">Institución</p>
                      <p className="text-sm text-gray-800">
                        {studentProfile.institution}
                      </p>
                    </div>
                  )}
                  {studentProfile.career && (
                    <div>
                      <p className="text-xs text-gray-500">Carrera</p>
                      <p className="text-sm text-gray-800">
                        {studentProfile.career}
                      </p>
                    </div>
                  )}
                  {studentProfile.semester && (
                    <div>
                      <p className="text-xs text-gray-500">Semestre</p>
                      <p className="text-sm text-gray-800">
                        {studentProfile.semester}° semestre
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">
                      Sesiones completadas
                    </p>
                    <p className="text-sm text-gray-800">
                      {studentProfile.totalSessions}
                    </p>
                  </div>
                </div>
              )}

              {/* Mentor Profile Details */}
              {isMentor && mentorProfile && (
                <div className="border-t pt-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Biografía</p>
                    <p className="text-sm text-gray-800 line-clamp-3">
                      {mentorProfile.bio}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Experiencia</p>
                    <p className="text-sm text-gray-800">
                      {mentorProfile.experience}
                    </p>
                  </div>
                  {mentorProfile.hourlyRate && (
                    <div>
                      <p className="text-xs text-gray-500">Tarifa por hora</p>
                      <p className="text-sm text-gray-800">
                        S/. {mentorProfile.hourlyRate}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">Estado:</p>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${mentorProfile.isApproved
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                        }`}
                    >
                      {mentorProfile.isApproved
                        ? 'Aprobado'
                        : 'Pendiente de aprobación'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Calificación</p>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm text-gray-800">
                        {mentorProfile.rating.toFixed(1)} / 5.0
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      Sesiones completadas
                    </p>
                    <p className="text-sm text-gray-800">
                      {mentorProfile.totalSessions}
                    </p>
                  </div>
                </div>
              )}

              <Link
                to="/profile"
                className="block w-full text-center py-2 px-4 border border-purpura text-purpura rounded-lg hover:bg-purpura hover:text-white transition mt-4"
              >
                Ver perfil completo
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Acciones rápidas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isStudent && (
                <>
                  <Link
                    to="/mentors"
                    className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purpura hover:bg-purpura/5 transition group"
                  >
                    <div className="text-left">
                      <span className="text-2xl mb-2 block">🔍</span>
                      <p className="font-medium text-gray-800 group-hover:text-purpura">
                        Buscar mentores
                      </p>
                      <p className="text-sm text-gray-500">
                        Encuentra el mentor ideal para ti
                      </p>
                    </div>
                  </Link>
                  <Link
                    to="/sessions"
                    className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purpura hover:bg-purpura/5 transition group"
                  >
                    <div className="text-left">
                      <span className="text-2xl mb-2 block">📅</span>
                      <p className="font-medium text-gray-800 group-hover:text-purpura">
                        Mis sesiones
                      </p>
                      <p className="text-sm text-gray-500">
                        Ver sesiones programadas
                      </p>
                    </div>
                  </Link>
                </>
              )}
              {isMentor && (
                <>
                  <Link
                    to="/availability"
                    className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purpura hover:bg-purpura/5 transition group"
                  >
                    <div className="text-left">
                      <span className="text-2xl mb-2 block">📆</span>
                      <p className="font-medium text-gray-800 group-hover:text-purpura">
                        Mi disponibilidad
                      </p>
                      <p className="text-sm text-gray-500">
                        Configura tus horarios disponibles
                      </p>
                    </div>
                  </Link>
                  <Link
                    to="/requests"
                    className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purpura hover:bg-purpura/5 transition group"
                  >
                    <div className="text-left">
                      <span className="text-2xl mb-2 block">📋</span>
                      <p className="font-medium text-gray-800 group-hover:text-purpura">
                        Solicitudes
                      </p>
                      <p className="text-sm text-gray-500">
                        Ver solicitudes de estudiantes
                      </p>
                    </div>
                  </Link>
                </>
              )}
              {isAdmin && (
                <>
                  <Link
                    to="/admin/users"
                    className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purpura hover:bg-purpura/5 transition group"
                  >
                    <div className="text-left">
                      <span className="text-2xl mb-2 block">👥</span>
                      <p className="font-medium text-gray-800 group-hover:text-purpura">
                        Gestionar usuarios
                      </p>
                      <p className="text-sm text-gray-500">
                        Ver y administrar usuarios
                      </p>
                    </div>
                  </Link>
                  <Link
                    to="/admin/mentors"
                    className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purpura hover:bg-purpura/5 transition group"
                  >
                    <div className="text-left">
                      <span className="text-2xl mb-2 block">✅</span>
                      <p className="font-medium text-gray-800 group-hover:text-purpura">
                        Aprobar mentores
                      </p>
                      <p className="text-sm text-gray-500">
                        Revisar solicitudes de mentores
                      </p>
                    </div>
                  </Link>
                </>
              )}
              <Link
                to="/messages"
                className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purpura hover:bg-purpura/5 transition group"
              >
                <div className="text-left">
                  <span className="text-2xl mb-2 block">💬</span>
                  <p className="font-medium text-gray-800 group-hover:text-purpura">
                    Mensajes
                  </p>
                  <p className="text-sm text-gray-500">Ver conversaciones</p>
                </div>
              </Link>
              <Link
                to="/settings"
                className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purpura hover:bg-purpura/5 transition group"
              >
                <div className="text-left">
                  <span className="text-2xl mb-2 block">⚙️</span>
                  <p className="font-medium text-gray-800 group-hover:text-purpura">
                    Configuración
                  </p>
                  {/* <Link to="/editar"> */}
                  <p className="text-sm text-gray-500">Editar mi perfil</p>
                  {/* </Link> */}
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Actividad reciente
            </h3>
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">📭</span>
              <p>No hay actividad reciente</p>
              <p className="text-sm">
                {isStudent
                  ? 'Comienza buscando un mentor para tu primera sesión'
                  : isMentor
                    ? 'Configura tu disponibilidad para recibir solicitudes'
                    : 'Revisa las solicitudes de mentores pendientes'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
