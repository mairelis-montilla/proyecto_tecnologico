import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import mongoose, { PipelineStage } from 'mongoose'
import { Mentor } from '../models/Mentor.model.js'
import { Availability } from '../models/Availability.model.js'
import { Review } from '../models/Review.model.js'
import { User } from '../models/User.model.js'
import { Specialty } from '../models/Specialty.model.js'
import { AuthRequest } from '../middlewares/auth.middleware.js'
import {
  uploadImage,
  deleteImage,
  extractPublicId,
} from '../services/cloudinary.service.js'

// Campos permitidos para ordenamiento
const ALLOWED_SORT_FIELDS = [
  'rating',
  'totalSessions',
  'hourlyRate',
  'createdAt',
] as const
type SortField = (typeof ALLOWED_SORT_FIELDS)[number]

// Helper para validar ObjectId
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id)

// Helper para crear paginación
const createPagination = (page: number, limit: number, total: number) => ({
  currentPage: page,
  totalPages: Math.ceil(total / limit),
  totalItems: total,
  itemsPerPage: limit,
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
})

// Helper para parsear parámetros de query
const parseQueryParams = (query: Request['query']) => {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1)
  const limit = Math.min(
    50,
    Math.max(1, parseInt(query.limit as string, 10) || 10)
  )
  const sortBy = ALLOWED_SORT_FIELDS.includes(query.sortBy as SortField)
    ? (query.sortBy as SortField)
    : 'rating'
  const sortOrder: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1

  return { page, limit, skip: (page - 1) * limit, sortBy, sortOrder }
}

/**
 * US 8: Ver Marketplace de Mentores
 * GET /api/mentors
 * Listar todos los mentores aprobados y activos con paginación
 */
