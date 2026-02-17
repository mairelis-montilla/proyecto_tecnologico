import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import {
  SessionCard,
  SessionsTabs,
  SessionsEmptyState,
  type SessionTab,
} from '../components/sessions'
import {
  PaymentUploadModal,
  CancelBookingModal,
  BookingDetailsModal,
} from '../components/booking'
import Modal, { ModalBody, ModalFooter } from '../components/ui/Modal'
import { bookingsService } from '../services/bookings.service'
import type { Booking } from '../types/booking.types'

const Sessions = () => {
  const [activeTab, setActiveTab] = useState<SessionTab>('upcoming')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Counts for tabs
  const [counts, setCounts] = useState({
    pending: 0,
    upcoming: 0,
    past: 0,
    cancelled: 0,
  })

  // Mentor approve/reject states
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [meetLink, setMeetLink] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let statusParam: 'upcoming' | 'past' | 'cancelled' | 'pending_review' = 'upcoming'

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

  // Fetch all counts on mount
  const fetchCounts = useCallback(async () => {
    try {
      const [pendingRes, upcomingRes, pastRes, cancelledRes] = await Promise.all([
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
  }, [fetchCounts])

  // Handlers for actions
  const handlePayClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowPaymentModal(true)
  }

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowCancelModal(true)
  }

  const handleDetailsClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowDetailsModal(true)
  }

  const handleRateClick = (booking: Booking) => {
    // TODO: Implement rating modal
    console.log('Rate booking:', booking._id)
  }

  const handleApproveClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowApproveModal(true)
    setMeetLink('')
    setActionError(null)
  }

  const handleRejectClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowRejectModal(true)
    setRejectReason('')
    setActionError(null)
  }

  const confirmApprove = async () => {
    if (!selectedBooking || !meetLink.trim()) return
    setIsApproving(true)
    setActionError(null)
    try {
      await bookingsService.approveBooking(selectedBooking._id, meetLink.trim())
      setShowApproveModal(false)
      setMeetLink('')
      fetchBookings()
      fetchCounts()
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Error al aprobar la sesion')
    } finally {
      setIsApproving(false)
    }
  }

  const confirmReject = async () => {
    if (!selectedBooking || !rejectReason.trim()) return
    setIsRejecting(true)
    setActionError(null)
    try {
      await bookingsService.rejectBooking({
        bookingId: selectedBooking._id,
        reason: rejectReason.trim(),
      })
      setShowRejectModal(false)
      setRejectReason('')
      fetchBookings()
      fetchCounts()
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Error al rechazar la sesion')
    } finally {
      setIsRejecting(false)
    }
  }

  const handleModalClose = () => {
    setSelectedBooking(null)
    setShowPaymentModal(false)
    setShowCancelModal(false)
    setShowDetailsModal(false)
    setShowApproveModal(false)
    setShowRejectModal(false)
  }

  const handlePaymentUploaded = () => {
    handleModalClose()
    fetchBookings()
    fetchCounts()
  }

  const handleCancelled = () => {
    handleModalClose()
    fetchBookings()
    fetchCounts()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-7 h-7 text-purple-600" />
                Mis Sesiones
              </h1>
              <p className="text-gray-500 mt-1">
                Gestiona tus sesiones de mentoria
              </p>
            </div>

            <button
              onClick={() => {
                fetchBookings()
                fetchCounts()
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              Actualizar
            </button>
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
            {bookings.map(booking => (
              <SessionCard
                key={booking._id}
                booking={booking}
                onPayClick={handlePayClick}
                onCancelClick={handleCancelClick}
                onDetailsClick={handleDetailsClick}
                onRateClick={handleRateClick}
                onApproveClick={handleApproveClick}
                onRejectClick={handleRejectClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedBooking && (
        <>
          <PaymentUploadModal
            isOpen={showPaymentModal}
            onClose={handleModalClose}
            booking={selectedBooking}
            onPaymentUploaded={handlePaymentUploaded}
          />

          <CancelBookingModal
            isOpen={showCancelModal}
            onClose={handleModalClose}
            booking={selectedBooking}
            onCancelled={handleCancelled}
          />

          <BookingDetailsModal
            isOpen={showDetailsModal}
            onClose={handleModalClose}
            booking={selectedBooking}
          />

          {/* Modal Aprobar Sesion */}
          <Modal
            isOpen={showApproveModal}
            onClose={() => { if (!isApproving) { setShowApproveModal(false); setMeetLink('') } }}
            title="Aprobar Sesion"
            size="md"
          >
            <ModalBody>
              <div className="py-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                  Confirmar aprobacion
                </h3>
                <p className="text-gray-600 mb-4 text-center">
                  Aprobaras la sesion sobre "{selectedBooking.topic}"
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
                  />
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
                onClick={() => { setShowApproveModal(false); setMeetLink('') }}
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

          {/* Modal Rechazar Sesion */}
          <Modal
            isOpen={showRejectModal}
            onClose={() => { if (!isRejecting) setShowRejectModal(false) }}
            title="Rechazar Sesion"
            size="md"
          >
            <ModalBody>
              <div className="py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                  Rechazar solicitud
                </h3>
                <p className="text-gray-600 mb-4 text-center text-sm">
                  El estudiante recibira un reembolso completo (100%)
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razon del rechazo <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Explica por que no puedes aceptar esta sesion..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">{rejectReason.length}/500</p>
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
                onClick={() => setShowRejectModal(false)}
                disabled={isRejecting}
                className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReject}
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
          </Modal>
        </>
      )}
    </div>
  )
}

export default Sessions
