import { useEffect, useState } from 'react'
import { Bell, Calendar, Users } from 'lucide-react'
import { bookingsService } from '../services/bookings.service'
import SessionRequestsList from '../components/booking/SessionRequestsList'

const MentorDashboard = () => {
    const [pendingCount, setPendingCount] = useState(0)

    // Fetch pending count para el badge
    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                const response = await bookingsService.getMentorPendingCount()
                setPendingCount(response.data.pendingCount)
            } catch (error) {
                console.error('Error fetching pending count:', error)
            }
        }

        fetchPendingCount()

        // Polling cada 30 segundos para actualizar el contador
        const interval = setInterval(fetchPendingCount, 30000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Solicitudes de Sesión
                        </h1>
                        {pendingCount > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
                                <Bell className="w-5 h-5 text-purple-600" />
                                <span className="font-bold text-purple-900">
                                    {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-gray-600">
                        Gestiona tus solicitudes de sesiones con estudiantes
                    </p>
                </div>

                {/* Stats (opcional) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Pendientes</p>
                                <p className="text-3xl font-bold text-purple-600">{pendingCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <Bell className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Próximas</p>
                                <p className="text-3xl font-bold text-blue-600">-</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Completadas</p>
                                <p className="text-3xl font-bold text-green-600">-</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <SessionRequestsList />
                </div>
            </div>
        </div>
    )
}

export default MentorDashboard