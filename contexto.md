# Contexto del Proyecto - Sistema de Reserva de Mentorías

## Descripción General

Sistema web para gestionar reservas de mentorías entre estudiantes y especialistas en diferentes áreas del conocimiento. La plataforma facilita la conexión entre estudiantes que buscan orientación académica y profesional con mentores expertos en diversas disciplinas.

## Objetivo del Proyecto

Crear una plataforma que permita a estudiantes:
- Buscar y explorar mentores especializados en diferentes áreas
- Visualizar perfiles de mentores con su experiencia y especialización
- Reservar sesiones de mentoría según disponibilidad
- Gestionar sus reservas activas y historial

Y a los mentores:
- Publicar su perfil con especialización y experiencia
- Definir su disponibilidad horaria
- Gestionar solicitudes de mentoría
- Mantener historial de sesiones realizadas

## Funcionalidades Principales

### Para Estudiantes
1. **Registro y Autenticación**
   - Registro con email y contraseña
   - Login/logout
   - Perfil de estudiante

2. **Búsqueda de Mentores**
   - Buscar por área de especialización
   - Filtrar por disponibilidad
   - Ver perfiles detallados de mentores

3. **Reservas**
   - Seleccionar fecha y hora disponible
   - Crear nueva reserva
   - Ver reservas pendientes, confirmadas y completadas
   - Cancelar reservas

4. **Historial**
   - Ver mentorías pasadas
   - Dejar comentarios/valoraciones

### Para Mentores
1. **Perfil de Mentor**
   - Información personal y profesional
   - Áreas de especialización
   - Experiencia y credenciales
   - Foto de perfil

2. **Gestión de Disponibilidad**
   - Configurar horarios disponibles
   - Bloquear fechas no disponibles
   - Definir duración de sesiones

3. **Gestión de Reservas**
   - Ver solicitudes pendientes
   - Confirmar o rechazar solicitudes
   - Ver calendario de mentorías
   - Historial de mentorías realizadas

### Para Administradores
1. **Gestión de Usuarios**
   - Aprobar cuentas de mentores
   - Gestionar usuarios
   - Ver estadísticas

2. **Gestión de Especialidades**
   - Crear y editar áreas de especialización
   - Categorizar mentores

## Arquitectura del Sistema

### Frontend (React + TypeScript + Vite)
- **Framework**: React 18 con TypeScript
- **Build Tool**: Vite
- **Estilos**: Tailwind CSS
- **Routing**: React Router DOM
- **Estado Global**: Context API / Zustand
- **HTTP Client**: Axios
- **Formularios**: React Hook Form
- **Validaciones**: Zod / Yup

### Backend (Node.js + Express + TypeScript)
- **Runtime**: Node.js
- **Framework**: Express
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: Express Validator
- **Seguridad**: Helmet, CORS
- **Variables de Entorno**: dotenv

### Base de Datos (MongoDB)

#### Colecciones Principales

**users**
- Usuarios del sistema (estudiantes y mentores)
- Información de autenticación
- Rol (student, mentor, admin)

**mentors**
- Perfiles de mentores
- Especialidades
- Experiencia y credenciales
- Referencia a user

**specialties**
- Áreas de conocimiento
- Categorías de especialización

**availabilities**
- Horarios disponibles de mentores
- Bloques de tiempo

**bookings**
- Reservas de mentorías
- Estado (pending, confirmed, completed, cancelled)
- Relación estudiante-mentor

**reviews**
- Valoraciones y comentarios
- Calificación de mentorías

## Flujo de Usuarios

### Flujo de Estudiante
1. Registro/Login
2. Búsqueda de mentores por especialidad
3. Selección de mentor
4. Visualización de disponibilidad
5. Creación de reserva
6. Confirmación de reserva
7. Asistencia a mentoría
8. Valoración post-mentoría

