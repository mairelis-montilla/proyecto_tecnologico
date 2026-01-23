import { query, param } from 'express-validator'

export const getMentorsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe ser un número entre 1 y 50'),
  query('sortBy')
    .optional()
    .isIn(['rating', 'totalSessions', 'hourlyRate', 'createdAt'])
    .withMessage('Campo de ordenamiento inválido'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Orden debe ser asc o desc'),
  query('specialty')
    .optional()
    .isMongoId()
    .withMessage('ID de especialidad inválido'),
]

export const getMentorByIdValidator = [
  param('id').isMongoId().withMessage('ID de mentor inválido'),
]

export const searchMentorsValidator = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La búsqueda debe tener entre 2 y 100 caracteres'),
  query('specialties')
    .optional()
    .custom(value => {
      if (!value) return true
      const ids = value.split(',')
      const mongoIdRegex = /^[0-9a-fA-F]{24}$/
      return ids.every((id: string) => mongoIdRegex.test(id.trim()))
    })
    .withMessage('IDs de especialidades inválidos'),
  query('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La categoría debe tener entre 2 y 50 caracteres'),
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('El rating mínimo debe ser un número entre 0 y 5'),
  query('maxRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La tarifa máxima debe ser un número positivo'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe ser un número entre 1 y 50'),
  query('sortBy')
    .optional()
    .isIn(['rating', 'totalSessions', 'hourlyRate', 'createdAt'])
    .withMessage('Campo de ordenamiento inválido'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Orden debe ser asc o desc'),
]

export const getFeaturedMentorsValidator = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('El límite debe ser un número entre 1 y 20'),
]
