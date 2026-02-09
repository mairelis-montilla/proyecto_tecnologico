import { useState } from 'react'
import {
  CreditCard,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Copy,
  Check,
  Info,
} from 'lucide-react'
import Modal, { ModalBody, ModalFooter } from '../ui/Modal'
import FileUpload from '../ui/FileUpload'
import { formatPrice } from '../../utils/bookingHelpers'
import type { Booking, PaymentMethod } from '../../types/booking.types'
import { bookingsService } from '../../services/bookings.service'

interface PaymentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking
  onPaymentUploaded: () => void
}

const paymentMethods: { value: PaymentMethod; label: string; icon: string }[] =
  [
    { value: 'yape', label: 'Yape', icon: '💜' },
    { value: 'plin', label: 'Plin', icon: '💚' },
    { value: 'transferencia', label: 'Transferencia Bancaria', icon: '🏦' },
  ]

// Datos de pago por metodo (reemplazar con datos reales)
const paymentInfo: Record<
  PaymentMethod,
  { fields: { label: string; value: string }[] }
> = {
  yape: {
    fields: [
      { label: 'Numero Yape', value: '999 888 777' },
      { label: 'Titular', value: 'MentorMatch S.A.C.' },
    ],
  },
  plin: {
    fields: [
      { label: 'Numero Plin', value: '999 888 777' },
      { label: 'Titular', value: 'MentorMatch S.A.C.' },
    ],
  },
  transferencia: {
    fields: [
      { label: 'Banco', value: 'BCP' },
      { label: 'N° Cuenta', value: '123-4567890-0-12' },
      { label: 'CCI (Interbancario)', value: '00212345678901234567' },
      { label: 'Titular', value: 'MentorMatch S.A.C.' },
    ],
  },
}

// Componente para campo copiable
const CopyField = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value.replace(/\s/g, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = value.replace(/\s/g, '')
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <span className="text-xs text-gray-500">{label}</span>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all bg-purple-50 text-purple-700 hover:bg-purple-100"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" />
            Copiado
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            Copiar
          </>
        )}
      </button>
    </div>
  )
}

const PaymentUploadModal = ({
  isOpen,
  onClose,
  booking,
  onPaymentUploaded,
}: PaymentUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [amountPaid, setAmountPaid] = useState(booking.totalAmount.toString())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!file) {
      setError('Por favor sube el comprobante de pago')
      return
    }

    if (!paymentMethod) {
      setError('Por favor selecciona el metodo de pago')
      return
    }

    const amount = parseFloat(amountPaid)
    if (isNaN(amount) || amount <= 0) {
      setError('Por favor ingresa un monto valido')
      return
    }

    setIsLoading(true)

    try {
      await bookingsService.uploadPaymentProof({
        bookingId: booking._id,
        paymentMethod,
        amountPaid: amount,
        proofImage: file,
      })

      setIsSuccess(true)
    } catch (err: any) {
      console.error('Error uploading payment proof:', err)
      setError(
        err.response?.data?.message ||
          'Error al subir el comprobante. Por favor intenta de nuevo.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFile(null)
      setPaymentMethod('')
      setAmountPaid(booking.totalAmount.toString())
      setError(null)
      setIsSuccess(false)
      onClose()
    }
  }

  const handleSuccessClose = () => {
    onPaymentUploaded()
    handleClose()
  }

  // Vista de exito
  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleSuccessClose} size="md">
        <ModalBody className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Comprobante Enviado
          </h2>
          <p className="text-gray-600 mb-6">
            Tu comprobante de pago ha sido enviado exitosamente. Un
            administrador validara tu pago pronto.
          </p>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Estado:</strong> Pago pendiente de validacion
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Recibirás una notificación cuando tu pago sea confirmado
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="justify-center">
          <button
            onClick={handleSuccessClose}
            className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all"
          >
            Ver Mis Sesiones
          </button>
        </ModalFooter>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Subir Comprobante de Pago"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          {/* Resumen del pago */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total a pagar</span>
              <span className="text-2xl font-bold text-purple-600">
                {formatPrice(booking.totalAmount)}
              </span>
            </div>
          </div>

          {/* Metodo de pago */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              Metodo de pago <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map(method => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`
                    p-4 rounded-xl border-2 transition-all text-center
                    ${
                      paymentMethod === method.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }
                  `}
                >
                  <span className="text-2xl mb-1 block">{method.icon}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {method.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Info de datos de pago segun metodo seleccionado */}
            {paymentMethod && (
              <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700">
                    Datos para realizar el pago
                  </span>
                </div>
                <div className="space-y-1 divide-y divide-purple-100">
                  {paymentInfo[paymentMethod].fields.map(field => (
                    <CopyField
                      key={field.label}
                      label={field.label}
                      value={field.value}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subir comprobante */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <CreditCard className="w-4 h-4" />
              Comprobante de pago <span className="text-red-500">*</span>
            </label>
            <FileUpload onFileSelect={setFile} />
          </div>

          {/* Monto pagado */}
          <div className="mb-6">
            <label
              htmlFor="amount"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
            >
              <DollarSign className="w-4 h-4" />
              Monto pagado (S/.) <span className="text-red-500">*</span>
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="0.00"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <button
            type="submit"
            disabled={isLoading || !file || !paymentMethod}
            className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Enviar Comprobante
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default PaymentUploadModal
