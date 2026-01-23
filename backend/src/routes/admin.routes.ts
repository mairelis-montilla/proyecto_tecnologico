import { Router } from 'express'
import { body, param, query } from 'express-validator'
import {
  getAllSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from '../controllers/specialties.controller.js'
import {
  authenticateToken,
  authorizeRoles,
} from '../middlewares/auth.middleware.js'

const router = Router()

// Middleware: todas las rutas de admin requieren autenticación y rol admin
router.use(authenticateToken)
router.use(authorizeRoles('admin'))

// ==================== SPECIALTIES ====================

// Validadores
const createSpecialtyValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('La categoría es requerida')
    .isLength({ min: 2, max: 50 })
    .withMessage('La categoría debe tener entre 2 y 50 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El icono no puede exceder 50 caracteres'),
]

const updateSpecialtyValidator = [
  param('id').isMongoId().withMessage('ID de especialidad inválido'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La categoría debe tener entre 2 y 50 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El icono no puede exceder 50 caracteres'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
]

const getSpecialtiesValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La búsqueda debe tener entre 2 y 100 caracteres'),
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive debe ser true o false'),
]

const deleteSpecialtyValidator = [
  param('id').isMongoId().withMessage('ID de especialidad inválido'),
]

// Rutas de especialidades para admin
// GET /api/admin/specialties - Listar todas las especialidades
router.get('/specialties', getSpecialtiesValidator, getAllSpecialties)

// POST /api/admin/specialties - Crear especialidad
router.post('/specialties', createSpecialtyValidator, createSpecialty)

// PUT /api/admin/specialties/:id - Actualizar especialidad
router.put('/specialties/:id', updateSpecialtyValidator, updateSpecialty)

// DELETE /api/admin/specialties/:id - Eliminar especialidad
router.delete('/specialties/:id', deleteSpecialtyValidator, deleteSpecialty)

export default router
