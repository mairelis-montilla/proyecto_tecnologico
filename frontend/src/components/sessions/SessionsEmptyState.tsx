import { Calendar, History, XCircle, Search, Clock } from 'lucide-react'
import type { SessionTab } from './SessionsTabs'
import { useAuthStore } from '../../stores/auth.store'

interface SessionsEmptyStateProps {
  tab: SessionTab
}

const emptyStateConfig: Record<
  SessionTab,
  {
    icon: React.ReactNode
    title: string
    description: string
    showCta: boolean
  }
> = {
  pending: {
    icon: <Clock className="w-12 h-12 text-gray-400" />,
    title: 'No tienes solicitudes pendientes',
    description: 'Cuando envies solicitudes a mentores, apareceran aqui.',
    showCta: true,
  },
  upcoming: {
    icon: <Calendar className="w-12 h-12 text-gray-400" />,
    title: 'No tienes sesiones programadas',
    description:
      'Busca un mentor y agenda tu primera sesion para comenzar tu aprendizaje.',
    showCta: true,
  },
  past: {
    icon: <History className="w-12 h-12 text-gray-400" />,
    title: 'No tienes sesiones pasadas',
    description:
      'Aqui apareceran las sesiones que hayas completado con tus mentores.',
    showCta: false,
  },
  cancelled: {
    icon: <XCircle className="w-12 h-12 text-gray-400" />,
    title: 'No tienes sesiones canceladas',
    description: 'Las sesiones que canceles apareceran aqui.',
    showCta: false,
  },
}

const SessionsEmptyState = ({ tab }: SessionsEmptyStateProps) => {
  const { user } = useAuthStore()
  const config = emptyStateConfig[tab]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        {config.icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
        {config.title}
      </h3>
      {user?.role === 'student' && (
        <p className="text-gray-500 text-center max-w-md mb-6">
          {config.description}
        </p>
      )}
      {config.showCta && user?.role === 'student' && (
        <a
          href="/mentors"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purpura hover:bg-indigo focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Search className="w-5 h-5 mr-2" />
          Buscar Mentores
        </a>
      )}
    </div>
  )
}

export default SessionsEmptyState