export const getMentors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = parseQueryParams(req.query)
    const { specialty } = req.query

    // Filtro base: solo mentores aprobados y activos
    const filter: mongoose.FilterQuery<typeof Mentor> = {
      isApproved: true,
      isActive: true,
    }

    // Filtrar por especialidad si se proporciona
    if (specialty && isValidObjectId(specialty as string)) {
      filter.specialties = new mongoose.Types.ObjectId(specialty as string)
    }

    // Ejecutar queries en paralelo para mejor rendimiento
    const [mentors, total] = await Promise.all([
      Mentor.find(filter)
        .populate({
          path: 'userId',
          select: 'firstName lastName email avatar',
        })
        .populate({
          path: 'specialties',
          select: 'name category icon',
        })
        .sort([[sortBy, sortOrder]])
        .skip(skip)
        .limit(limit)
        .lean(),
      Mentor.countDocuments(filter),
    ])

    res.status(200).json({
      status: 'success',
      data: {
        mentors,
        pagination: createPagination(page, limit, total),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * US 11: Ver Perfil Completo de Mentor
 * GET /api/mentors/:id
 * Obtener perfil detallado de un mentor
 */
export const getMentorById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params

    if (!isValidObjectId(id)) {
      res.status(400).json({
        status: 'error',
        message: 'ID de mentor inválido',
      })
      return
    }

    // Ejecutar todas las queries en paralelo
    const [mentor, availability, reviews, totalReviews] = await Promise.all([
      Mentor.findOne({
        _id: id,
        isApproved: true,
        isActive: true,
      })
        .populate({
          path: 'userId',
          select: 'firstName lastName email avatar',
        })
        .populate({
          path: 'specialties',
          select: 'name description category icon',
        })
        .lean(),

      Availability.find({
        mentorId: id,
        isActive: true,
      })
        .sort({ dayOfWeek: 1, startTime: 1 })
        .lean(),

      Review.find({ mentorId: id })
        .populate({
          path: 'studentId',
          select: 'firstName lastName avatar',
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Review.countDocuments({ mentorId: id }),
    ])

    if (!mentor) {
      res.status(404).json({
        status: 'error',
        message: 'Mentor no encontrado',
      })
      return
    }

    // Calcular estadísticas de reseñas
    const ratingStats = await Review.aggregate([
      { $match: { mentorId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating',
          },
        },
      },
    ])

    const stats = ratingStats[0]
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    if (stats?.ratingDistribution) {
      stats.ratingDistribution.forEach((rating: number) => {
        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating as keyof typeof ratingDistribution]++
        }
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        mentor,
        availability,
        reviews: {
          items: reviews,
          total: totalReviews,
          stats: {
            averageRating: stats?.averageRating
              ? Number(stats.averageRating.toFixed(1))
              : mentor.rating || 0,
            distribution: ratingDistribution,
          },
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * US 9 & 10: Buscar Mentores por Categoría y Palabra Clave
 * GET /api/mentors/search
 * Búsqueda avanzada de mentores
 */
export const searchMentors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Errores de validación',
        errors: errors.array(),
      })
      return
    }

    const { page, limit, skip, sortBy, sortOrder } = parseQueryParams(req.query)
    const { q, specialties, category, minRating, maxRate, minRate, languages } =
      req.query

    // Pipeline de agregación
    const pipeline: PipelineStage[] = []

    // Match inicial: solo mentores aprobados y activos
    pipeline.push({
      $match: {
        isApproved: true,
        isActive: true,
      },
    })

    // Lookup para obtener datos del usuario
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    })
    pipeline.push({ $unwind: '$user' })

    // Lookup para obtener especialidades
    pipeline.push({
      $lookup: {
        from: 'specialties',
        localField: 'specialties',
        foreignField: '_id',
        as: 'specialtiesData',
      },
    })

    // Construir filtros adicionales
    const matchFilters: mongoose.FilterQuery<typeof Mentor> = {}

    // Búsqueda por palabra clave
    if (q && typeof q === 'string' && q.trim().length >= 2) {
      const searchTerm = q.trim()
      // Escapar caracteres especiales de regex
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const searchRegex = new RegExp(escapedTerm, 'i')

      matchFilters.$or = [
        { 'user.firstName': searchRegex },
        { 'user.lastName': searchRegex },
        { bio: searchRegex },
        { experience: searchRegex },
        { 'specialtiesData.name': searchRegex },
        { 'specialtiesData.description': searchRegex },
      ]
    }

    // Filtro por especialidades (array de IDs separados por coma)
    if (specialties && typeof specialties === 'string') {
      const specialtyIds = specialties
        .split(',')
        .map(id => id.trim())
        .filter(isValidObjectId)

      if (specialtyIds.length > 0) {
        matchFilters.specialties = {
          $in: specialtyIds.map(id => new mongoose.Types.ObjectId(id)),
        }
      }
    }

    // Filtro por categoría de especialidad
    if (
      category &&
      typeof category === 'string' &&
      category.trim().length >= 2
    ) {
      const escapedCategory = category
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      matchFilters['specialtiesData.category'] = new RegExp(
        escapedCategory,
        'i'
      )
    }

    // Filtro por rating mínimo
    if (minRating) {
      const rating = parseFloat(minRating as string)
      if (!isNaN(rating) && rating >= 0 && rating <= 5) {
        matchFilters.rating = { $gte: rating }
      }
    }

    // Filtro por rango de tarifa
    if (minRate || maxRate) {
      matchFilters.hourlyRate = {}
      if (minRate) {
        const min = parseFloat(minRate as string)
        if (!isNaN(min) && min >= 0) {
          ;(matchFilters.hourlyRate as Record<string, number>).$gte = min
        }
      }
      if (maxRate) {
        const max = parseFloat(maxRate as string)
        if (!isNaN(max) && max >= 0) {
          ;(matchFilters.hourlyRate as Record<string, number>).$lte = max
        }
      }
      // Si el objeto quedó vacío, eliminarlo
      if (Object.keys(matchFilters.hourlyRate as object).length === 0) {
        delete matchFilters.hourlyRate
      }
    }

    // Filtro por idiomas
    if (languages && typeof languages === 'string') {
      const langList = languages.split(',').map(l => l.trim().toLowerCase())
      if (langList.length > 0) {
        matchFilters.languages = { $in: langList }
      }
    }

    // Agregar filtros al pipeline si existen
    if (Object.keys(matchFilters).length > 0) {
      pipeline.push({ $match: matchFilters })
    }

    // Proyección de campos
    // IMPORTANTE: Solo incluir campos que existen en el modelo Mentor
    pipeline.push({
      $project: {
        _id: 1,
        bio: 1,
        experience: 1,
        credentials: 1,
        rating: 1,
        // totalReviews
        totalSessions: 1,
        hourlyRate: 1,
        languages: 1,
        createdAt: 1,
        updatedAt: 1,
        userId: {
          _id: '$user._id',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          email: '$user.email',
          avatar: '$user.avatar',
        },
        specialties: {
          $map: {
            input: '$specialtiesData',
            as: 'spec',
            in: {
              _id: '$$spec._id',
              name: '$$spec.name',
              category: '$$spec.category',
              icon: '$$spec.icon',
            },
          },
        },
      },
    })

    // Ordenamiento
    pipeline.push({ $sort: { [sortBy]: sortOrder } as Record<string, 1 | -1> })

    // Facet para paginación y conteo en una sola query
    pipeline.push({
      $facet: {
        mentors: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    })

    const [result] = await Mentor.aggregate(pipeline)

    const mentors = result.mentors
    const total = result.totalCount[0]?.count || 0

    res.status(200).json({
      status: 'success',
      data: {
        mentors,
        pagination: createPagination(page, limit, total),
        appliedFilters: {
          query: q || null,
          specialties: specialties || null,
          category: category || null,
          minRating: minRating || null,
          minRate: minRate || null,
          maxRate: maxRate || null,
          languages: languages || null,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Obtener mentores destacados (top rated)
 * GET /api/mentors/featured
 */
export const getFeaturedMentors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = Math.min(
      20,
      Math.max(1, parseInt(req.query.limit as string, 10) || 6)
    )

    const mentors = await Mentor.find({
      isApproved: true,
      isActive: true,
      rating: { $gte: 4 }, // Solo mentores con rating >= 4
      totalSessions: { $gte: 1 }, // Que hayan tenido al menos 1 sesión
    })
      .populate({
        path: 'userId',
        select: 'firstName lastName avatar',
      })
      .populate({
        path: 'specialties',
        select: 'name category icon',
      })
      .sort({ rating: -1, totalSessions: -1 })
      .limit(limit)
      .lean()

    res.status(200).json({
      status: 'success',
      data: {
        mentors,
        total: mentors.length,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/mentors/profile
 * Obtener el perfil del mentor autenticado
 */
export const getMyMentorProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id

    if (req.user?.role !== 'mentor') {
      res.status(403).json({
        status: 'error',
        message: 'Solo los mentores pueden acceder a este recurso',
      })
      return
    }

    let mentor = await Mentor.findOne({ userId })
      .populate('specialties', 'name category icon')
      .populate('userId', 'firstName lastName email avatar')

    if (!mentor) {
      // Crear perfil de mentor vacío si no existe
      mentor = await Mentor.create({
        userId,
        specialties: [],
        languages: [],
        credentials: [],
      })
      mentor = await Mentor.findById(mentor._id)
        .populate('specialties', 'name category icon')
        .populate('userId', 'firstName lastName email avatar')
    }

    res.status(200).json({
      status: 'success',
      data: {
        mentor,
      },
    })
  } catch (error) {
    console.error('Error obteniendo perfil de mentor:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener el perfil del mentor',
    })
  }
}

/**
 * POST /api/mentors/profile
 * Crear o actualizar el perfil del mentor autenticado
 */
export const createOrUpdateMentorProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Errores de validación',
        errors: errors.array(),
      })
      return
    }

    const userId = req.user?._id

    if (req.user?.role !== 'mentor') {
      res.status(403).json({
        status: 'error',
        message: 'Solo los mentores pueden acceder a este recurso',
      })
      return
    }

    const {
      title,
      bio,
      specialties,
      experience,
      yearsOfExperience,
      credentials,
      languages,
      hourlyRate,
      profileStatus,
    } = req.body

    // Validar especialidades (1-5)
    if (specialties && specialties.length > 0) {
      if (specialties.length > 5) {
        res.status(400).json({
          status: 'error',
          message: 'Máximo 5 especialidades permitidas',
        })
        return
      }

      const validSpecialties = await Specialty.find({
        _id: { $in: specialties },
        isActive: true,
      })

      if (validSpecialties.length !== specialties.length) {
        res.status(400).json({
          status: 'error',
          message: 'Una o más especialidades no son válidas',
        })
        return
      }
    }

    // Validar campos obligatorios para publicar
    if (profileStatus === 'published') {
      const missingFields = []
      if (!title || title.trim() === '')
        missingFields.push('título profesional')
      if (!bio || bio.trim() === '') missingFields.push('bio')
      if (!specialties || specialties.length === 0)
        missingFields.push('especialidades')
      if (!hourlyRate || hourlyRate <= 0) missingFields.push('tarifa por hora')

      if (missingFields.length > 0) {
        res.status(400).json({
          status: 'error',
          message: `Para publicar el perfil, complete los siguientes campos: ${missingFields.join(', ')}`,
        })
        return
      }
    }

    // Buscar o crear perfil de mentor
    let mentor = await Mentor.findOne({ userId })

    if (!mentor) {
      mentor = await Mentor.create({
        userId,
        title: title || '',
        bio: bio || '',
        specialties: specialties || [],
        experience: experience || '',
        yearsOfExperience: yearsOfExperience || 0,
        credentials: credentials || [],
        languages: languages || [],
        hourlyRate: hourlyRate || null,
        profileStatus: profileStatus || 'draft',
      })
    } else {
      // Actualizar perfil existente
      if (title !== undefined) mentor.title = title
      if (bio !== undefined) mentor.bio = bio
      if (specialties !== undefined) mentor.specialties = specialties
      if (experience !== undefined) mentor.experience = experience
      if (yearsOfExperience !== undefined)
        mentor.yearsOfExperience = yearsOfExperience
      if (credentials !== undefined) mentor.credentials = credentials
      if (languages !== undefined) mentor.languages = languages
      if (hourlyRate !== undefined) mentor.hourlyRate = hourlyRate
      if (profileStatus !== undefined) mentor.profileStatus = profileStatus

      await mentor.save()
    }

    // Obtener el perfil actualizado con populate
    const updatedMentor = await Mentor.findById(mentor._id)
      .populate('specialties', 'name category icon')
      .populate('userId', 'firstName lastName email avatar')

    res.status(200).json({
      status: 'success',
      message:
        profileStatus === 'published'
          ? 'Perfil publicado correctamente'
          : 'Perfil guardado como borrador',
      data: {
        mentor: updatedMentor,
      },
    })
  } catch (error) {
    console.error('Error guardando perfil de mentor:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error al guardar el perfil del mentor',
    })
  }
}

