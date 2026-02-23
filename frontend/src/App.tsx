import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import VerifyEmail from '@/pages/VerifyEmail'
import ForgotPassword from '@/pages/ForgotPassword'
import Dashboard from '@/pages/Dashboard'
import ComingSoon from '@/pages/ComingSoon'
import Mentors from '@/pages/Mentors'
import ProfilePage from './pages/ProfilePage'
import PublicMentorProfile from '@/pages/PublicMentorProfile'
import PublicStudentProfile from '@/pages/PublicStudentProfile'
import Sessions from '@/pages/Sessions'
import AdminMentorApproval from './pages/AdminAproveMentors'
import AdminPaymentValidation from './pages/AdminPaymentValidation'
import AdminSpecialties from './pages/AdminSpecialties'
import MentorAvailability from './pages/MentorAvailability'
import MentorDashboard from './pages/MentorDashboard'
import AdminUserManagement from './pages/AdminUserManagement'
import MentorReviewsPage from '@/pages/MentorReviewsPage'
import StudentMyPayments from '@/pages/StudentMyPayments'
import MentorEarnings from '@/pages/MentorEarnings'
import AdminDashboard from './pages/AdminDashboard'
import AdminTransactionHistory from './pages/AdminTransactionHistory'
import AdminReports from './pages/AdminReports'

function App() {
  const { isAuthenticated, isInitialized, user } = useAuthStore()
  const checkAuth = useAuthStore(state => state.checkAuth)
  const homeRedirect = isAuthenticated
    ? user?.role === 'admin'
      ? '/admin/dashboard'
      : '/dashboard'
    : null

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
          element={
            homeRedirect ? <Navigate to={homeRedirect} replace /> : <Landing />
          }
        />
        <Route
          path="/login"
          element={
            homeRedirect ? <Navigate to={homeRedirect} replace /> : <Login />
          }
        />
        <Route
          path="/register"
          element={
            homeRedirect ? <Navigate to={homeRedirect} replace /> : <Register />
          }
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Rutas protegidas con Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              user?.role === 'admin' ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <Dashboard />
              )
            }
          />

          {/* Rutas de estudiante */}
          <Route
            path="/mentors"
            element={
              <ProtectedRoute allowedRoles={['student', 'mentor']}>
                <Mentors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentors/:id"
            element={
              <ProtectedRoute allowedRoles={['student', 'mentor']}>
                <PublicMentorProfile />
              </ProtectedRoute>
            }
          />

          {/* Rutas de mentor */}
          <Route
            path="/availability"
            element={
              <ProtectedRoute allowedRoles={['mentor']}>
                <MentorAvailability />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute allowedRoles={['mentor']}>
                <MentorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reviews"
            element={
              <ProtectedRoute allowedRoles={['mentor']}>
                <MentorReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/earnings"
            element={
              <ProtectedRoute allowedRoles={['mentor']}>
                <MentorEarnings />
              </ProtectedRoute>
            }
          />

          {/* Rutas de estudiante - pagos */}
          <Route
            path="/my-payments"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentMyPayments />
              </ProtectedRoute>
            }
          />

          {/* Rutas compartidas */}
          <Route
            path="/sessions"
            element={
              <ProtectedRoute allowedRoles={['student', 'mentor']}>
                <Sessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ComingSoon
                title="Mensajes"
                description="Comunícate con tus mentores o estudiantes de forma directa."
              />
            }
          />
          <Route
            path="/students/:id"
            element={
              <ProtectedRoute allowedRoles={['student', 'mentor']}>
                <PublicStudentProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['student', 'mentor']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ComingSoon
                title="Configuración"
                description="Personaliza tu cuenta y preferencias de la plataforma."
              />
            }
          />

          {/* Rutas de admin */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUserManagement
                  title="Gestionar Usuarios"
                  description="Administra los usuarios de la plataforma."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/mentors"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminMentorApproval
                  title="Aprobar Mentores"
                  description="Revisa y aprueba las solicitudes de nuevos mentores."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPaymentValidation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/specialties"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSpecialties />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTransactionHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReports />
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
