import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware.js'
import { Student } from '../models/Student.model.js'
import { User } from '../models/User.model.js'
import { Specialty } from '../models/Specialty.model.js'
import {
  uploadImage,
  deleteImage,
  extractPublicId,
} from '../services/cloudinary.service.js'

// GET /api/students/profile - Obtener perfil del estudiante actual
export const getMyProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id

    // Buscar o crear perfil de estudiante
    let student = await Student.findOne({ userId })
      .populate('interests', 'name category icon')
      .populate('userId', 'firstName lastName email avatar')

    if (!student) {
      // Crear perfil de estudiante si no existe
      student = await Student.create({ userId, interests: [] })
      student = await Student.findById(student._id)
        .populate('interests', 'name category icon')
        .populate('userId', 'firstName lastName email avatar')
    }

    res.status(200).json({
      status: 'success',
      data: {
        student,
      },
    })
  } catch (error) {
    console.error('Error obteniendo perfil de estudiante:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener el perfil del estudiante',
    })
  }
}

// PUT /api/students/profile - Actualizar perfil del estudiante
export const updateMyProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id
    const { bio, institution, career, semester, interests, avatar } = req.body

    // Validar que los intereses existan
    if (interests && interests.length > 0) {
      const validInterests = await Specialty.find({
        _id: { $in: interests },
        isActive: true,
      })

      if (validInterests.length !== interests.length) {
        res.status(400).json({
          status: 'error',
          message: 'Uno o más intereses no son válidos',
        })
        return
      }
    }

    // Buscar o crear perfil de estudiante
    let student = await Student.findOne({ userId })

    if (!student) {
      student = await Student.create({
        userId,
        bio,
        institution,
        career,
        semester,
        interests: interests || [],
      })
    } else {
      // Actualizar perfil existente
      if (bio !== undefined) student.bio = bio
      if (institution !== undefined) student.institution = institution
      if (career !== undefined) student.career = career
      if (semester !== undefined) student.semester = semester
      if (interests !== undefined) student.interests = interests

      await student.save()
    }

    // Actualizar avatar en User si se proporciona
    // Por ahora solo guardamos la URL, el upload a Cloudinary lo maneja otro servicio
    if (avatar !== undefined) {
      await User.findByIdAndUpdate(userId, { avatar })
    }

    // Obtener el perfil actualizado con populate
    const updatedStudent = await Student.findById(student._id)
      .populate('interests', 'name category icon')
      .populate('userId', 'firstName lastName email avatar')

    res.status(200).json({
      status: 'success',
      message: 'Perfil actualizado correctamente',
      data: {
        student: updatedStudent,
      },
    })
  } catch (error) {
    console.error('Error actualizando perfil de estudiante:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error al actualizar el perfil del estudiante',
    })
  }
}

// GET /api/students/interests - Obtener lista de intereses disponibles
export const getAvailableInterests = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const interests = await Specialty.find({ isActive: true })
      .select('name category icon')
      .sort({ category: 1, name: 1 })

    // Agrupar por categoría
    const groupedInterests = interests.reduce(
      (acc, interest) => {
        const category = interest.category
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push({
          _id: interest._id.toString(),
          name: interest.name,
          icon: interest.icon,
        })
        return acc
      },
      {} as Record<string, Array<{ _id: string; name: string; icon?: string }>>
    )

    res.status(200).json({
      status: 'success',
      data: {
        interests: groupedInterests,
        total: interests.length,
      },
    })
  } catch (error) {
    console.error('Error obteniendo intereses:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener los intereses disponibles',
    })
  }
}

// POST /api/students/profile/avatar - Subir avatar del estudiante
export const uploadStudentAvatar = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id

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

    // Subir nueva imagen
    const result = await uploadImage(req.file.buffer, 'students')

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
    console.error('Error subiendo avatar de estudiante:', error)
    res.status(500).json({
      status: 'error',
      message: 'Error al subir el avatar',
    })
  }
}
