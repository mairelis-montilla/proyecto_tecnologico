/**
 * AdminDashboard.tsx
 *
 * Dashboard principal del administrador con:
 * - Cards de métricas clave (usuarios, mentores activos, sesiones del mes, ingresos)
 * - Gráfico de sesiones por semana (últimas 4 semanas)
 * - Gráfico de ingresos por mes (últimos 6 meses)
 * - Lista de últimas 5 reservas
 * - Lista de pagos pendientes de validación
 * - Accesos rápidos a secciones principales
 *
 * Endpoint: GET /api/admin/dashboard/stats
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  ChevronRight,
  CreditCard,
  BarChart2,
  BookOpen,
  Star,
} from 'lucide-react'
import { dashboardAdminService, DashboardData } from '../services/admin.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `S/. ${amount.toFixed(2)}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const bookingStatusLabels: Record<string, string> = {
  pending_payment: 'Pend. pago',
  payment_uploaded: 'Comprobante subido',
  payment_validated: 'Pago validado',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
  rejected: 'Rechazada',
}

const bookingStatusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  payment_uploaded: 'bg-blue-100 text-blue-700',
  payment_validated: 'bg-indigo-100 text-indigo-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
  rejected: 'bg-red-100 text-red-700',
}

// ─── Componente BarChart simple con SVG ───────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number }[]
  color: string
  formatValue?: (v: number) => string
  height?: number
}

function SimpleBarChart({
  data,
  color,
  formatValue,
  height = 120,
}: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="w-full">
      <div
        className="flex items-end gap-2 w-full"
        style={{ height: `${height}px` }}
      >
        {data.map((d, i) => {
          const pct = (d.value / max) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 leading-tight text-center">
                {formatValue ? formatValue(d.value) : d.value}
              </span>
              <div
                className={`w-full rounded-t-md transition-all ${color}`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-xs text-gray-400 leading-tight">
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Card de métrica ──────────────────────────────────────────────────────────

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  iconBg: string
  subtitle?: string
}

function MetricCard({ title, value, icon, iconBg, subtitle }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Acceso rápido ────────────────────────────────────────────────────────────

interface QuickLinkProps {
  to: string
  icon: React.ReactNode
  label: string
  description: string
  color: string
}

function QuickLink({ to, icon, label, description, color }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm">{label}</p>
        <p className="text-xs text-gray-500 truncate">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purpura transition-colors" />
    </Link>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const result = await dashboardAdminService.getStats()
        setData(result)
      } catch {
        setError('No se pudo cargar el dashboard. Intenta de nuevo.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purpura" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-gray-600">{error || 'Error al cargar los datos'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-purpura text-white rounded-lg text-sm hover:bg-opacity-90"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const {
    stats,
    recentBookings,
    pendingPaymentsList,
    sessionsByWeek,
    revenueByMonth,
  } = data

  const sessionsChartData = sessionsByWeek.map(w => ({
    label: w.label,
    value: w.count,
  }))

  const revenueChartData = revenueByMonth.map(m => ({
    label: m.label.split(' ')[0], // Solo el mes
    value: m.total,
  }))

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-500 text-sm mt-1">
          Resumen general de la plataforma
        </p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Usuarios"
          value={stats.totalUsers.toLocaleString()}
          icon={<Users className="w-6 h-6 text-white" />}
          iconBg="bg-purpura"
          subtitle="Registrados en la plataforma"
        />
        <MetricCard
          title="Mentores Activos"
          value={stats.activeMentors.toLocaleString()}
          icon={<UserCheck className="w-6 h-6 text-white" />}
          iconBg="bg-green-500"
          subtitle="Aprobados y activos"
        />
        <MetricCard
          title="Sesiones del Mes"
          value={stats.sessionsThisMonth.toLocaleString()}
          icon={<Calendar className="w-6 h-6 text-white" />}
          iconBg="bg-blue-500"
          subtitle="Confirmadas y completadas"
        />
        <MetricCard
          title="Ingresos del Mes"
          value={formatCurrency(stats.revenueThisMonth)}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          iconBg="bg-emerald-500"
          subtitle="Pagos validados"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sesiones por semana */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-800">Sesiones por Semana</h2>
            <span className="text-xs text-gray-400 ml-auto">
              Últimas 4 semanas
            </span>
          </div>
          {sessionsChartData.length > 0 ? (
            <SimpleBarChart
              data={sessionsChartData}
              color="bg-blue-400"
              height={140}
            />
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Sin datos disponibles
            </div>
          )}
        </div>

        {/* Ingresos por mes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold text-gray-800">Ingresos por Mes</h2>
            <span className="text-xs text-gray-400 ml-auto">
              Últimos 6 meses
            </span>
          </div>
          {revenueChartData.length > 0 ? (
            <SimpleBarChart
              data={revenueChartData}
              color="bg-emerald-400"
              formatValue={v => `S/.${v.toFixed(0)}`}
              height={140}
            />
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Sin datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Últimas reservas + Pagos pendientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas 5 reservas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold text-gray-800">Últimas Reservas</h2>
            </div>
            <Link
              to="/admin/transactions"
              className="text-xs text-purpura hover:underline flex items-center gap-1"
            >
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              No hay reservas recientes
            </p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b: any) => {
                const student = b.studentId?.userId
                const mentor = b.mentorId?.userId
                return (
                  <div
                    key={b._id}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purpura to-rosa flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {student?.firstName?.charAt(0) ?? 'E'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {student
                          ? `${student.firstName} ${student.lastName}`
                          : 'Estudiante'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {b.topic} ·{' '}
                        {mentor
                          ? `${mentor.firstName} ${mentor.lastName}`
                          : 'Mentor'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          bookingStatusColors[b.status] ??
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {bookingStatusLabels[b.status] ?? b.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(b.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagos pendientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold text-gray-800">Pagos Pendientes</h2>
              {stats.pendingPayments > 0 && (
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {stats.pendingPayments}
                </span>
              )}
            </div>
            <Link
              to="/admin/payments"
              className="text-xs text-purpura hover:underline flex items-center gap-1"
            >
              Validar <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {pendingPaymentsList.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              No hay pagos pendientes
            </p>
          ) : (
            <div className="space-y-3">
              {pendingPaymentsList.map((p: any) => {
                const booking = p.bookingId
                const student = booking?.studentId?.userId
                const mentor = booking?.mentorId?.userId
                return (
                  <div
                    key={p._id}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {student
                          ? `${student.firstName} ${student.lastName}`
                          : 'Estudiante'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {booking?.topic ?? 'Sesión'} ·{' '}
                        {mentor
                          ? `${mentor.firstName} ${mentor.lastName}`
                          : 'Mentor'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-800">
                        S/. {p.amount?.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">{p.paymentMethod}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink
            to="/admin/users"
            icon={<Users className="w-5 h-5 text-white" />}
            label="Gestionar Usuarios"
            description="Ver y administrar todos los usuarios"
            color="bg-purpura"
          />
          <QuickLink
            to="/admin/mentors"
            icon={<Star className="w-5 h-5 text-white" />}
            label="Aprobar Mentores"
            description="Revisar solicitudes pendientes"
            color="bg-indigo-500"
          />
          <QuickLink
            to="/admin/payments"
            icon={<CreditCard className="w-5 h-5 text-white" />}
            label="Validar Pagos"
            description="Aprobar o rechazar comprobantes"
            color="bg-yellow-500"
          />
          <QuickLink
            to="/admin/transactions"
            icon={<DollarSign className="w-5 h-5 text-white" />}
            label="Historial de Transacciones"
            description="Ver todas las transacciones"
            color="bg-emerald-500"
          />
          <QuickLink
            to="/admin/reports"
            icon={<BarChart2 className="w-5 h-5 text-white" />}
            label="Reportes"
            description="Análisis y exportación de datos"
            color="bg-blue-500"
          />
          <QuickLink
            to="/admin/specialties"
            icon={<BookOpen className="w-5 h-5 text-white" />}
            label="Especialidades"
            description="Gestionar categorías y temas"
            color="bg-rosa"
          />
        </div>
      </div>
    </div>
  )
}
