import multer, { FileFilterCallback } from 'multer'
import { Request } from 'express'

// Tipos de archivos permitidos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Configuración de multer para almacenamiento en memoria
const storage = multer.memoryStorage()

// Filtro de archivos
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      new Error(
        'Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)'
      )
    )
  }
}

// Middleware de upload configurado
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
})

// Middleware para manejar errores de multer
export const handleMulterError = (
  error: Error,
  _req: Request,
  res: import('express').Response,
  next: import('express').NextFunction
): void => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        status: 'error',
        message: 'El archivo es demasiado grande. Máximo 5MB permitidos.',
      })
      return
    }
    res.status(400).json({
      status: 'error',
      message: `Error de subida: ${error.message}`,
    })
    return
  }

  if (error.message.includes('Tipo de archivo no permitido')) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    })
    return
  }

  next(error)
}
