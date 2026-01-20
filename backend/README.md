# Backend - MentorMatch API

API REST para sistema de reserva de mentorías. Construida con Node.js, Express, TypeScript y MongoDB con arquitectura modular.

## Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web minimalista
- **TypeScript** - Tipado estático para JavaScript
- **MongoDB + Mongoose** - Base de datos NoSQL
- **JWT + bcrypt** - Autenticación y seguridad
- **Express Validator** - Validación de datos
- **tsx** - TypeScript execution para desarrollo
- **ESLint** - Linter de código
- **Prettier** - Formateador de código

## Estructura de Carpetas

```
src/
├── config/         # Configuraciones (database, env, etc.)
├── controllers/    # Controladores de rutas
├── middlewares/    # Middlewares personalizados
├── models/         # Modelos de datos
├── routes/         # Definición de rutas
├── services/       # Lógica de negocio
├── types/          # Tipos e interfaces TypeScript
├── utils/          # Funciones utilitarias
└── index.ts        # Punto de entrada
```

## Arquitectura

El proyecto sigue una arquitectura en capas:

1. **Routes** - Define endpoints y asocia con controladores
2. **Controllers** - Maneja requests/responses HTTP
3. **Services** - Contiene lógica de negocio
4. **Models** - Representa entidades de datos
5. **Middlewares** - Procesa requests antes de llegar a controllers

## Requisitos Previos

- Node.js >= 14 (recomendado 20 LTS)
- MongoDB instalado y corriendo
- Yarn o npm

## Instalación

```bash
# Instalar dependencias
yarn install

# o con npm
npm install

# Configurar variables de entorno
cp .env.example .env
```

## Configuración

### MongoDB

Asegúrate de que MongoDB esté corriendo:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### Variables de Entorno

Edita el archivo `.env` con tus valores:

```env
NODE_ENV=development
PORT=4000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/mentordb

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# App
APP_NAME=MentorMatch
```

## Scripts Disponibles

```bash
# Desarrollo - Inicia servidor con hot reload
yarn dev

# Build - Compila TypeScript a JavaScript
yarn build

# Start - Ejecuta versión compilada (producción)
yarn start

# Lint - Ejecuta ESLint
yarn lint

# Lint Fix - Corrige problemas de ESLint automáticamente
yarn lint:fix

# Format - Formatea código con Prettier
yarn format

# Format Check - Verifica formato sin modificar archivos
yarn format:check
```

## Desarrollo

1. Configura las variables de entorno en `.env`

2. Inicia el servidor de desarrollo:
   ```bash
   yarn dev
   ```

3. El servidor estará disponible en [http://localhost:4000](http://localhost:4000)

4. Prueba el endpoint de health:
   ```bash
   curl http://localhost:4000/api/health
   ```

## Modelos de Datos

El proyecto incluye los siguientes modelos de Mongoose:

### User
Usuario del sistema (estudiante, mentor o admin)
- email, password (hashed), firstName, lastName
- role: 'student' | 'mentor' | 'admin'
- avatar, isActive

### Mentor
Perfil de mentor
- userId (ref: User)
- bio, specialties (ref: Specialty[])
- experience, credentials[]
- rating, totalSessions
- isApproved, isActive

### Specialty
Área de especialización
- name, description, category
- icon, isActive

### Availability
Disponibilidad horaria del mentor
- mentorId (ref: Mentor)
- dayOfWeek (0-6), startTime, endTime
- duration (minutos)

### Booking
Reserva de mentoría
- studentId (ref: User), mentorId (ref: Mentor)
- specialty (ref: Specialty)
- scheduledDate, startTime, endTime
- status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
- meetingLink, notes

### Review
Valoración de mentoría
- bookingId (ref: Booking)
- studentId, mentorId
- rating (1-5), comment

## Endpoints Disponibles

### Base
```
GET /                  # Información de la API
GET /api/health        # Health check
```

### Autenticación (por implementar)
```
POST /api/auth/register          # Registro de usuario
POST /api/auth/login             # Login
GET  /api/auth/me                # Usuario actual
POST /api/auth/logout            # Logout
```

### Usuarios (por implementar)
```
GET    /api/users                # Listar usuarios
GET    /api/users/:id            # Obtener usuario
PUT    /api/users/:id            # Actualizar usuario
DELETE /api/users/:id            # Eliminar usuario
```

### Mentores (por implementar)
```
GET    /api/mentors              # Listar mentores
GET    /api/mentors/:id          # Obtener mentor
POST   /api/mentors              # Crear perfil mentor
PUT    /api/mentors/:id          # Actualizar mentor
DELETE /api/mentors/:id          # Eliminar mentor
GET    /api/mentors/search       # Buscar mentores
```

### Especialidades (por implementar)
```
GET    /api/specialties          # Listar especialidades
GET    /api/specialties/:id      # Obtener especialidad
POST   /api/specialties          # Crear especialidad (admin)
PUT    /api/specialties/:id      # Actualizar especialidad (admin)
DELETE /api/specialties/:id      # Eliminar especialidad (admin)
```

### Reservas (por implementar)
```
GET    /api/bookings             # Listar reservas
GET    /api/bookings/:id         # Obtener reserva
POST   /api/bookings             # Crear reserva
PUT    /api/bookings/:id         # Actualizar reserva
DELETE /api/bookings/:id         # Cancelar reserva
GET    /api/bookings/student/:id # Reservas de estudiante
GET    /api/bookings/mentor/:id  # Reservas de mentor
```

### Valoraciones (por implementar)
```
GET    /api/reviews              # Listar valoraciones
GET    /api/reviews/:id          # Obtener valoración
POST   /api/reviews              # Crear valoración
GET    /api/reviews/mentor/:id   # Valoraciones de mentor
```

## Agregar Nuevas Rutas

1. Crea el controlador en `src/controllers/`:
   ```typescript
   // src/controllers/user.controller.ts
   import { Request, Response } from 'express'

   export const getUsers = (req: Request, res: Response) => {
     // Implementación
   }
   ```

2. Crea las rutas en `src/routes/`:
   ```typescript
   // src/routes/user.routes.ts
   import { Router } from 'express'
   import { getUsers } from '../controllers/user.controller.js'

   const router = Router()
   router.get('/', getUsers)

   export default router
   ```

3. Registra las rutas en `src/routes/index.ts`:
   ```typescript
   import userRouter from './user.routes.js'
   router.use('/users', userRouter)
   ```

## Manejo de Errores

El proyecto incluye un middleware de manejo de errores centralizado:

```typescript
// Lanzar error en cualquier parte
throw new Error('Something went wrong')

// El middleware errorHandler lo capturará automáticamente
```

## Estándares de Código

- Usa TypeScript para todo el código
- Sigue las reglas de ESLint configuradas
- Formatea código con Prettier antes de commit
- Usa async/await en lugar de callbacks
- Nombra archivos en kebab-case: `user.controller.ts`
- Exporta funciones con nombre, evita export default cuando sea posible

## Buenas Prácticas

- Mantén los controladores ligeros, mueve lógica a services
- Valida inputs del usuario
- Maneja errores de forma apropiada
- Usa variables de entorno para configuración
- Documenta APIs complejas
- Escribe código limpio y mantenible

## Build de Producción

```bash
# Compilar TypeScript
yarn build

# Iniciar servidor de producción
NODE_ENV=production yarn start
```

Los archivos compilados estarán en `dist/`

## Extensiones Recomendadas

- ESLint
- Prettier
- TypeScript
- REST Client (para probar APIs)
