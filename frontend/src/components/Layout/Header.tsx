import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { getAvatarUrl } from '@/utils/avatar'
import { NotificationDropdown } from '../notifications/NotificationDropdown'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'student':
        return { text: 'Estudiante', color: 'bg-blue-100 text-blue-700' }
      case 'mentor':
        return { text: 'Mentor', color: 'bg-purple-100 text-purple-700' }
      case 'admin':
        return { text: 'Admin', color: 'bg-red-100 text-red-700' }
      default:
        return { text: 'Usuario', color: 'bg-gray-100 text-gray-700' }
    }
  }

  const roleBadge = getRoleBadge()

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30 h-16 flex-shrink-0">
      <div className="flex items-center justify-between px-4 h-full">
        {/* Botón menú móvil */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Título de la página (opcional, se puede mejorar con contexto) */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-gray-800">
            Bienvenido, {user?.firstName}
          </h1>
        </div>

        {/* Logo en móvil */}
        <Link to="/dashboard" className="lg:hidden">
          <span className="text-xl font-bold bg-gradient-to-r from-purpura to-rosa bg-clip-text text-transparent">
            MentorMatch
          </span>
        </Link>

        {/* Acciones del header */}
        <div className="flex items-center gap-4">
          {/* Notificaciones */}
          <NotificationDropdown />

          {/* Dropdown de usuario */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <img
                src={getAvatarUrl(user?.avatar)}
                alt="Avatar"
                className="w-9 h-9 rounded-full bg-gray-100 object-cover"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-800">
                  {user?.firstName} {user?.lastName}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${roleBadge.color}`}
                >
                  {roleBadge.text}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Mi Perfil
                  </Link>
                </div>

                <div className="border-t py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
