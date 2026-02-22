/**
 * AdminReports.tsx
 *
 * Página de reportes del administrador con tabs:
 * - Usuarios registrados por período
 * - Sesiones completadas vs canceladas
 * - Ingresos por período
 * - Mentores más activos
 *
 * Filtros: hoy, semana, mes, rango personalizado
 * Exportar reportes a CSV
 *
 * Endpoints:
 *   GET /api/admin/reports/users
 *   GET /api/admin/reports/sessions
 *   GET /api/admin/reports/revenue
 *   GET /api/admin/reports/top-mentors
 *   GET /api/admin/reports/export
 */

import React, { useState, useEffect } from 'react'
import {
  Users,
  Calendar,
  DollarSign,
  Star,
  Download,
  Loader2,
  AlertCircle,
  UserCheck,
} from 'lucide-react'
import {
  reportsAdminService,
  ReportPeriod,
  ReportUsersData,
  ReportSessionsData,
  ReportRevenueData,
  ReportTopMentorsData,
  ReportsFilter,
} from '../services/admin.service'
import { api } from '../services/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `S/. ${amount.toFixed(2)}`
}

// ─── Barra simple SVG ─────────────────────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number; value2?: number }[]
  color: string
  color2?: string
  label2?: string
  formatValue?: (v: number) => string
  height?: number
}

