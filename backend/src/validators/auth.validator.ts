import { body } from 'express-validator'

export const registerStudentValidator = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail({ gmail_remove_subaddress: false }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/\d/)
    .withMessage('La contraseña debe contener al menos un número'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ max: 50 })
    .withMessage('El nombre no puede exceder 50 caracteres'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('El apellido es requerido')
    .isLength({ max: 50 })
    .withMessage('El apellido no puede exceder 50 caracteres'),
  // Campos opcionales del estudiante
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La biografía no puede exceder 500 caracteres'),
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La institución no puede exceder 100 caracteres'),
  body('career')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La carrera no puede exceder 100 caracteres'),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('El semestre debe ser un número entre 1 y 12'),
]

export const registerMentorValidator = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail({ gmail_remove_subaddress: false }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/\d/)
    .withMessage('La contraseña debe contener al menos un número'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ max: 50 })
    .withMessage('El nombre no puede exceder 50 caracteres'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('El apellido es requerido')
    .isLength({ max: 50 })
    .withMessage('El apellido no puede exceder 50 caracteres'),
  // Campos requeridos del mentor
  body('bio')
    .trim()
    .notEmpty()
    .withMessage('La biografía es requerida para mentores')
    .isLength({ max: 1000 })
    .withMessage('La biografía no puede exceder 1000 caracteres'),
  body('experience')
    .trim()
    .notEmpty()
    .withMessage('La experiencia es requerida para mentores'),
  // Campos opcionales del mentor
  body('specialties')
    .optional()
    .isArray()
    .withMessage('Las especialidades deben ser un array'),
  body('credentials')
    .optional()
    .isArray()
    .withMessage('Las credenciales deben ser un array'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La tarifa por hora debe ser un número positivo'),
]

export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail({ gmail_remove_subaddress: false }),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
]