/**
 * PUT /api/mentors/profile
 * Actualizar el perfil del mentor autenticado (alias de POST para compatibilidad REST)
 */
export const updateMentorProfile = createOrUpdateMentorProfile

/**
 * POST /api/mentors/profile/avatar
 * Subir imagen de avatar del mentor
 */
export const uploadMentorAvatar = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id

    if (req.user?.role !== 'mentor') {
      res.status(403).json({
        status: 'error',
        message: 'Solo los mentores pueden acceder a este recurso',
      })
      return
    }

    if (!req.file) {
      res.status(400).json({
        status: 'error',
        message: 'No se proporcionó ninguna imagen',
      })
      return
    }

    // Obtener el usuario para verificar si tiene avatar previo
    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado',
      })
      return
    }

    // Si tiene avatar previo en Cloudinary, eliminarlo
    if (user.avatar) {
      const publicId = extractPublicId(user.avatar)
      if (publicId) {
        await deleteImage(publicId)
      }
    }

    // Subir nueva imagen
    const result = await uploadImage(req.file.buffer, 'mentors')

    // Actualizar avatar en User
    user.avatar = result.url
    await user.save()

    res.status(200).json({
      status: 'success',
      message: 'Avatar actualizado correctamente',
      data: {
        avatar: result.url,
      },
    })
  } catch (error) {
    console.error('Error subiendo avatar:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error al subir el avatar',
    })
  }
}

/**
 * POST /api/upload/avatar
 * Endpoint genérico para subir avatar (estudiantes y mentores)
 */
export const uploadAvatar = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id
    const role = req.user?.role

    if (!req.file) {
      res.status(400).json({
        status: 'error',
        message: 'No se proporcionó ninguna imagen',
      })
      return
    }

    // Obtener el usuario
    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado',
      })
      return
    }

    // Si tiene avatar previo en Cloudinary, eliminarlo
    if (user.avatar && user.avatar.includes('cloudinary')) {
      const publicId = extractPublicId(user.avatar)
      if (publicId) {
        await deleteImage(publicId)
      }
    }

    // Determinar la carpeta según el rol
    const folder = role === 'mentor' ? 'mentors' : 'students'

    // Subir nueva imagen
    const result = await uploadImage(req.file.buffer, folder)

    // Actualizar avatar en User
    user.avatar = result.url
    await user.save()

    res.status(200).json({
      status: 'success',
      message: 'Avatar actualizado correctamente',
      data: {
        avatar: result.url,
      },
    })
  } catch (error) {
    console.error('Error subiendo avatar:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error al subir el avatar',
    })
  }
}
