// Tamaño maximo de archivo: 5MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024

// Tipos de archivo permitidos para comprobantes de pago
export const ALLOWED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
]

// Extensiones permitidas para mostrar al usuario
export const ALLOWED_EXTENSIONS = ['PNG', 'JPG', 'JPEG', 'PDF']

export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validar archivo de comprobante de pago
 */
export const validatePaymentProofFile = (file: File): FileValidationResult => {
  // Validar tipo de archivo
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Use ${ALLOWED_EXTENSIONS.join(', ')}.`,
    }
  }

  // Validar tamaño de archivo
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'El archivo excede el tamaño maximo de 5MB.',
    }
  }

  return { valid: true }
}

/**
 * Formatear tamaño de archivo para mostrar
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Verificar si el archivo es una imagen
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

/**
 * Verificar si el archivo es un PDF
 */
export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf'
}
