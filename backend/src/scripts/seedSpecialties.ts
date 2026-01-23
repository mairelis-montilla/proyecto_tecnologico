import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Specialty } from '../models/Specialty.model.js'

dotenv.config()

const specialtiesData = [
  // Tecnología
  {
    name: 'Desarrollo Web Frontend',
    category: 'Tecnología',
    description: 'React, Vue, Angular, HTML, CSS, JavaScript',
    icon: 'code',
  },
  {
    name: 'Desarrollo Web Backend',
    category: 'Tecnología',
    description: 'Node.js, Python, Java, PHP, APIs REST',
    icon: 'server',
  },
  {
    name: 'Desarrollo Móvil',
    category: 'Tecnología',
    description: 'React Native, Flutter, Swift, Kotlin',
    icon: 'smartphone',
  },
  {
    name: 'DevOps',
    category: 'Tecnología',
    description: 'Docker, Kubernetes, CI/CD, AWS, Azure',
    icon: 'cloud',
  },
  {
    name: 'Base de Datos',
    category: 'Tecnología',
    description: 'SQL, MongoDB, PostgreSQL, Redis',
    icon: 'database',
  },
  {
    name: 'Inteligencia Artificial',
    category: 'Tecnología',
    description: 'Machine Learning, Deep Learning, NLP',
    icon: 'brain',
  },
  {
    name: 'Ciberseguridad',
    category: 'Tecnología',
    description: 'Ethical Hacking, Seguridad de Redes, Pentesting',
    icon: 'shield',
  },

  // Negocios
  {
    name: 'Marketing Digital',
    category: 'Negocios',
    description: 'SEO, SEM, Redes Sociales, Email Marketing',
    icon: 'trending-up',
  },
  {
    name: 'Gestión de Proyectos',
    category: 'Negocios',
    description: 'Scrum, Agile, PMP, Kanban',
    icon: 'clipboard',
  },
  {
    name: 'Emprendimiento',
    category: 'Negocios',
    description: 'Startups, Modelo de Negocios, Pitch',
    icon: 'rocket',
  },
  {
    name: 'Finanzas',
    category: 'Negocios',
    description: 'Contabilidad, Inversiones, Finanzas Personales',
    icon: 'dollar-sign',
  },
  {
    name: 'Recursos Humanos',
    category: 'Negocios',
    description: 'Reclutamiento, Cultura Organizacional, Liderazgo',
    icon: 'users',
  },

  // Diseño
  {
    name: 'Diseño UX/UI',
    category: 'Diseño',
    description: 'Figma, Adobe XD, Prototipado, User Research',
    icon: 'layout',
  },
  {
    name: 'Diseño Gráfico',
    category: 'Diseño',
    description: 'Photoshop, Illustrator, Branding',
    icon: 'image',
  },
  {
    name: 'Diseño 3D',
    category: 'Diseño',
    description: 'Blender, Maya, Cinema 4D',
    icon: 'box',
  },

  // Desarrollo Personal
  {
    name: 'Productividad',
    category: 'Desarrollo Personal',
    description: 'Gestión del Tiempo, Hábitos, GTD',
    icon: 'clock',
  },
  {
    name: 'Comunicación',
    category: 'Desarrollo Personal',
    description: 'Presentaciones, Oratoria, Negociación',
    icon: 'message-circle',
  },
  {
    name: 'Liderazgo',
    category: 'Desarrollo Personal',
    description: 'Gestión de Equipos, Coaching, Mentoring',
    icon: 'award',
  },

  // Idiomas
  {
    name: 'Inglés',
    category: 'Idiomas',
    description: 'Conversación, Gramática, Business English',
    icon: 'globe',
  },
  {
    name: 'Español',
    category: 'Idiomas',
    description: 'Español para extranjeros, Escritura',
    icon: 'globe',
  },

  // Ciencias
  {
    name: 'Matemáticas',
    category: 'Ciencias',
    description: 'Álgebra, Cálculo, Estadística',
    icon: 'percent',
  },
  {
    name: 'Física',
    category: 'Ciencias',
    description: 'Mecánica, Termodinámica, Electromagnetismo',
    icon: 'zap',
  },
  {
    name: 'Ciencia de Datos',
    category: 'Ciencias',
    description: 'Análisis de Datos, Visualización, Python',
    icon: 'bar-chart',
  },
]

async function seedSpecialties() {
  try {
    const mongoUri = process.env.MONGODB_URI

    if (!mongoUri) {
      throw new Error(
        'MONGODB_URI no está definida en las variables de entorno'
      )
    }

    await mongoose.connect(mongoUri)
    console.log('Conectado a MongoDB')

    // Insertar solo las que no existen
    let created = 0
    let skipped = 0

    for (const data of specialtiesData) {
      const exists = await Specialty.findOne({
        name: new RegExp(`^${data.name}$`, 'i'),
      })

      if (!exists) {
        await Specialty.create({
          ...data,
          isActive: true,
        })
        created++
        console.log(`  + Creada: ${data.name}`)
      } else {
        skipped++
      }
    }

    console.log(`\nResumen:`)
    console.log(`  - Especialidades creadas: ${created}`)
    console.log(`  - Especialidades existentes (omitidas): ${skipped}`)

    // Mostrar resumen por categoría
    const categories = [...new Set(specialtiesData.map(s => s.category))]
    console.log('\nEspecialidades por categoría en la BD:')
    for (const category of categories) {
      const count = await Specialty.countDocuments({ category, isActive: true })
      console.log(`  - ${category}: ${count}`)
    }

    await mongoose.disconnect()
    console.log('\nDesconectado de MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('Error al crear especialidades:', error)
    process.exit(1)
  }
}

seedSpecialties()
