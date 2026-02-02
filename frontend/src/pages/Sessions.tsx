import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Loader2, RefreshCw } from 'lucide-react'
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
import { bookingsService } from '../services/bookings.service'
import type { Booking } from '../types/booking.types'

const Sessions = () => {
  const navigate = useNavigate()
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
    upcoming: 0,
    past: 0,
    cancelled: 0,
  })

  const fetchBookings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await bookingsService.getMyBookings({ status: activeTab })
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
      const [upcomingRes, pastRes, cancelledRes] = await Promise.all([
        bookingsService.getMyBookings({ status: 'upcoming', limit: 1 }),
        bookingsService.getMyBookings({ status: 'past', limit: 1 }),
        bookingsService.getMyBookings({ status: 'cancelled', limit: 1 }),
      ])

      setCounts({
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

  const handleModalClose = () => {
    setSelectedBooking(null)
    setShowPaymentModal(false)
    setShowCancelModal(false)
    setShowDetailsModal(false)
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
            {bookings.map((booking) => (
              <SessionCard
                key={booking._id}
                booking={booking}
                onPayClick={handlePayClick}
                onCancelClick={handleCancelClick}
                onDetailsClick={handleDetailsClick}
                onRateClick={handleRateClick}
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
        </>
      )}
    </div>
  )
}

export default Sessions
