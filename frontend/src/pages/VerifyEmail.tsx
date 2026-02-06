import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshUser } = useAuthStore()

  // Obtener email de la URL o del estado de navegación
  const params = new URLSearchParams(location.search)
  const emailFromUrl = params.get('email')
  const emailFromState = (location.state as { email?: string })?.email
  const email = emailFromUrl || emailFromState || ''

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Cooldown para reenvío
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      )
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Enfocar primer input al cargar
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    // Solo permitir números
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError('')

    // Mover al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit cuando se completa el código
    if (value && index === 5 && newCode.every(d => d !== '')) {
      handleSubmit(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newCode = [...code]
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i]
    }
    setCode(newCode)

    // Enfocar el siguiente campo vacío o el último
    const nextEmptyIndex = newCode.findIndex(d => d === '')
    inputRefs.current[nextEmptyIndex === -1 ? 5 : nextEmptyIndex]?.focus()

    // Auto-submit si el código está completo
    if (newCode.every(d => d !== '')) {
      handleSubmit(newCode.join(''))
    }
  }

  const handleSubmit = async (codeString?: string) => {
    const fullCode = codeString || code.join('')
    if (fullCode.length !== 6) {
      setError('Ingresa el código completo de 6 dígitos')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await authService.verifyEmail({ email, code: fullCode })
      setSuccess('Correo verificado exitosamente')
      await refreshUser()
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1500)
    } catch (err) {
      const axiosError = err as {
        response?: { data?: { message?: string; attemptsRemaining?: number } }
      }
      const message =
        axiosError?.response?.data?.message || 'Error al verificar'
      const attempts = axiosError?.response?.data?.attemptsRemaining
      setError(
        attempts !== undefined
          ? `${message}. Intentos restantes: ${attempts}`
          : message
      )
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return

    setIsResending(true)
    setError('')

    try {
      await authService.resendVerificationCode(email)
      setSuccess('Se ha enviado un nuevo código a tu correo')
      setResendCooldown(60)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(
        axiosError?.response?.data?.message || 'Error al reenviar código'
      )
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo via-purpura to-rosa flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Email no especificado
          </h2>
          <p className="text-gray-600 mb-6">
            No se encontró el email para verificar.
          </p>
          <Link
            to="/login"
            className="text-purpura font-semibold hover:text-rosa transition"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo via-purpura to-rosa flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purpura to-rosa bg-clip-text text-transparent">
              MentorMatch
            </h1>
          </Link>
          <div className="mt-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purpura to-rosa rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Verifica tu correo
            </h2>
            <p className="text-gray-600 mt-2">
              Ingresa el código de 6 dígitos enviado a
            </p>
            <p className="text-purpura font-medium">{email}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center">
            {success}
          </div>
        )}

        <div className="flex justify-center gap-2 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={isLoading}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purpura focus:ring-2 focus:ring-purpura focus:ring-opacity-50 transition disabled:bg-gray-100"
            />
          ))}
        </div>

        <button
          onClick={() => handleSubmit()}
          disabled={isLoading || code.some(d => d === '')}
          className="w-full bg-gradient-to-r from-purpura to-rosa text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Verificando...
            </span>
          ) : (
            'Verificar código'
          )}
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ¿No recibiste el código?{' '}
            <button
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || isResending}
              className="text-purpura font-semibold hover:text-rosa transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending
                ? 'Enviando...'
                : resendCooldown > 0
                  ? `Reenviar en ${resendCooldown}s`
                  : 'Reenviar código'}
            </button>
          </p>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>El código expira en 15 minutos</p>
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
