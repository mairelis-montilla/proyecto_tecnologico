# Backend — MentorMatch API

API REST desplegada en Render. Construida con Node.js, Express y TypeScript, conectada a MongoDB Atlas.

- **URL producción:** https://mentormatch-api.onrender.com
- **Health check:** https://mentormatch-api.onrender.com/api/health
- **Repositorio:** https://github.com/mairelis-montilla/proyecto_tecnologico

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| Node.js 20 LTS | Runtime |
| Express 4 | Framework HTTP |
| TypeScript 5 | Tipado estático |
| Mongoose 8 | ODM para MongoDB |
| JWT + bcrypt | Autenticación y hash |
| Multer + Cloudinary | Subida de imágenes |
| Express Validator | Validación de entrada |
| node-cron | Tareas programadas |
| Nodemailer | Emails transaccionales |

---

## Estructura de Carpetas

```
src/
├── config/         # Conexión a BD, variables de entorno
├── controllers/    # Lógica de cada grupo de endpoints
├── middlewares/    # authenticateToken, authorize, upload
├── models/         # Esquemas Mongoose
├── routes/         # Registro de rutas → index.ts
├── services/       # Lógica de negocio (notificaciones, cron)
├── scripts/        # Scripts de datos (seed, migrate)
├── types/          # Tipos globales TypeScript
├── utils/          # Helpers (avatar, email templates, etc.)
└── index.ts        # Punto de entrada
```

---

## Arquitectura en Capas

```
HTTP Request
     │
     ▼
  Routes  ──→  Middlewares (auth / role / validation)
     │
     ▼
Controllers  ──→  Models (Mongoose)
     │                    │
     ▼                    ▼
  Response            MongoDB Atlas
```

---

## Despliegue en Render

**Plataforma:** Render Web Service (plan gratuito)

| Parámetro | Valor |
|---|---|
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Node version | 20 |
| Auto-deploy | Sí, desde rama `main` |

> En plan gratuito, el servicio entra en sleep tras 15 min de inactividad. La primera petición puede tardar ~30 s.

### Variables de Entorno (Render)

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<clave secreta>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://mentormatchpe.netlify.app
CLOUDINARY_CLOUD_NAME=<nombre>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<correo>
EMAIL_PASS=<contraseña app>
```

---

## Variables de Entorno para Desarrollo Local

Crea `backend/.env` con:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/mentordb
JWT_SECRET=dev-secret-local
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=<nombre>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
```

---

## Scripts Disponibles

```bash
npm run dev                 # Desarrollo con hot reload (tsx watch)
npm run build               # Compila TypeScript → dist/
npm run start               # Ejecuta dist/index.js (producción)
npm run lint                # ESLint
npm run lint:fix            # ESLint con auto-fix
npm run format              # Prettier

# Scripts de base de datos
npm run seed:admin          # Crea usuario admin inicial
npm run seed:specialties    # Pobla especialidades
npm run seed:mentors        # Datos de prueba de mentores
npm run seed:availability   # Disponibilidad de mentores
npm run complete:sessions   # Marca sesiones confirmadas pasadas como completadas
```

---

## Endpoints de la API

### Base
```
GET  /                    # Info de la API
GET  /api/health          # Health check
```

### Autenticación — /api/auth
```
POST  /register           # Registro de usuario
POST  /register-mentor    # Registro con perfil mentor
POST  /login              # Login → JWT token
GET   /me                 # Usuario autenticado [auth]
PATCH /update-avatar      # Actualizar avatar [auth]
POST  /change-password    # Cambiar contraseña [auth]
```

### Mentores — /api/mentors
```
GET   /                   # Listar mentores aprobados (público)
GET   /search             # Buscar mentores con filtros
GET   /my-profile         # Perfil propio [mentor]
GET   /my-earnings        # Ingresos del mentor [mentor]
PUT   /profile            # Actualizar perfil [mentor]
GET   /:id                # Perfil público de un mentor
```

### Estudiantes — /api/students
```
GET   /my-profile         # Perfil propio [student]
PUT   /profile            # Actualizar perfil [student]
```

