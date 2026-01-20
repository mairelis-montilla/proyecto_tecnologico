import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import ComingSoon from '@/pages/ComingSoon'

function App() {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    checkAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mostrar loading mientras se verifica la autenticación
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purpura"></div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
        />

        {/* Rutas protegidas con Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Rutas de estudiante */}
          <Route
            path="/mentors"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ComingSoon title="Buscar Mentores" description="Pronto podrás buscar y conectar con mentores especializados en tu área de interés." />
              </ProtectedRoute>
            }
          />

          {/* Rutas de mentor */}
          <Route
            path="/availability"
            element={
              <ProtectedRoute allowedRoles={['mentor']}>
                <ComingSoon title="Mi Disponibilidad" description="Configura tus horarios disponibles para que los estudiantes puedan agendar sesiones contigo." />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute allowedRoles={['mentor']}>
                <ComingSoon title="Solicitudes" description="Aquí podrás ver y gestionar las solicitudes de sesiones de los estudiantes." />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews"
            element={
              <ProtectedRoute allowedRoles={['mentor']}>
                <ComingSoon title="Mis Reseñas" description="Ve las calificaciones y comentarios que los estudiantes han dejado sobre tus sesiones." />
              </ProtectedRoute>
            }
          />

          {/* Rutas compartidas */}
          <Route
            path="/sessions"
            element={
              <ProtectedRoute allowedRoles={['student', 'mentor']}>
                <ComingSoon title="Mis Sesiones" description="Visualiza tus sesiones programadas, completadas y pendientes." />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={<ComingSoon title="Mensajes" description="Comunícate con tus mentores o estudiantes de forma directa." />}
          />
          <Route
            path="/profile"
            element={<ComingSoon title="Mi Perfil" description="Visualiza y edita la información de tu perfil." />}
          />
          <Route
            path="/settings"
            element={<ComingSoon title="Configuración" description="Personaliza tu cuenta y preferencias de la plataforma." />}
          />

          {/* Rutas de admin */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ComingSoon title="Gestionar Usuarios" description="Administra los usuarios de la plataforma." />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/mentors"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ComingSoon title="Aprobar Mentores" description="Revisa y aprueba las solicitudes de nuevos mentores." />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
