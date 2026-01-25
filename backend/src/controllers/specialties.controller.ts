import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { Specialty } from '../models/Specialty.model.js'
import { Mentor } from '../models/Mentor.model.js'

/**
 * Listar todas las especialidades activas
 * GET /api/specialties
 */
export const getSpecialties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, includeCount } = req.query

    const filter: Record<string, unknown> = { isActive: true }

    if (category) {
      filter.category = new RegExp(category as string, 'i')
    }

    const specialties = await Specialty.find(filter)
      .sort({ category: 1, name: 1 })
      .lean()

    // Si se solicita, incluir conteo de mentores por especialidad
    if (includeCount === 'true') {
      const specialtiesWithCount = await Promise.all(
        specialties.map(async specialty => {
          const mentorCount = await Mentor.countDocuments({
            specialties: specialty._id,
            isApproved: true,
            isActive: true,
          })
          return {
            ...specialty,
            mentorCount,
          }
        })
      )

      res.status(200).json({
        status: 'success',
        data: { specialties: specialtiesWithCount },
      })
      return
    }

    res.status(200).json({
      status: 'success',
      data: { specialties },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Obtener especialidad por ID
 * GET /api/specialties/:id
 */
export const getSpecialtyById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params

    const specialty = await Specialty.findOne({
      _id: id,
      isActive: true,
    }).lean()

    if (!specialty) {
      res.status(404).json({
        status: 'error',
        message: 'Especialidad no encontrada',
      })
      return
    }

    // Contar mentores con esta especialidad
    const mentorCount = await Mentor.countDocuments({
      specialties: id,
      isApproved: true,
      isActive: true,
    })

    res.status(200).json({
      status: 'success',
      data: {
        specialty: {
          ...specialty,
          mentorCount,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Listar categorías únicas
 * GET /api/specialties/categories
 */
export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await Specialty.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          specialties: {
            $push: {
              _id: '$_id',
              name: '$name',
              icon: '$icon',
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1,
          specialties: 1,
        },
      },
    ])

    res.status(200).json({
      status: 'success',
      data: { categories },
    })
  } catch (error) {
    next(error)
  }
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * Listar todas las especialidades (incluye inactivas) - ADMIN
 * GET /api/admin/specialties
 */
export const getAllSpecialties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, isActive } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const filter: Record<string, unknown> = {}

    if (search) {
      filter.$or = [
        { name: new RegExp(search as string, 'i') },
        { category: new RegExp(search as string, 'i') },
      ]
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true'
    }

    const specialties = await Specialty.find(filter)
      .sort({ category: 1, name: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    const total = await Specialty.countDocuments(filter)

    // Agregar conteo de mentores a cada especialidad
    const specialtiesWithCount = await Promise.all(
      specialties.map(async specialty => {
        const mentorCount = await Mentor.countDocuments({
          specialties: specialty._id,
        })
        return {
          ...specialty,
          mentorCount,
        }
      })
    )

    res.status(200).json({
      status: 'success',
      data: {
        specialties: specialtiesWithCount,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Crear especialidad - ADMIN
 * POST /api/admin/specialties
 */
export const createSpecialty = async (
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

    const { name, category, description, icon } = req.body

    // Verificar si ya existe una especialidad con el mismo nombre
    const existingSpecialty = await Specialty.findOne({
      name: new RegExp(`^${name}$`, 'i'),
    })

    if (existingSpecialty) {
      res.status(400).json({
        status: 'error',
        message: 'Ya existe una especialidad con ese nombre',
      })
      return
    }

    const specialty = new Specialty({
      name,
      category,
      description,
      icon,
      isActive: true,
    })

    await specialty.save()

    res.status(201).json({
      status: 'success',
      message: 'Especialidad creada exitosamente',
      data: { specialty },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Actualizar especialidad - ADMIN
 * PUT /api/admin/specialties/:id
 */
export const updateSpecialty = async (
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

    const { id } = req.params
    const { name, category, description, icon, isActive } = req.body

    const specialty = await Specialty.findById(id)

    if (!specialty) {
      res.status(404).json({
        status: 'error',
        message: 'Especialidad no encontrada',
      })
      return
    }

    // Verificar nombre duplicado si se está cambiando
    if (name && name !== specialty.name) {
      const existingSpecialty = await Specialty.findOne({
        name: new RegExp(`^${name}$`, 'i'),
        _id: { $ne: id },
      })

      if (existingSpecialty) {
        res.status(400).json({
          status: 'error',
          message: 'Ya existe una especialidad con ese nombre',
        })
        return
      }
    }

    // Actualizar campos
    if (name !== undefined) specialty.name = name
    if (category !== undefined) specialty.category = category
    if (description !== undefined) specialty.description = description
    if (icon !== undefined) specialty.icon = icon
    if (isActive !== undefined) specialty.isActive = isActive

    await specialty.save()

    res.status(200).json({
      status: 'success',
      message: 'Especialidad actualizada exitosamente',
      data: { specialty },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Eliminar especialidad (soft delete) - ADMIN
 * DELETE /api/admin/specialties/:id
 */
export const deleteSpecialty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params

    const specialty = await Specialty.findById(id)

    if (!specialty) {
      res.status(404).json({
        status: 'error',
        message: 'Especialidad no encontrada',
      })
      return
    }

    // Verificar si hay mentores usando esta especialidad
    const mentorCount = await Mentor.countDocuments({
      specialties: id,
    })

    if (mentorCount > 0) {
      // Soft delete - solo desactivar
      specialty.isActive = false
      await specialty.save()

      res.status(200).json({
        status: 'success',
        message: `Especialidad desactivada. ${mentorCount} mentor(es) la tienen asignada.`,
        data: { specialty },
      })
      return
    }

    // Hard delete si no hay mentores usando la especialidad
    await Specialty.findByIdAndDelete(id)

    res.status(200).json({
      status: 'success',
      message: 'Especialidad eliminada exitosamente',
    })
  } catch (error) {
    next(error)
  }
}
