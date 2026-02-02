import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileImage, FileText, AlertCircle } from 'lucide-react'
import {
  validatePaymentProofFile,
  formatFileSize,
  isImageFile,
  isPdfFile,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
} from '../../utils/fileValidation'

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  accept?: string
  maxSize?: number
  className?: string
}

const FileUpload = ({
  onFileSelect,
  accept = '.png,.jpg,.jpeg,.pdf',
  maxSize = MAX_FILE_SIZE,
  className = '',
}: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (selectedFile: File) => {
      setError(null)

      // Validar archivo
      const validation = validatePaymentProofFile(selectedFile)
      if (!validation.valid) {
        setError(validation.error || 'Archivo no valido')
        return
      }

      setFile(selectedFile)
      onFileSelect(selectedFile)

      // Crear preview si es imagen
      if (isImageFile(selectedFile)) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        setPreview(null)
      }
    },
    [onFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFile(droppedFile)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    onFileSelect(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {!file ? (
        // Zona de drop
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${
              isDragging
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
            }
            ${error ? 'border-red-300 bg-red-50' : ''}
          `}
        >
          <Upload
            className={`w-12 h-12 mx-auto mb-4 ${
              isDragging ? 'text-purple-500' : 'text-gray-400'
            }`}
          />
          <p className="text-gray-700 font-medium mb-1">
            {isDragging
              ? 'Suelta el archivo aqui'
              : 'Arrastra tu comprobante aqui'}
          </p>
          <p className="text-sm text-gray-500 mb-3">
            o haz click para seleccionar
          </p>
          <p className="text-xs text-gray-400">
            Formatos: {ALLOWED_EXTENSIONS.join(', ')} - Max{' '}
            {formatFileSize(maxSize)}
          </p>
        </div>
      ) : (
        // Preview del archivo
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <div className="flex items-start gap-4">
            {/* Preview o icono */}
            <div className="flex-shrink-0">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                />
              ) : isPdfFile(file) ? (
                <div className="w-24 h-24 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-10 h-10 text-red-500" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                  <FileImage className="w-10 h-10 text-gray-500" />
                </div>
              )}
            </div>

            {/* Info del archivo */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              <p className="text-xs text-green-600 mt-1">
                Archivo listo para enviar
              </p>
            </div>

            {/* Boton eliminar */}
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-red-500"
              aria-label="Eliminar archivo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}

export default FileUpload
