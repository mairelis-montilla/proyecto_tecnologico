import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, Inbox, CheckCircle, XCircle } from 'lucide-react'
import SessionRequestCard from './SessionRequestCard'
import { BookingDetailsModal } from '../booking'
import Modal, { ModalBody, ModalFooter } from '../ui/Modal'
import { bookingsService } from '../../services/bookings.service'
import type { Booking, BookingsFilter } from '../../types/booking.types'

type TabValue = 'pending' | 'confirmed' | 'completed'

interface Tab {
  value: TabValue
  label: string
  filterStatus: BookingsFilter['status']
}

const tabs: Tab[] = [
  { value: 'pending', label: 'Pendientes', filterStatus: 'pending_review' },
  { value: 'confirmed', label: 'Confirmadas', filterStatus: 'confirmed' },
  { value: 'completed', label: 'Completadas', filterStatus: 'completed' },
]

const SessionRequestsList = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('pending')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modales
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Estados para aprobar/rechazar
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [meetLink, setMeetLink] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  // Fetch bookings
  const fetchBookings = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const currentTab = tabs.find(t => t.value === activeTab)
      const response = await bookingsService.getMyBookings({
        status: currentTab?.filterStatus,
        page: 1,
        limit: 50,
      })

      setBookings(response.data.bookings)
    } catch (err: any) {
      console.error('Error fetching bookings:', err)
      setError(
        err.response?.data?.message ||
          'Error al cargar las solicitudes. Por favor intenta de nuevo.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [activeTab])

  // Handlers
  const handleApprove = (bookingId: string) => {
    const booking = bookings.find(b => b._id === bookingId)
    if (booking) {
      setSelectedBooking(booking)
      setShowApproveConfirm(true)
      setActionError(null)
    }
  }

  const handleReject = (bookingId: string) => {
    const booking = bookings.find(b => b._id === bookingId)
    if (booking) {
      setSelectedBooking(booking)
      setShowRejectForm(true)
      setRejectReason('')
      setActionError(null)
    }
  }

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsDetailsModalOpen(true)
  }

  const confirmApprove = async () => {
    if (!selectedBooking || !meetLink.trim()) return

    setIsApproving(true)
    setActionError(null)

    try {
      await bookingsService.approveBooking(selectedBooking._id, meetLink.trim())
      setShowApproveConfirm(false)
      setMeetLink('')
      fetchBookings() // Recargar lista
    } catch (err: any) {
      setActionError(
        err.response?.data?.message || 'Error al aprobar la sesión'
      )
    } finally {
      setIsApproving(false)
    }
  }

  const confirmReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking || !rejectReason.trim()) return

    setIsRejecting(true)
    setActionError(null)

    try {
      await bookingsService.rejectBooking({
        bookingId: selectedBooking._id,
        reason: rejectReason.trim(),
      })
      setShowRejectForm(false)
      setRejectReason('')
      fetchBookings() // Recargar lista
    } catch (err: any) {
      setActionError(
        err.response?.data?.message || 'Error al rechazar la sesión'
      )
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`
                px-6 py-3 font-medium text-sm border-b-2 transition-all
                ${
                  activeTab === tab.value
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              {activeTab === tab.value && bookings.length > 0 && (
                <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {bookings.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
          <p className="text-gray-500">Cargando solicitudes...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Error al cargar</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchBookings}
              className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium underline"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay solicitudes
          </h3>
          <p className="text-gray-500 max-w-md">
            {activeTab === 'pending' &&
              'No tienes solicitudes pendientes de revisión en este momento.'}
            {activeTab === 'confirmed' &&
              'No tienes sesiones confirmadas próximas.'}
            {activeTab === 'completed' &&
              'Aún no has completado ninguna sesión.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map(booking => (
            <SessionRequestCard
              key={booking._id}
              booking={booking}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {selectedBooking && (
        <>
          {/* Modal de detalles */}
          <BookingDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            booking={selectedBooking}
          />

          {/* Modal confirmar aprobación */}
          <Modal
            isOpen={showApproveConfirm}
            onClose={() => {
              if (!isApproving) {
                setShowApproveConfirm(false)
                setMeetLink('')
              }
            }}
            title="Aprobar Sesion"
            size="md"
          >
            <ModalBody>
              <div className="py-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                  ¿Confirmar aprobacion?
                </h3>
                <p className="text-gray-600 mb-4 text-center">
                  Aprobaras la sesion con{' '}
                  <strong>
                    {(selectedBooking.studentId as any)?.userId?.firstName ||
                      'Estudiante'}
                  </strong>{' '}
                  sobre "{selectedBooking.topic}"
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link de Google Meet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={meetLink}
                    onChange={e => setMeetLink(e.target.value)}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pega el link de la reunion de Google Meet para el estudiante
                  </p>
                </div>

                {actionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-left">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{actionError}</p>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <button
                onClick={() => {
                  setShowApproveConfirm(false)
                  setMeetLink('')
                }}
                disabled={isApproving}
                className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmApprove}
                disabled={isApproving || !meetLink.trim()}
                className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Aprobar
                  </>
                )}
              </button>
            </ModalFooter>
          </Modal>

          {/* Modal rechazar con razón */}
          <Modal
            isOpen={showRejectForm}
            onClose={() => !isRejecting && setShowRejectForm(false)}
            title="Rechazar Sesión"
            size="md"
          >
            <form onSubmit={confirmReject}>
              <ModalBody>
                <div className="py-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                    Rechazar solicitud
                  </h3>
                  <p className="text-gray-600 mb-4 text-center text-sm">
                    El estudiante recibirá un reembolso completo (100%)
                  </p>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Razón del rechazo <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Explica por qué no puedes aceptar esta sesión..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                      maxLength={500}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {rejectReason.length}/500
                    </p>
                  </div>

                  {actionError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{actionError}</p>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  disabled={isRejecting}
                  className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRejecting || !rejectReason.trim()}
                  className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Rechazando...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </>
                  )}
                </button>
              </ModalFooter>
            </form>
          </Modal>
        </>
      )}
    </div>
  )
}

export default SessionRequestsList