function BarChart({ data, color, color2, label2, formatValue, height = 140 }: BarChartProps) {
  const allValues = data.flatMap((d) =>
    d.value2 !== undefined ? [d.value, d.value2] : [d.value]
  )
  const max = Math.max(...allValues, 1)

  return (
    <div className="w-full">
      {color2 && label2 && (
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${color}`} />
            <span className="text-xs text-gray-500">Completadas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${color2}`} />
            <span className="text-xs text-gray-500">{label2}</span>
          </div>
        </div>
      )}
      <div className="flex items-end gap-1 w-full" style={{ height: `${height}px` }}>
        {data.map((d, i) => {
          const pct1 = (d.value / max) * 100
          const pct2 = d.value2 !== undefined ? (d.value2 / max) * 100 : 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex gap-0.5 items-end" style={{ height: '100%' }}>
                <div
                  className={`flex-1 rounded-t-sm transition-all ${color}`}
                  style={{ height: `${Math.max(pct1, 1)}%` }}
                  title={`${d.label}: ${formatValue ? formatValue(d.value) : d.value}`}
                />
                {d.value2 !== undefined && color2 && (
                  <div
                    className={`flex-1 rounded-t-sm transition-all ${color2}`}
                    style={{ height: `${Math.max(pct2, 1)}%` }}
                    title={`${d.label}: ${d.value2}`}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-xs text-gray-400 leading-tight block">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Selector de período ──────────────────────────────────────────────────────

interface PeriodSelectorProps {
  period: ReportPeriod
  dateFrom: string
  dateTo: string
  onChange: (period: ReportPeriod, dateFrom: string, dateTo: string) => void
}

function PeriodSelector({ period, dateFrom, dateTo, onChange }: PeriodSelectorProps) {
  const periods: { value: ReportPeriod; label: string }[] = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'custom', label: 'Personalizado' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex border border-gray-200 rounded-lg overflow-hidden">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => onChange(p.value, dateFrom, dateTo)}
            className={`px-3 py-1.5 text-sm transition-colors ${
              period === p.value
                ? 'bg-purpura text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {period === 'custom' && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onChange('custom', e.target.value, dateTo)}
            className="border border-gray-200 rounded-lg text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purpura/30"
          />
          <span className="text-gray-400 text-sm">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onChange('custom', dateFrom, e.target.value)}
            className="border border-gray-200 rounded-lg text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purpura/30"
          />
        </div>
      )}
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabKey = 'users' | 'sessions' | 'revenue' | 'top-mentors'

interface Tab {
  key: TabKey
  label: string
  icon: React.ReactNode
}

const TABS: Tab[] = [
  { key: 'users', label: 'Usuarios', icon: <Users className="w-4 h-4" /> },
  { key: 'sessions', label: 'Sesiones', icon: <Calendar className="w-4 h-4" /> },
  { key: 'revenue', label: 'Ingresos', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'top-mentors', label: 'Top Mentores', icon: <Star className="w-4 h-4" /> },
]

// ─── Reporte de usuarios ──────────────────────────────────────────────────────

function UsersReport({ filter }: { filter: ReportsFilter }) {
  const [data, setData] = useState<ReportUsersData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const d = await reportsAdminService.getUsers(filter)
        setData(d)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filter.period, filter.dateFrom, filter.dateTo])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-purpura" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">Error al cargar el reporte</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-purpura/10 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purpura">{data.totalInPeriod}</p>
          <p className="text-xs text-gray-500 mt-1">Total en período</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{data.byRole.student}</p>
          <p className="text-xs text-gray-500 mt-1">Estudiantes</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{data.byRole.mentor}</p>
          <p className="text-xs text-gray-500 mt-1">Mentores</p>
        </div>
        <div className="bg-gray-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{data.byRole.admin}</p>
          <p className="text-xs text-gray-500 mt-1">Admins</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-700 mb-4">
          Registros por día
        </p>
        {data.chartData.length > 0 ? (
          <BarChart
            data={data.chartData.map((d) => ({ label: d.label, value: d.count }))}
            color="bg-purpura"
            height={140}
          />
        ) : (
          <p className="text-center text-gray-400 text-sm py-8">
            Sin datos en el período seleccionado
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Reporte de sesiones ──────────────────────────────────────────────────────

function SessionsReport({ filter }: { filter: ReportsFilter }) {
  const [data, setData] = useState<ReportSessionsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const d = await reportsAdminService.getSessions(filter)
        setData(d)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filter.period, filter.dateFrom, filter.dateTo])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-purpura" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">Error al cargar el reporte</span>
      </div>
    )
  }

  const summary = data.summary
  const total = summary.total ?? 0
  const completed = summary.completed ?? 0
  const cancelled = summary.cancelled ?? 0

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{total}</p>
          <p className="text-xs text-gray-500 mt-1">Total sesiones</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{completed}</p>
          <p className="text-xs text-gray-500 mt-1">Completadas / Confirmadas</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{cancelled}</p>
          <p className="text-xs text-gray-500 mt-1">Canceladas</p>
        </div>
      </div>

      {/* Barra de progreso */}
      {total > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Completadas {Math.round((completed / total) * 100)}%</span>
            <span>Canceladas {Math.round((cancelled / total) * 100)}%</span>
          </div>
          <div className="h-3 rounded-full bg-gray-200 overflow-hidden flex">
            <div
              className="bg-green-400 h-full transition-all"
              style={{ width: `${(completed / total) * 100}%` }}
            />
            <div
              className="bg-red-400 h-full transition-all"
              style={{ width: `${(cancelled / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-700 mb-4">
          Completadas vs Canceladas por día
        </p>
        {data.chartData.length > 0 ? (
          <BarChart
            data={data.chartData.map((d) => ({
              label: d.label,
              value: d.completed,
              value2: d.cancelled,
            }))}
            color="bg-green-400"
            color2="bg-red-300"
            label2="Canceladas"
            height={140}
          />
        ) : (
          <p className="text-center text-gray-400 text-sm py-8">
            Sin datos en el período seleccionado
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Reporte de ingresos ──────────────────────────────────────────────────────

function RevenueReport({ filter }: { filter: ReportsFilter }) {
  const [data, setData] = useState<ReportRevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const d = await reportsAdminService.getRevenue(filter)
        setData(d)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filter.period, filter.dateFrom, filter.dateTo])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-purpura" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">Error al cargar el reporte</span>
      </div>
    )
  }

  const { summary } = data

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-emerald-700">
            {formatCurrency(summary.totalRevenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total recaudado</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-purple-700">
            {formatCurrency(summary.totalPlatformFees)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Comisión plataforma (10%)</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-blue-700">
            {formatCurrency(summary.totalMentorEarnings)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ganancias mentores (90%)</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-700 mb-4">
          Ingresos validados por día
        </p>
        {data.chartData.length > 0 ? (
          <BarChart
            data={data.chartData.map((d) => ({
              label: d.label,
              value: d.total,
            }))}
            color="bg-emerald-400"
            formatValue={(v) => `S/.${v.toFixed(0)}`}
            height={140}
          />
        ) : (
          <p className="text-center text-gray-400 text-sm py-8">
            Sin datos en el período seleccionado
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Reporte top mentores ─────────────────────────────────────────────────────

function TopMentorsReport({ filter }: { filter: ReportsFilter }) {
  const [data, setData] = useState<ReportTopMentorsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const d = await reportsAdminService.getTopMentors(filter)
        setData(d)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filter.period, filter.dateFrom, filter.dateTo])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-purpura" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">Error al cargar el reporte</span>
      </div>
    )
  }

  if (data.topMentors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
        <UserCheck className="w-8 h-8" />
        <p className="text-sm">Sin datos en el período seleccionado</p>
      </div>
    )
  }

  const maxSessions = Math.max(...data.topMentors.map((m) => m.sessionsCount), 1)

  return (
    <div className="space-y-3">
      {data.topMentors.map((mentor, index) => (
        <div
          key={String(mentor.mentorId)}
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
        >
          {/* Posición */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              index === 0
                ? 'bg-yellow-400 text-yellow-900'
                : index === 1
                ? 'bg-gray-300 text-gray-800'
                : index === 2
                ? 'bg-amber-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {index + 1}
          </div>

          {/* Avatar */}
          {mentor.avatar ? (
            <img
              src={mentor.avatar}
              alt={mentor.name}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purpura to-rosa flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {mentor.name.charAt(0)}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {mentor.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{mentor.title}</p>
            {/* Barra de sesiones */}
            <div className="mt-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-purpura transition-all"
                style={{ width: `${(mentor.sessionsCount / maxSessions) * 100}%` }}
              />
            </div>
          </div>

          {/* Métricas */}
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-gray-800">
              {mentor.sessionsCount} ses.
            </p>
            <p className="text-xs text-emerald-600">
              {formatCurrency(mentor.revenue)}
            </p>
            <p className="text-xs text-yellow-600">
              ★ {mentor.rating?.toFixed(1) ?? '-'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<TabKey>('users')
  const [period, setPeriod] = useState<ReportPeriod>('month')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exporting, setExporting] = useState(false)

  const filter: ReportsFilter = {
    period,
    ...(period === 'custom' && dateFrom ? { dateFrom } : {}),
    ...(period === 'custom' && dateTo ? { dateTo } : {}),
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params: Record<string, string> = {
        type: activeTab,
        period,
        ...(period === 'custom' && dateFrom ? { dateFrom } : {}),
        ...(period === 'custom' && dateTo ? { dateTo } : {}),
      }
      const query = new URLSearchParams(params).toString()
      const response = await api.get(`/admin/reports/export?${query}`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Error al exportar. Intenta de nuevo.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Análisis de datos para toma de decisiones
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-purpura text-white rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-60"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Exportar CSV
        </button>
      </div>

      {/* Selector de período */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Período</p>
        <PeriodSelector
          period={period}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={(p, df, dt) => {
            setPeriod(p)
            setDateFrom(df)
            setDateTo(dt)
          }}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-purpura border-b-2 border-purpura bg-purpura/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {activeTab === 'users' && <UsersReport filter={filter} />}
          {activeTab === 'sessions' && <SessionsReport filter={filter} />}
          {activeTab === 'revenue' && <RevenueReport filter={filter} />}
          {activeTab === 'top-mentors' && <TopMentorsReport filter={filter} />}
        </div>
      </div>
    </div>
  )
}
