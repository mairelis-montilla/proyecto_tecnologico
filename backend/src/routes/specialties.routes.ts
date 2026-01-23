import { Router } from 'express'
import {
  getSpecialties,
  getSpecialtyById,
  getCategories,
} from '../controllers/specialties.controller.js'
import { param, query } from 'express-validator'

const router = Router()

// Validadores
const getSpecialtiesValidator = [
  query('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La categoría debe tener entre 2 y 50 caracteres'),
  query('includeCount')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('includeCount debe ser true o false'),
]

const getSpecialtyByIdValidator = [
  param('id').isMongoId().withMessage('ID de especialidad inválido'),
]

// Rutas públicas
// GET /api/specialties/categories - Listar categorías (debe ir antes de /:id)
router.get('/categories', getCategories)

// GET /api/specialties - Listar todas las especialidades
router.get('/', getSpecialtiesValidator, getSpecialties)

// GET /api/specialties/:id - Obtener especialidad por ID
router.get('/:id', getSpecialtyByIdValidator, getSpecialtyById)

export default router
