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
1. **Dashboard**
   - Métricas clave de la plataforma
   - Gráficos de sesiones e ingresos
   - Accesos rápidos a secciones

2. **Gestión de Usuarios**
   - Ver, editar y buscar usuarios
   - Bloquear/desbloquear usuarios
   - Cambiar roles

3. **Aprobación de Mentores**
   - Revisar solicitudes pendientes
   - Aprobar o rechazar mentores
   - Ver perfil completo antes de aprobar

4. **Validación de Pagos**
   - Ver comprobantes de pago subidos
   - Aprobar o rechazar pagos
   - Comparar monto pagado vs esperado

5. **Gestión de Especialidades**
   - CRUD de áreas de especialización
   - Categorizar especialidades

6. **Reportes y Estadísticas**
   - Reportes de usuarios, sesiones e ingresos
   - Exportar datos a CSV

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

### Payment
```typescript
{
  _id: ObjectId,
  bookingId: ObjectId (ref: Booking),
  studentId: ObjectId (ref: User),
  mentorId: ObjectId (ref: Mentor),
  amount: number,
  expectedAmount: number,
  method: 'transfer' | 'yape' | 'plin' | 'other',
  proofImage: string (URL),
  status: 'pending' | 'approved' | 'rejected',
  rejectionReason?: string,
  validatedBy?: ObjectId (ref: User - Admin),
  validatedAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### BlockHistory
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  action: 'block' | 'unblock',
  reason: string,
  adminId: ObjectId (ref: User),
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
7. **Panel de Administración** (Gris)

### Sprint 1 - Autenticación, Marketplace y Perfiles
| ID | Historia de Usuario | Puntos |
|---|---|---|
| PTG3-1 | Setup entornos | 2 |
| PTG3-2 | Registro de Usuario Estudiante | 5 |
| PTG3-3 | Registro de Usuario Mentor | 5 |
| PTG3-4 | Inicio Sesión | 3 |
| PTG3-5 | Cerrar sesión (logout) | 2 |
| PTG3-7 | Editar Perfil de Mentor | 3 |
| PTG3-8 | Ver Marketplace de Mentores | 5 |
| PTG3-9 | Buscar Mentores por Categorías | 5 |
| PTG3-10 | Buscar Mentores por Nombre/Palabra Clave | 3 |
| PTG3-11 | Ver Perfil Completo de Mentor | 5 |
| PTG3-12 | Completar Perfil de Estudiante | 3 |
| **Total** | | **47 pts** | |

### Sprint 2 - Sistema de Reservas, Pagos y Admin Core
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
| PTG3-24 | Subir Comprobante de Pago (Estudiante) | 5 |
| PTG3-33 | Aprobar Mentores (Admin) | 5 |
| PTG3-35 | Validar Comprobantes de Pago (Admin) | 8 |
| PTG3-38 | Agregar validación de correo por código | 5 |
| PTG3-39 | Agregar algoritmo de mostrar por preferencias | 5 |
| **Total** | | **70 pts** |

### Sprint 3 - Panel Admin, Valoraciones e Historial
| ID | Historia de Usuario | Puntos |
|---|---|---|
| PTG3-25 | Ver Estado de Mis Pagos (Estudiante) | 3 |
| PTG3-26 | Calificar Mentor | 5 |
| PTG3-27 | Ver Reseñas de Mentor | 3 |
| PTG3-28 | Ver Ingresos (Mentor) | 5 |
| PTG3-29 | Ver Historial de Pagos (Estudiante) | 3 |
| PTG3-21 | Dashboard de Administrador | 5 |
| PTG3-32 | Gestión de Usuarios (Admin) | 8 |
| PTG3-34 | Bloquear/Desbloquear Usuarios (Admin) | 3 |
| PTG3-36 | Historial de Transacciones (Admin) | 5 |
| PTG3-37 | Gestión de Especialidades (Admin) | 3 |
| PTG3-31 | Reportes y Estadísticas (Admin) | 5 |
| **Total** | | **48 pts** |

### Backlog Futuro
| ID | Historia de Usuario | Puntos |
|---|---|---|
| PTG3-6 | Recuperar Contraseña | 5 |
| PTG3-22 | Notificación Nueva Reserva (Mentor) | 3 |
| PTG3-23 | Notificación Confirmación (Estudiante) | 2 |
| PTG3-30 | Recordatorio Sesión | 5 |

---

## Detalle de Historias de Usuario - Sprint 2

### PTG3-24: Subir Comprobante de Pago (5 pts)
**Como** estudiante
**Quiero** subir un comprobante de pago al reservar una sesión
**Para** que el admin pueda validar mi pago

**Criterios de Aceptación:**
- [FRONT] Formulario para subir imagen del comprobante (PNG, JPG, PDF)
- [FRONT] Vista previa de la imagen antes de enviar
- [FRONT] Campo para monto pagado
- [FRONT] Campo para método de pago (transferencia, Yape, Plin, etc.)
- [BACK] Validación de tamaño máximo de archivo (5MB)
- [FRONT] Mensaje de confirmación "Pago pendiente de validación"
- [BACK] Estado de la reserva: "Pendiente de pago"

**Tareas:**
- [ ] [BACK] Endpoint POST /api/payments/upload-proof
- [ ] [BACK] Servicio de almacenamiento de imágenes (Cloudinary/S3)
- [ ] [BACK] Modelo Payment con campos: bookingId, amount, method, proofImage, status
- [ ] [FRONT] Componente de upload con vista previa
- [ ] [FRONT] Validaciones de archivo (tipo, tamaño)
- [ ] [FRONT] Integrar en flujo de reserva

---

### PTG3-33: Aprobar Mentores - Admin (5 pts)
**Como** administrador
**Quiero** revisar y aprobar solicitudes de mentores
**Para** asegurar la calidad de los mentores en la plataforma

**Criterios de Aceptación:**
- [FRONT] Lista de mentores pendientes de aprobación
- [FRONT] Ver perfil completo: bio, experiencia, credenciales, especialidades
- [FRONT] Ver información del usuario asociado
- [FRONT] Botones: Aprobar / Rechazar
- [FRONT] Si rechaza, campo para motivo
- [BACK] Notificar al mentor el resultado
- [FRONT] Lista de mentores aprobados con opción de revocar

**Tareas:**
- [ ] [BACK] Endpoint GET /api/admin/mentors/pending
- [ ] [BACK] Endpoint PATCH /api/admin/mentors/:id/approve
- [ ] [BACK] Endpoint PATCH /api/admin/mentors/:id/reject
- [ ] [BACK] Endpoint PATCH /api/admin/mentors/:id/revoke
- [ ] [FRONT] Página de aprobación de mentores
- [ ] [FRONT] Vista detallada del perfil del mentor
- [ ] [BACK] Sistema de notificaciones

---

### PTG3-35: Validar Comprobantes de Pago - Admin (8 pts)
**Como** administrador
**Quiero** validar los comprobantes de pago de los estudiantes
**Para** confirmar las reservas de sesiones

**Criterios de Aceptación:**
- [FRONT] Lista de pagos pendientes de validación
- [FRONT] Ver imagen del comprobante en modal/lightbox
- [FRONT] Ver datos de la reserva: estudiante, mentor, fecha, monto esperado
- [FRONT] Comparar monto pagado vs monto esperado
- [FRONT] Botones: Aprobar / Rechazar
- [FRONT] Si rechaza, campo obligatorio para motivo
- [BACK] Al aprobar: actualizar estado de reserva a "Confirmada"
- [BACK] Al rechazar: notificar al estudiante con el motivo

**Tareas:**
- [ ] [BACK] Endpoint GET /api/admin/payments/pending
- [ ] [BACK] Endpoint PATCH /api/admin/payments/:id/approve
- [ ] [BACK] Endpoint PATCH /api/admin/payments/:id/reject
- [ ] [FRONT] Página de validación de pagos en admin
- [ ] [FRONT] Modal de visualización de comprobante
- [ ] [BACK] Sistema de notificaciones al estudiante
- [ ] [BACK] Actualización automática de estado de booking

---

### PTG3-38: Agregar validación de correo por código (5 pts)
**Como** Administrador del sistema 
**Quiero** verificar que los correos electrónico mediante un código 
**Para** asegurar que la cuenta existe y es segura

**Criterios de Aceptación:**
- [FRONT] Pantalla de ingreso de código de 6 dígitos tras registro
- [BACK] Envío automático de correo con código al registrarse
- [BACK] Endpoint para validar el código ingresado
- [FRONT/BACK] Tiempo de expiración del código (ej. 15 minutos)
- [FRONT] Opción de "Reenviar código"
- [BACK] No permitir acceso completo hasta verificar correo

**Tareas:**
- [ ] [BACK] Implementar servicio de envío de emails (Nodemailer/SendGrid)
- [ ] [BACK] Modelo/Lógica para almacenar códigos temporales (Redis o DB)
- [ ] [BACK] Endpoint POST /api/auth/verify-email
- [ ] [BACK] Endpoint POST /api/auth/resend-code
- [ ] [FRONT] Pantalla de verificación de OTP

---

### PTG3-39: Agregar algoritmo de mostrar por preferencias (5 pts)
**Como** estudiante
**Quiero** ver primero los mentores que coinciden con mis intereses
**Para** encontrar ayuda relevante más rápidamente

**Criterios de Aceptación:**
- [BACK] Identificar intereses del estudiante autenticado desde su perfil
- [BACK] Calcular "Puntaje de Relevancia" basado en coincidencias con especialidades del mentor
- [BACK] Ordenar resultados de búsqueda por Relevancia (descendente)
- [BACK] Mantener criterios de búsqueda y filtros adicionales funcionando
- [FRONT] Los resultados más relevantes aparecen arriba automáticamente

**Tareas:**
- [x] [BACK] Modificar `searchMentors` en controller
- [x] [BACK] Implementar lógica de intersección de arrays en agregación
- [x] [BACK] Actualizar pipeline de ordenamiento


---

## Detalle de Historias de Usuario - Sprint 3

### PTG3-25: Ver Estado de Mis Pagos (3 pts)
**Como** estudiante
**Quiero** ver el estado de mis pagos
**Para** saber si fueron aprobados o rechazados

**Criterios de Aceptación:**
- [FRONT] Lista de pagos con estados: Pendiente, Aprobado, Rechazado
- [FRONT] Mostrar fecha, monto, mentor, y estado
- [FRONT] Badge de color según estado (amarillo, verde, rojo)
- [FRONT] Si rechazado, mostrar motivo del rechazo
- [FRONT] Opción de volver a subir comprobante si fue rechazado

**Tareas:**
- [ ] [BACK] Endpoint GET /api/payments/my-payments
- [ ] [FRONT] Página "Mis Pagos" en el dashboard del estudiante
- [ ] [FRONT] Componente de lista de pagos con filtros
- [ ] [FRONT] Flujo de resubir comprobante

---

### PTG3-26: Calificar Mentor (5 pts)
**Como** estudiante
**Quiero** calificar a un mentor después de una sesión
**Para** compartir mi experiencia con otros estudiantes

**Criterios de Aceptación:**
- [FRONT] Formulario de calificación después de sesión completada
- [FRONT] Rating de 1 a 5 estrellas
- [FRONT] Campo de comentario (opcional, máx 500 caracteres)
- [BACK] Solo puede calificar sesiones completadas
- [BACK] Una sola calificación por sesión
- [BACK] Actualizar rating promedio del mentor

**Tareas:**
- [ ] [BACK] Endpoint POST /api/reviews
- [ ] [BACK] Validar que la sesión esté completada
- [ ] [BACK] Validar que no exista review previa
- [ ] [FRONT] Componente de formulario de calificación
- [ ] [BACK] Actualizar rating del mentor automáticamente

---

### PTG3-27: Ver Reseñas de Mentor (3 pts)
**Como** estudiante
**Quiero** ver las reseñas de un mentor
**Para** tomar una decisión informada antes de reservar

**Criterios de Aceptación:**
- [FRONT] Lista de reseñas en el perfil del mentor
- [FRONT] Mostrar: estudiante, rating, comentario, fecha
- [BACK] Ordenar por más recientes
- [BACK] Paginación si hay muchas reseñas
- [FRONT] Estadísticas: promedio y distribución de ratings

**Tareas:**
- [ ] [BACK] Endpoint GET /api/mentors/:id/reviews
- [ ] [FRONT] Componente de lista de reseñas
- [ ] [FRONT] Componente de estadísticas de ratings

---

### PTG3-28: Ver Ingresos - Mentor (5 pts)
**Como** mentor
**Quiero** ver mis ingresos por sesiones
**Para** llevar control de mis ganancias

**Criterios de Aceptación:**
- [FRONT] Resumen de ingresos: total, mes actual, pendientes
- [FRONT] Lista de pagos recibidos con fecha y estudiante
- [FRONT] Filtrar por período (semana, mes, año)
- [FRONT] Ver estado de cada pago

**Tareas:**
- [ ] [BACK] Endpoint GET /api/mentors/my-earnings
- [ ] [FRONT] Página "Mis Ingresos" en dashboard del mentor
- [ ] [FRONT] Componentes de resumen y lista
- [ ] [FRONT] Filtros por fecha

---

### PTG3-29: Ver Historial de Pagos (3 pts)
**Como** estudiante
**Quiero** ver mi historial completo de pagos
**Para** tener un registro de mis transacciones

**Criterios de Aceptación:**
- [FRONT] Lista paginada de todos los pagos realizados
- [FRONT] Mostrar: fecha, mentor, monto, estado, comprobante
- [FRONT] Filtrar por estado y fecha
- [FRONT] Ver detalle de cada pago

**Tareas:**
- [ ] [BACK] Endpoint GET /api/payments/history
- [ ] [FRONT] Página de historial de pagos
- [ ] [FRONT] Filtros y paginación

---

### PTG3-21: Dashboard de Administrador (5 pts)
**Como** administrador
**Quiero** ver un dashboard con métricas clave
**Para** monitorear el estado de la plataforma

**Criterios de Aceptación:**
- [FRONT] Cards con: Total usuarios, Mentores activos, Sesiones del mes, Ingresos del mes
- [FRONT] Gráfico de sesiones por semana (últimas 4 semanas)
- [FRONT] Gráfico de ingresos por mes (últimos 6 meses)
- [FRONT] Lista de últimas 5 reservas
- [FRONT] Lista de pagos pendientes de validación
- [FRONT] Accesos rápidos a secciones principales

**Tareas:**
- [ ] [BACK] Endpoint GET /api/admin/dashboard/stats
- [ ] [FRONT] Página Dashboard admin
- [ ] [FRONT] Componentes de gráficos (Chart.js o Recharts)
- [ ] [FRONT] Cards de métricas
- [ ] [FRONT] Widgets de listas recientes

---

### PTG3-32: Gestión de Usuarios - Admin (8 pts)
**Como** administrador
**Quiero** gestionar los usuarios de la plataforma
**Para** administrar cuentas de estudiantes y mentores

**Criterios de Aceptación:**
- [FRONT] Tabla de usuarios con paginación
- [FRONT] Filtros: rol (estudiante/mentor/admin), estado (activo/bloqueado)
- [FRONT] Búsqueda por nombre o email
- [FRONT] Ver perfil completo de usuario
- [FRONT] Editar datos básicos del usuario
- [BACK] Cambiar rol de usuario

**Tareas:**
- [ ] [BACK] Endpoint GET /api/admin/users con filtros
- [ ] [BACK] Endpoint GET /api/admin/users/:id
- [ ] [BACK] Endpoint PATCH /api/admin/users/:id
- [ ] [FRONT] Página de listado de usuarios
- [ ] [FRONT] Modal/página de detalle de usuario
- [ ] [FRONT] Formulario de edición

---

### PTG3-34: Bloquear/Desbloquear Usuarios - Admin (3 pts)
**Como** administrador
**Quiero** poder bloquear usuarios que violen las normas
**Para** mantener un ambiente seguro en la plataforma

**Criterios de Aceptación:**
- [FRONT] Botón de bloqueo en perfil de usuario
- [FRONT] Campo obligatorio para motivo del bloqueo
- [BACK] Usuario bloqueado no puede iniciar sesión
- [FRONT] Mostrar mensaje al usuario bloqueado al intentar login
- [FRONT] Historial de bloqueos del usuario
- [FRONT] Opción de desbloquear con motivo

**Tareas:**
- [ ] [BACK] Campos en modelo User: isBlocked, blockReason, blockedAt
- [ ] [BACK] Modelo BlockHistory: userId, action, reason, adminId, date
- [ ] [BACK] Middleware para verificar bloqueo en login
- [ ] [BACK] Endpoint PATCH /api/admin/users/:id/block
- [ ] [BACK] Endpoint PATCH /api/admin/users/:id/unblock
- [ ] [BACK] Endpoint GET /api/admin/users/:id/block-history
- [ ] [FRONT] UI de bloqueo con modal de confirmación
- [ ] [FRONT] Mensaje de error personalizado en login

---

### PTG3-36: Historial de Transacciones - Admin (5 pts)
**Como** administrador
**Quiero** ver el historial completo de transacciones
**Para** llevar control financiero de la plataforma

**Criterios de Aceptación:**
- [FRONT] Tabla con todas las transacciones (paginada)
- [FRONT] Filtros: fecha, estado, mentor, estudiante
- [FRONT] Búsqueda por nombre de usuario
- [FRONT] Exportar a CSV/Excel
- [FRONT] Resumen: total recaudado, pendientes, rechazados
- [FRONT] Ver detalle de cada transacción

**Tareas:**
- [ ] [BACK] Endpoint GET /api/admin/payments con filtros
- [ ] [BACK] Endpoint GET /api/admin/payments/export
- [ ] [FRONT] Página de historial de transacciones
- [ ] [FRONT] Componente de filtros avanzados
- [ ] [FRONT] Función de exportación
- [ ] [FRONT] Cards de resumen financiero

---

### PTG3-37: Gestión de Especialidades - Admin (3 pts)
**Como** administrador
**Quiero** gestionar las especialidades disponibles
**Para** mantener actualizado el catálogo de áreas de mentoría

**Criterios de Aceptación:**
- [FRONT] CRUD completo de especialidades
- [FRONT] Campos: nombre, descripción, categoría, icono
- [FRONT] Activar/desactivar especialidades
- [FRONT] Ver cantidad de mentores por especialidad
- [BACK] No permitir eliminar si tiene mentores asociados

**Tareas:**
- [ ] [BACK] Endpoints CRUD /api/admin/specialties
- [ ] [FRONT] Página de gestión de especialidades
- [ ] [FRONT] Formulario de crear/editar
- [ ] [BACK] Validación de eliminación

---

### PTG3-31: Reportes y Estadísticas - Admin (5 pts)
**Como** administrador
**Quiero** generar reportes de la plataforma
**Para** tomar decisiones basadas en datos

**Criterios de Aceptación:**
- [FRONT] Reporte de usuarios registrados por período
- [FRONT] Reporte de sesiones completadas vs canceladas
- [FRONT] Reporte de ingresos por período
- [FRONT] Reporte de mentores más activos
- [FRONT] Filtros de fecha (hoy, semana, mes, rango personalizado)
- [FRONT] Exportar reportes a CSV

**Tareas:**
- [ ] [BACK] Endpoint GET /api/admin/reports/users
- [ ] [BACK] Endpoint GET /api/admin/reports/sessions
- [ ] [BACK] Endpoint GET /api/admin/reports/revenue
- [ ] [BACK] Endpoint GET /api/admin/reports/top-mentors
- [ ] [FRONT] Página de reportes con tabs
- [ ] [FRONT] Componentes de gráficos
- [ ] [FRONT] Función de exportación

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

### Sprint 1 - Autenticación, Marketplace y Perfiles
- [x] Sistema de autenticación (registro, login, logout)
- [x] Perfiles de mentores (crear, editar)
- [x] Setup de entornos y configuración inicial
- [x] Marketplace de mentores
- [x] Sistema de búsqueda y filtros
- [x] Perfiles completos de mentores
- [x] Perfil de estudiante

### Sprint 2 - Sistema de Reservas, Pagos y Admin Core
- [ ] Gestión de disponibilidad por mentores
- [ ] Sistema de reservas completo
- [ ] Aprobación/rechazo de sesiones
- [ ] Cancelación de sesiones
- [ ] Subir comprobante de pago (estudiante)
- [ ] Aprobar mentores (admin)
- [ ] Validar comprobantes de pago (admin)

### Sprint 3 - Panel Admin, Valoraciones e Historial
- [ ] Ver estado de pagos (estudiante)
- [ ] Sistema de calificaciones y reseñas
- [ ] Ver ingresos (mentor)
- [ ] Dashboard de administrador
- [ ] Gestión de usuarios (admin)
- [ ] Bloquear/desbloquear usuarios (admin)
- [ ] Historial de transacciones (admin)
- [ ] Gestión de especialidades (admin)
- [ ] Reportes y estadísticas (admin)

### Backlog Futuro
- [ ] Notificaciones (email)
- [ ] Recuperación de contraseña
- [ ] Recordatorios de sesión

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

**Versión**: 1.1
**Última actualización**: 2026-01-26
**Equipo**: Desarrollo Full Stack
