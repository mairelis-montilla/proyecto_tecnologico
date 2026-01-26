import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

// Flag para saber si ya se configuró
let isConfigured = false

/**
 * Configura Cloudinary con las credenciales del entorno
 * Se llama de forma lazy para asegurar que las variables de entorno ya estén cargadas
 */
const ensureConfigured = () => {
  if (!isConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
    isConfigured = true
  }
}

export interface UploadResult {
  url: string
  publicId: string
  width?: number
  height?: number
}

/**
 * Sube una imagen a Cloudinary
 * @param fileBuffer - Buffer de la imagen
 * @param folder - Carpeta en Cloudinary donde guardar la imagen
 * @returns URL pública y ID de la imagen
 */
export const uploadImage = async (
  fileBuffer: Buffer,
  folder: string = 'avatars'
): Promise<UploadResult> => {
  ensureConfigured()
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `mentormatch/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(new Error(`Error subiendo imagen: ${error.message}`))
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          })
        } else {
          reject(new Error('Error desconocido al subir imagen'))
        }
      }
    )

    uploadStream.end(fileBuffer)
  })
}

/**
 * Elimina una imagen de Cloudinary
 * @param publicId - ID público de la imagen
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  ensureConfigured()
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Error eliminando imagen de Cloudinary:', error)
  }
}

/**
 * Extrae el public_id de una URL de Cloudinary
 * @param url - URL de Cloudinary
 * @returns public_id o null si no es válida
 */
export const extractPublicId = (url: string): string | null => {
  try {
    // URL formato: https://res.cloudinary.com/cloud_name/image/upload/v1234/folder/filename.ext
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)
    return matches ? matches[1] : null
  } catch {
    return null
  }
}

export default cloudinary
