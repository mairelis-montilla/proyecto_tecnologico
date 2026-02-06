import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'

type Step = 'email' | 'code' | 'password'

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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

  // Enfocar primer input de código cuando cambia al paso de código
  useEffect(() => {
    if (step === 'code') {
      inputRefs.current[0]?.focus()
    }
  }, [step])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await authService.forgotPassword({ email })
      setStep('code')
      setResendCooldown(60)
      setSuccess('Se ha enviado un código a tu correo')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError?.response?.data?.message || 'Error al enviar código')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (value && index === 5 && newCode.every(d => d !== '')) {
      setStep('password')
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newCode = [...code]
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i]
    }
    setCode(newCode)

    if (newCode.every(d => d !== '')) {
      setStep('password')
    } else {
      const nextEmptyIndex = newCode.findIndex(d => d === '')
      inputRefs.current[nextEmptyIndex]?.focus()
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (!/\d/.test(newPassword)) {
      setError('La contraseña debe contener al menos un número')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await authService.resetPassword({
        email,
        code: code.join(''),
        newPassword,
      })
      setSuccess('Contraseña actualizada exitosamente')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    } catch (err) {
      const axiosError = err as {
        response?: { data?: { message?: string; attemptsRemaining?: number } }
      }
      const message =
        axiosError?.response?.data?.message || 'Error al restablecer contraseña'
      const attempts = axiosError?.response?.data?.attemptsRemaining

      if (message.includes('expirado') || message.includes('inválido')) {
        setError(message)
        setStep('email')
        setCode(['', '', '', '', '', ''])
      } else {
        setError(
          attempts !== undefined
            ? `${message}. Intentos restantes: ${attempts}`
            : message
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return

    setIsLoading(true)
    setError('')

    try {
      await authService.forgotPassword({ email })
      setResendCooldown(60)
      setSuccess('Se ha enviado un nuevo código')
      setCode(['', '', '', '', '', ''])
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(
        axiosError?.response?.data?.message || 'Error al reenviar código'
      )
    } finally {
      setIsLoading(false)
    }
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {step === 'email' && 'Recuperar contraseña'}
              {step === 'code' && 'Ingresa el código'}
              {step === 'password' && 'Nueva contraseña'}
            </h2>
            <p className="text-gray-600 mt-2">
              {step === 'email' &&
                'Ingresa tu correo para recibir un código de recuperación'}
              {step === 'code' && (
                <>
                  Ingresa el código enviado a <br />
                  <span className="text-purpura font-medium">{email}</span>
                </>
              )}
              {step === 'password' &&
                'Crea una nueva contraseña para tu cuenta'}
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                step === 'email' ? 'bg-purpura' : 'bg-green-500'
              }`}
            />
            <div
              className={`w-8 h-1 ${
                step !== 'email' ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <div
              className={`w-3 h-3 rounded-full ${
                step === 'code'
                  ? 'bg-purpura'
                  : step === 'password'
                    ? 'bg-green-500'
                    : 'bg-gray-300'
              }`}
            />
            <div
              className={`w-8 h-1 ${
                step === 'password' ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <div
              className={`w-3 h-3 rounded-full ${
                step === 'password' ? 'bg-purpura' : 'bg-gray-300'
              }`}
            />
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

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setError('')
                }}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition"
                placeholder="tu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
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
                  Enviando...
                </span>
              ) : (
                'Enviar código'
              )}
            </button>
          </form>
        )}

        {/* Step 2: Code */}
        {step === 'code' && (
          <div className="space-y-6">
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(index, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(index, e)}
                  onPaste={index === 0 ? handleCodePaste : undefined}
                  disabled={isLoading}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purpura focus:ring-2 focus:ring-purpura focus:ring-opacity-50 transition disabled:bg-gray-100"
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-gray-600">
                ¿No recibiste el código?{' '}
                <button
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-purpura font-semibold hover:text-rosa transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0
                    ? `Reenviar en ${resendCooldown}s`
                    : 'Reenviar código'}
                </button>
              </p>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>El código expira en 15 minutos</p>
            </div>

            <button
              onClick={() => setStep('email')}
              className="w-full text-gray-600 py-2 hover:text-gray-800 transition"
            >
              ← Cambiar correo
            </button>
          </div>
        )}

        {/* Step 3: New Password */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nueva contraseña
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value)
                  setError('')
                }}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 6 caracteres, debe incluir al menos un número
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirmar contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value)
                  setError('')
                }}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purpura focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
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
                  Actualizando...
                </span>
              ) : (
                'Actualizar contraseña'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
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