### Flujo de Mentor
1. Registro/Login
2. Completar perfil de mentor
3. Configurar especialidades
4. Definir disponibilidad
5. Recibir solicitudes de mentoría
6. Confirmar/rechazar solicitudes
7. Realizar mentoría
8. Ver historial y estadísticas

## Modelo de Datos

### User
```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  firstName: string,
  lastName: string,
  role: 'student' | 'mentor' | 'admin',
  avatar?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Mentor
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  bio: string,
  specialties: ObjectId[] (ref: Specialty),
  experience: string,
  credentials: string[],
  rating: number,
  totalSessions: number,
  hourlyRate?: number,
  isApproved: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Specialty
```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  category: string,
  icon?: string,
  createdAt: Date
}
```

### Availability
```typescript
{
  _id: ObjectId,
  mentorId: ObjectId (ref: Mentor),
  dayOfWeek: number (0-6),
  startTime: string,
  endTime: string,
  duration: number (minutes),
  isActive: boolean
}
```

### Booking
```typescript
{
  _id: ObjectId,
  studentId: ObjectId (ref: User),
  mentorId: ObjectId (ref: Mentor),
  specialty: ObjectId (ref: Specialty),
  scheduledDate: Date,
  startTime: string,
  endTime: string,
  duration: number,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  meetingLink?: string,
  notes?: string,
  cancellationReason?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Review
```typescript
{
  _id: ObjectId,
  bookingId: ObjectId (ref: Booking),
  studentId: ObjectId (ref: User),
  mentorId: ObjectId (ref: Mentor),
  rating: number (1-5),
  comment: string,
  createdAt: Date
}
```

## Características Técnicas

### Seguridad
- Contraseñas hasheadas con bcrypt
- Autenticación basada en JWT
- Protección CORS
- Validación de datos en backend
- Rate limiting para prevenir ataques

### Performance
- Paginación en listados
- Índices en MongoDB para búsquedas rápidas
- Caching de datos frecuentes
- Lazy loading en frontend
- Optimización de imágenes

### UX/UI
- Diseño responsive (mobile-first)
- Interfaz intuitiva y moderna
- Feedback visual en acciones
- Loading states
- Manejo de errores amigable

## Product Backlog y Sprints

### Épicas del Proyecto
1. **Gestión de Usuarios y Autenticación** (Verde)
2. **Perfiles y Marketplace** (Amarillo)
3. **Sistema de Reservas** (Naranja)
4. **Notificaciones** (Rojo)
5. **Pagos y Transacciones** (Morado)
6. **Valoraciones y Reseñas** (Azul)

### Sprint 1 - Autenticación y Setup
| ID | Historia de Usuario | Puntos |
|---|---|---|
| PTG3-0 | Setup entornos | - |
| PTG3-1 | Crear Mockups visuales y paleta de colores | - |
| PTG3-2 | Registro de Usuario Estudiante | 5 |
| PTG3-3 | Registro de Usuario Mentor | 5 |
| PTG3-4 | Inicio Sesión | 3 |
| PTG3-5 | Cerrar sesión (logout) | 2 |
| PTG3-6 | Crear Perfil de Mentor | 8 |
| PTG3-7 | Editar Perfil de Mentor | 3 |

### Sprint 2 - Marketplace y Búsqueda
| ID | Historia de Usuario | Puntos |
|---|---|---|
| PTG3-8 | Ver Marketplace de Mentores | 5 |
| PTG3-9 | Buscar Mentores por Categorías | 5 |
| PTG3-10 | Buscar Mentores por Nombre/Palabra Clave | 3 |
| PTG3-11 | Ver Perfil Completo de Mentor | 5 |
| PTG3-12 | Completar Perfil de Estudiante | 3 |

### Sprint 3 - Sistema de Reservas
| ID | Historia de Usuario | Puntos |
|---|---|---|
| PTG3-13 | Definir Disponibilidad como Mentor | 8 |
| PTG3-14 | Ver Disponibilidad de Mentor | 5 |
| PTG3-15 | Reservar Sesión | 8 |
| PTG3-16 | Ver Mis Reservas (Estudiante) | 5 |
| PTG3-17 | Ver Solicitudes de Sesión (Mentor) | 5 |
| PTG3-18 | Aprobar Sesión (Mentor) | 3 |
| PTG3-19 | Rechazar Sesión (Mentor) | 3 |
| PTG3-20 | Cancelar Sesión (Estudiante) | 5 |

### Backlog Futuro
| ID | Historia de Usuario | Puntos |
|---|---|---|
| PTG3-21 | Recuperar Contraseña | 5 |
| PTG3-22 | Notificación Nueva Reserva (Mentor) | 3 |
| PTG3-23 | Notificación Confirmación (Estudiante) | 2 |
| PTG3-24 | Procesar Pago de Sesión | 13 |
| PTG3-25 | Procesar Reembolso | 8 |
| PTG3-26 | Calificar Mentor | 5 |
| PTG3-27 | Ver Reseñas de Mentor | 3 |
| PTG3-28 | Ver Ingresos (Mentor) | 5 |
| PTG3-29 | Ver Historial Pagos | 3 |
| PTG3-30 | Recordatorio Sesión | 5 |

### Equipo de Desarrollo
- **Product Owner**: Mairelis Montilla
- **Scrum Master**: Hugo Mostajo
- **Desarrolladores Frontend**: Markin Pulache
- **Desarrolladores Backend**: Orestes Chiabra
- **QA**: Allison Chuica

### Tablero Trello
URL: https://trello.com/b/0HwNdej9/product-backlog-sprints

---

## Roadmap

### Fase 1: MVP (Minimum Viable Product) - Sprint 1
- [ ] Sistema de autenticación (registro, login, logout)
- [ ] Perfiles de mentores (crear, editar)
- [ ] Setup de entornos y configuración inicial

### Fase 2: Funcionalidades Core - Sprint 2
- [ ] Marketplace de mentores
- [ ] Sistema de búsqueda y filtros
- [ ] Perfiles completos de mentores
- [ ] Perfil de estudiante

### Fase 3: Sistema de Reservas - Sprint 3
- [ ] Gestión de disponibilidad por mentores
- [ ] Sistema de reservas
- [ ] Aprobación/rechazo de sesiones
- [ ] Cancelación de sesiones

### Fase 4: Mejoras y Optimización (Futuro)
- [ ] Notificaciones (email)
- [ ] Sistema de pagos
- [ ] Sistema de valoraciones y reseñas
- [ ] Reportes y estadísticas

## Consideraciones Adicionales

### Escalabilidad
- Arquitectura modular para fácil extensión
- Separación de concerns (controladores, servicios, modelos)
- Código reutilizable y mantenible

### Mantenibilidad
- Documentación de código
- Testing (unitarios e integración)
- Versionado con Git
- Code reviews

### Compliance
- GDPR compliance (protección de datos)
- Términos y condiciones
- Política de privacidad
- Consentimiento de usuarios

## Stack Tecnológico Completo

**Frontend**
```
React 18 + TypeScript + Vite
Tailwind CSS
React Router DOM
Axios
React Hook Form
Zustand / Context API
```

**Backend**
```
Node.js + Express + TypeScript
MongoDB + Mongoose
JWT + bcrypt
Express Validator
```

**DevOps**
```
Git + GitHub
ESLint + Prettier
Docker (opcional)
```

## Variables de Entorno Necesarias

### Frontend (.env)
```
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=MentorMatch
```

### Backend (.env)
```
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/mentordb
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

## Próximos Pasos Inmediatos

1. Configurar conexión a MongoDB
2. Implementar modelos de Mongoose
3. Crear sistema de autenticación con JWT
4. Desarrollar endpoints de API
5. Crear componentes de UI en React
6. Implementar sistema de rutas
7. Conectar frontend con backend

---

**Versión**: 1.0
**Última actualización**: 2026-01-14
**Equipo**: Desarrollo Full Stack
