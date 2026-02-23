import { Calendar, History, XCircle, Clock } from 'lucide-react'

export type SessionTab = 'pending' | 'upcoming' | 'past' | 'cancelled'

interface TabConfig {
  id: SessionTab
  label: string
  icon: React.ReactNode
}

const tabs: TabConfig[] = [
  {
    id: 'pending',
    label: 'Pendientes',
    icon: <Clock className="w-4 h-4" />,
  },
  {
    id: 'upcoming',
    label: 'Proximas',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: 'past',
    label: 'Pasadas',
    icon: <History className="w-4 h-4" />,
  },
  {
    id: 'cancelled',
    label: 'Canceladas',
    icon: <XCircle className="w-4 h-4" />,
  },
]

interface SessionsTabsProps {
  activeTab: SessionTab
  onTabChange: (tab: SessionTab) => void
  counts?: {
    pending: number
    upcoming: number
    past: number
    cancelled: number
  }
}

const SessionsTabs = ({
  activeTab,
  onTabChange,
  counts,
}: SessionsTabsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        const count = counts?.[tab.id]

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all
              ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-bold
                  ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}
                `}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default SessionsTabs
