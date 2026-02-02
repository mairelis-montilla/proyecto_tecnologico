import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import { User } from '../models/User.model.js'
import { Mentor } from '../models/Mentor.model.js'
import { Specialty } from '../models/Specialty.model.js'
import { Availability } from '../models/Availability.model.js'

dotenv.config()

const mentorsData = [
  {
    user: {
      email: 'ana.garcia@mentormatch.com',
      password: 'Mentor123!',
      firstName: 'Ana',
      lastName: 'García',
      role: 'mentor',
    },
    mentor: {
      bio: 'Experta en desarrollo web con React y Node.js. Apasionada por enseñar buenas prácticas de código y arquitectura de software. Más de 8 años de experiencia en empresas tech.',
      experience:
        '8 años de experiencia como Senior Software Engineer en empresas como Google y Mercado Libre.',
      credentials: [
        'AWS Certified Developer',
        'Meta React Developer Certificate',
      ],
      hourlyRate: 45,
      languages: ['español', 'inglés'],
      rating: 4.9,
      totalReviews: 127,
      totalSessions: 89,
      specialtyNames: ['Desarrollo Web Frontend', 'Desarrollo Web Backend'],
    },
  },
  {
    user: {
      email: 'carlos.mendoza@mentormatch.com',
      password: 'Mentor123!',
      firstName: 'Carlos',
      lastName: 'Mendoza',
      role: 'mentor',
    },
    mentor: {
      bio: 'Especialista en Machine Learning y análisis de datos. Mentor con 5 años de experiencia ayudando a profesionales a entrar al mundo de la ciencia de datos.',
      experience:
        'Data Scientist en Spotify y anteriormente en IBM. PhD en Ciencias de la Computación.',
      credentials: [
        'Google Data Analytics Certificate',
        'IBM Data Science Professional',
      ],
      hourlyRate: 60,
      languages: ['español', 'inglés', 'portugués'],
      rating: 4.8,
      totalReviews: 89,
      totalSessions: 156,
      specialtyNames: ['Inteligencia Artificial', 'Ciencia de Datos'],
    },
  },
  {
    user: {
      email: 'maria.lopez@mentormatch.com',
      password: 'Mentor123!',
      firstName: 'María',
      lastName: 'López',
      role: 'mentor',
    },
    mentor: {
      bio: 'Diseñadora UX/UI con más de 10 años de experiencia en productos digitales. He trabajado en startups y grandes empresas diseñando experiencias que impactan millones de usuarios.',
      experience: 'Lead Designer en Airbnb. Anteriormente en Facebook y Uber.',
      credentials: [
        'Google UX Design Certificate',
        'Interaction Design Foundation',
      ],
      hourlyRate: 55,
      languages: ['español', 'inglés'],
      rating: 5.0,
      totalReviews: 156,
      totalSessions: 203,
      specialtyNames: ['Diseño UX/UI', 'Diseño Gráfico'],
    },
  },
  {
    user: {
      email: 'david.torres@mentormatch.com',
      password: 'Mentor123!',
      firstName: 'David',
      lastName: 'Torres',
      role: 'mentor',
    },
    mentor: {
      bio: 'Experto en infraestructura cloud, CI/CD y automatización. AWS Certified Solutions Architect con experiencia liderando equipos de DevOps en empresas Fortune 500.',
      experience:
        'Principal DevOps Engineer en Amazon. 12 años de experiencia en infraestructura.',
      credentials: [
        'AWS Solutions Architect Professional',
        'Kubernetes Administrator (CKA)',
        'HashiCorp Terraform Associate',
      ],
      hourlyRate: 70,
      languages: ['español', 'inglés'],
      rating: 4.7,
      totalReviews: 64,
      totalSessions: 78,
      specialtyNames: ['DevOps', 'Base de Datos'],
    },
  },
]