### Reservas — /api/bookings
```
POST  /                   # Crear reserva [student]
GET   /my-bookings        # Reservas del usuario [auth]
GET   /:id                # Detalle de reserva [auth]
POST  /:id/upload-payment # Subir comprobante [student]
PATCH /:id/confirm        # Confirmar sesión [mentor]
PATCH /:id/reject         # Rechazar solicitud [mentor]
PATCH /:id/cancel         # Cancelar reserva [auth]
PATCH /:id/complete       # Marcar como completada [mentor]
```

### Pagos — /api/payments
```
GET   /my-payments        # Pagos del estudiante [student]
GET   /history            # Historial de pagos [student]
```

### Reseñas — /api/reviews
```
POST  /                   # Crear reseña [student]
GET   /my-reviews         # Reseñas recibidas [mentor]
GET   /mentor/:mentorId   # Reseñas de un mentor (público)
```

### Especialidades — /api/specialties
```
GET   /                   # Listar especialidades (público)
GET   /categories         # Categorías disponibles (público)
```

### Disponibilidad — /api/availability
```
GET   /mentor/:mentorId   # Disponibilidad de un mentor (público)
PUT   /                   # Actualizar disponibilidad [mentor]
GET   /slots/:mentorId    # Slots libres con fecha [auth]
```

### Notificaciones — /api/notifications
```
GET   /                   # Notificaciones del usuario [auth]
PATCH /:id/read           # Marcar como leída [auth]
PATCH /read-all           # Marcar todas como leídas [auth]
```

### Admin — /api/admin
```
GET   /stats              # Métricas del dashboard [admin]
GET   /users              # Listar usuarios [admin]
PATCH /users/:id/toggle-status  # Bloquear/desbloquear [admin]
GET   /pending-mentors    # Mentores pendientes de aprobación [admin]
GET   /approved-mentors   # Mentores aprobados [admin]
PATCH /mentors/:id/approve      # Aprobar mentor [admin]
PATCH /mentors/:id/reject       # Rechazar mentor [admin]
GET   /payments           # Todos los pagos [admin]
GET   /payments/pending   # Pagos pendientes [admin]
PATCH /payments/:id/approve     # Aprobar comprobante [admin]
PATCH /payments/:id/reject      # Rechazar comprobante [admin]
GET   /transactions       # Transacciones del sistema [admin]
```

---

## Modelos de Datos

### User
```typescript
email, password (hashed), firstName, lastName
role: 'student' | 'mentor' | 'admin'
avatar, isActive, isEmailVerified
```

### Mentor
```typescript
userId (→ User), bio, title, hourlyRate
specialties (→ Specialty[]), languages[], credentials[]
experience, rating, totalSessions
isApproved, isActive
```

### Booking
```typescript
studentId (→ Student), mentorId (→ Mentor)
scheduledAt, duration (45|60 min), topic, totalAmount
status: 'pending_payment' | 'payment_uploaded' | 'payment_validated'
       | 'confirmed' | 'completed' | 'cancelled' | 'refunded' | 'rejected'
meetLink, paymentProof, remindersSent
```

### Payment
```typescript
bookingId (→ Booking), studentId (→ User), mentorId (→ Mentor)
amount, currency, paymentMethod
status: 'pending_proof' | 'pending_validation' | 'validated' | 'rejected' | 'refunded'
proofImage, platformFee (10%), mentorEarnings (90%)
rejectionReason, validatedAt
```

### Review
```typescript
mentorId (→ Mentor), studentId (→ Student), bookingId (→ Booking)
rating (1-5), comment, isVisible
```

---

## Agregar Nuevos Endpoints

1. Crear controlador en `src/controllers/feature.controller.ts`
2. Crear rutas en `src/routes/feature.routes.ts`
3. Registrar en `src/routes/index.ts`:
   ```typescript
   import featureRouter from './feature.routes.js'
   router.use('/feature', featureRouter)
   ```

---

## Plan de Mantenimiento

- Revisar logs en el panel de Render periódicamente
- Ejecutar `npm run complete:sessions` cuando se necesite cerrar sesiones pasadas
- Verificar uso de MongoDB Atlas (límite 512 MB en plan gratuito)
- Rotar `JWT_SECRET` y credenciales de Cloudinary cada 6 meses
- Actualizar dependencias con `npm outdated` cada trimestre
