import { useState, useEffect, useCallback } from 'react'
import { Loader2, Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { bookingsService } from '../services/bookings.service'
import {
  SessionCard,
  SessionsTabs,
  SessionsEmptyState,
  type SessionTab,
} from '../components/sessions'
import { BookingDetailsModal, SessionRequestCard } from '../components/booking'
import Modal, { ModalBody, ModalFooter } from '../components/ui/Modal'
import type { Booking } from '../types/booking.types'

const MentorDashboard = () => {
  const [activeTab, setActiveTab] = useState<SessionTab>('pending')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Counts
  const [counts, setCounts] = useState({
    pending: 0,
    upcoming: 0,
    past: 0,
    cancelled: 0,
  })

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Approval/Rejection states
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [meetLink, setMeetLink] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let statusParam: 'upcoming' | 'past' | 'cancelled' | 'pending_review' =
        'pending_review'

      switch (activeTab) {
        case 'pending':
          statusParam = 'pending_review'
          break
        case 'upcoming':
          statusParam = 'upcoming'
          break
        case 'past':
          statusParam = 'past'
          break
        case 'cancelled':
          statusParam = 'cancelled'
          break
      }

      const response = await bookingsService.getMyBookings({
        status: statusParam,
      })
      setBookings(response.data.bookings)
    } catch (err: any) {
      console.error('Error fetching bookings:', err)
      setError('Error al cargar las sesiones. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  const fetchCounts = useCallback(async () => {
    try {
      const [pendingRes, upcomingRes, pastRes, cancelledRes] =
        await Promise.all([
          bookingsService.getMyBookings({ status: 'pending_review', limit: 1 }),
          bookingsService.getMyBookings({ status: 'upcoming', limit: 1 }),
          bookingsService.getMyBookings({ status: 'past', limit: 1 }),
          bookingsService.getMyBookings({ status: 'cancelled', limit: 1 }),
        ])

      setCounts({
        pending: pendingRes.data.pagination?.totalItems || 0,
        upcoming: upcomingRes.data.pagination?.totalItems || 0,
        past: pastRes.data.pagination?.totalItems || 0,
        cancelled: cancelledRes.data.pagination?.totalItems || 0,
      })
    } catch (err) {
      console.error('Error fetching counts:', err)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  useEffect(() => {
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [fetchCounts])

  // Handlers
  const handleDetailsClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowDetailsModal(true)
  }

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

  const confirmApprove = async () => {
    if (!selectedBooking || !meetLink.trim()) return

    setIsApproving(true)
    setActionError(null)

    try {
      await bookingsService.approveBooking(selectedBooking._id, meetLink.trim())
      setShowApproveConfirm(false)
      setMeetLink('')
      fetchBookings()
      fetchCounts()
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
      fetchBookings()
      fetchCounts()
    } catch (err: any) {
      setActionError(
        err.response?.data?.message || 'Error al rechazar la sesión'
      )
    } finally {
      setIsRejecting(false)
    }
  }

  const handleModalClose = () => {
    setSelectedBooking(null)
    setShowDetailsModal(false)
    setShowApproveConfirm(false)
    setShowRejectForm(false)
    setActionError(null)
    setMeetLink('')
    setRejectReason('')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-7 h-7 text-purple-600" />
                Solicitudes y Sesiones
              </h1>
              <p className="text-gray-500 mt-1">
                Gestiona tus solicitudes y sesiones programadas
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="mb-6">
          <SessionsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={counts}
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-500">Cargando sesiones...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <span className="text-3xl">😕</span>
            </div>
            <p className="text-gray-900 font-medium mb-2">{error}</p>
            <button
              onClick={fetchBookings}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <SessionsEmptyState tab={activeTab} />
        ) : (
          <div className="space-y-4">
            {bookings.map(booking =>
              activeTab === 'pending' ? (
                <SessionRequestCard
                  key={booking._id}
                  booking={booking}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onViewDetails={handleDetailsClick}
                />
              ) : (
                <SessionCard
                  key={booking._id}
                  booking={booking}
                  onDetailsClick={handleDetailsClick}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedBooking && (
        <>
          <BookingDetailsModal
            isOpen={showDetailsModal}
            onClose={handleModalClose}
            booking={selectedBooking}
          />

          {/* Modal confirmar aprobación */}
          <Modal
            isOpen={showApproveConfirm}
            onClose={() => {
              if (!isApproving) handleModalClose()
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
                onClick={handleModalClose}
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
            onClose={() => !isRejecting && handleModalClose()}
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
                  onClick={handleModalClose}
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

export default MentorDashboard