async function seedMentors() {
  try {
    const mongoUri = process.env.MONGODB_URI

    if (!mongoUri) {
      throw new Error(
        'MONGODB_URI no está definida en las variables de entorno'
      )
    }

    await mongoose.connect(mongoUri)
    console.log('Conectado a MongoDB')

    // Obtener todas las especialidades
    const allSpecialties = await Specialty.find({ isActive: true })
    console.log(`Encontradas ${allSpecialties.length} especialidades`)

    if (allSpecialties.length === 0) {
      console.error(
        'No hay especialidades en la base de datos. Ejecuta primero: npm run seed:specialties'
      )
      process.exit(1)
    }

    let created = 0
    let skipped = 0

    for (const data of mentorsData) {
      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ email: data.user.email })

      if (existingUser) {
        console.log(`  - Usuario ${data.user.email} ya existe, omitiendo...`)
        skipped++
        continue
      }

      // Crear usuario
      const hashedPassword = await bcrypt.hash(data.user.password, 10)
      const user = await User.create({
        ...data.user,
        password: hashedPassword,
        isActive: true,
        isEmailVerified: true,
      })

      // Buscar especialidades por nombre
      const specialtyIds = data.mentor.specialtyNames
        .map(name => {
          const specialty = allSpecialties.find(
            s => s.name.toLowerCase() === name.toLowerCase()
          )
          return specialty?._id
        })
        .filter(Boolean)

      // Crear perfil de mentor
      const mentor = await Mentor.create({
        userId: user._id,
        bio: data.mentor.bio,
        experience: data.mentor.experience,
        credentials: data.mentor.credentials,
        specialties: specialtyIds,
        hourlyRate: data.mentor.hourlyRate,
        languages: data.mentor.languages,
        rating: data.mentor.rating,
        totalReviews: data.mentor.totalReviews,
        totalSessions: data.mentor.totalSessions,
        isApproved: true,
        isActive: true,
        timezone: 'America/Lima' // Default timezone
      })

      // Add availability patterns (covers next 20+ days with weekly recurrence)
      // Different patterns per mentor for variety
      const availabilitySlots: Array<{
        mentorId: typeof mentor._id
        dayOfWeek: number
        startTime: string
        endTime: string
        duration: number
        isActive: boolean
      }> = []

      const mentorIndex = mentorsData.indexOf(data)

      // Availability patterns by mentor (more slots = more availability)
      const patterns = [
        // Ana: Lun-Vie, mañana y tarde (30 slots/semana)
        {
          days: [1, 2, 3, 4, 5],
          hours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
        },
        // Carlos: Lun, Mie, Vie, Sab - horarios variados (24 slots/semana)
        {
          days: [1, 3, 5, 6],
          hours: ['10:00', '11:00', '12:00', '17:00', '18:00', '19:00'],
        },
        // Maria: Lun-Sab mañanas (30 slots/semana)
        {
          days: [1, 2, 3, 4, 5, 6],
          hours: ['08:00', '09:00', '10:00', '11:00', '12:00'],
        },
        // David: Lun-Sab tardes (24 slots/semana)
        {
          days: [1, 2, 3, 4, 5, 6],
          hours: ['14:00', '15:00', '16:00', '17:00'],
        },
      ]

      const pattern = patterns[mentorIndex % patterns.length]

      for (const day of pattern.days) {
        for (const hour of pattern.hours) {
          const [h, m] = hour.split(':').map(Number)
          const endHour = h + 1
          const endTime = `${endHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`

          availabilitySlots.push({
            mentorId: mentor._id,
            dayOfWeek: day,
            startTime: hour,
            endTime: endTime,
            duration: 60,
            isActive: true,
          })
        }
      }

      await Availability.insertMany(availabilitySlots)
      console.log(`    -> ${availabilitySlots.length} slots de disponibilidad creados`)

      console.log(
        `  + Creado mentor con disponibilidad: ${data.user.firstName} ${data.user.lastName} (${data.user.email})`
      )
      created++
    }

    console.log(`\nResumen:`)
    console.log(`  - Mentores creados: ${created}`)
    console.log(`  - Mentores existentes (omitidos): ${skipped}`)

    if (created > 0) {
      console.log(`\nCredenciales de los mentores creados:`)
      console.log(`  Contraseña para todos: Mentor123!`)
      console.log(`\n  Emails:`)
      mentorsData.forEach(m => {
        console.log(`    - ${m.user.email}`)
      })
    }

    await mongoose.disconnect()
    console.log('\nDesconectado de MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('Error al crear mentores:', error)
    process.exit(1)
  }
}


seedMentors()
