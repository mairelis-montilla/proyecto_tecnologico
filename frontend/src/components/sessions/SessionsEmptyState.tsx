import { useNavigate } from 'react-router-dom'
import { Calendar, History, XCircle, Search } from 'lucide-react'
import type { SessionTab } from './SessionsTabs'

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
  const navigate = useNavigate()
  const config = emptyStateConfig[tab]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        {config.icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
        {config.title}
      </h3>
      <p className="text-gray-500 text-center max-w-md mb-6">
        {config.description}
      </p>
      {config.showCta && (
        <button
          onClick={() => navigate('/mentors')}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
        >
          <Search className="w-5 h-5" />
          Buscar Mentores
        </button>
      )}
    </div>
  )
}

export default SessionsEmptyState
