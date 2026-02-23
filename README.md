# MentorMatch — Sistema de Reserva de Mentorías

Plataforma web full stack que conecta estudiantes con mentores especializados, permitiendo la búsqueda, reserva, pago y seguimiento de sesiones de mentoría en línea.

El sistema gestiona el ciclo de vida completo de una sesión: desde que el estudiante busca un mentor y reserva un horario, hasta el pago, la confirmación por parte del mentor, la realización de la sesión y la reseña final. Un administrador supervisa la plataforma, aprueba mentores y valida comprobantes de pago.

---

## Enlaces del Proyecto

| Recurso | URL |
|---|---|
| Repositorio GitHub | https://github.com/mairelis-montilla/proyecto_tecnologico |
| Frontend (producción) | https://mentormatchpe.netlify.app/ |
| Backend API (producción) | https://mentormatch-api.onrender.com |
| Health check API | https://mentormatch-api.onrender.com/api/health |

---

## Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Arquitectura de Despliegue](#arquitectura-de-despliegue)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Roles del Sistema](#roles-del-sistema)
5. [Modelos de Base de Datos](#modelos-de-base-de-datos)
6. [API REST — Endpoints](#api-rest--endpoints)
7. [Estructura del Repositorio](#estructura-del-repositorio)
8. [Seguridad](#seguridad)
9. [Despliegue y Variables de Entorno](#despliegue-y-variables-de-entorno)
10. [Desarrollo Local](#desarrollo-local)
11. [Scripts de Base de Datos](#scripts-de-base-de-datos)
12. [Plan de Mantenimiento](#plan-de-mantenimiento)

---

## Arquitectura del Sistema

MentorMatch implementa una **arquitectura cliente-servidor desacoplada**. El frontend y el backend son aplicaciones completamente independientes que se comunican exclusivamente a través de una API REST sobre HTTPS. Esta separación permite que cada capa escale, se actualice y se despliegue de forma autónoma.

### Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
│          React 18 + TypeScript + Vite + Tailwind CSS        │
│               Desplegado en Netlify (CDN global)            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND API                             │
│          Node.js + Express + TypeScript                     │
│          Desplegado en Render (Web Service)                 │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Routes    │→ │ Controllers  │→ │    Services      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│                          │                    │             │
│                          ▼                    ▼             │
│                   ┌──────────────┐  ┌──────────────────┐   │
│                   │  Middlewares │  │     Models       │   │
│                   │  (auth/rol)  │  │   (Mongoose)     │   │
│                   └──────────────┘  └──────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌─────────────────────┐     ┌──────────────────────┐
│    MongoDB Atlas    │     │      Cloudinary      │
│  (Base de datos     │     │  (Imágenes: avatares,│
│   en la nube)       │     │   comprobantes pago) │
└─────────────────────┘     └──────────────────────┘
```

### Descripción de Cada Capa

| Capa | Plataforma | Descripción |
|---|---|---|
| **Frontend** | Netlify CDN | SPA en React 18. Distribuida globalmente. Consume la API mediante Axios sobre HTTPS. |
| **Backend API** | Render | API REST en Node.js + Express. Arquitectura en capas: Routes → Middlewares → Controllers → Models. |
| **Base de datos** | MongoDB Atlas | Cluster MongoDB gestionado en la nube. Acceso via Mongoose ODM. Backups automáticos diarios. |
| **Archivos** | Cloudinary | CDN especializado en imágenes. Gestiona avatares de usuarios y comprobantes de pago. |

### Arquitectura Interna del Backend

```
HTTP Request
     │
     ▼
  Routes ──→ Middlewares (autenticación / rol / validación de entrada)
     │
     ▼
Controllers ──→ Models (Mongoose) ──→ MongoDB Atlas
     │
     ▼
  Response JSON
```

| Capa | Responsabilidad |
|---|---|
| **Routes** | Registrar los endpoints y asociarlos a controladores |
| **Middlewares** | Verificar JWT, validar rol del usuario, procesar archivos |
| **Controllers** | Orquestar la lógica de cada operación HTTP |
| **Models** | Definir los esquemas de datos y acceder a MongoDB |
| **Services** | Lógica de negocio reutilizable (notificaciones, cron jobs) |

### Flujo de Autenticación

```
Usuario → POST /api/auth/login → Validación de credenciales
       → JWT firmado (expira en 7 días)
       → Cliente almacena el token
       → Cada petición protegida: Authorization: Bearer <token>
       → Middleware authenticateToken valida el JWT
       → Middleware authorize(role) restringe por rol
       → Controlador ejecuta la operación
```

El token JWT contiene el `userId` y el `role` del usuario. No se almacena estado de sesión en el servidor (arquitectura **stateless**).

---

## Arquitectura de Despliegue

El despliegue sigue un modelo de **Integración y Entrega Continua (CI/CD)**: cada `push` a la rama `main` en GitHub dispara automáticamente el proceso de build y deploy en Netlify y Render, sin intervención manual.

### Diagrama de Despliegue

```
Desarrollador
     │
     │  git push origin main
     ▼
┌─────────────┐
│   GitHub    │ ──── Webhook ────┬──────────────────────┐
│  (main)     │                  │                      │
└─────────────┘                  ▼                      ▼
                      ┌─────────────────┐   ┌──────────────────┐
                      │    Netlify      │   │     Render       │
                      │  (Frontend)     │   │   (Backend)      │
                      │ npm run build   │   │ npm install      │
                      │ → genera /dist  │   │ npm run build    │
                      │ → CDN global    │   │ npm start        │
                      └────────┬────────┘   └────────┬─────────┘
                               │                     │
                   HTTPS       │                     │  TCP/TLS
                   ┌───────────┘                     │
                   ▼                                 ▼
            Usuario Final                  ┌──────────────────┐
                                           │  MongoDB Atlas   │
                                           └────────┬─────────┘
                                                    │
                                           ┌────────┴─────────┐
                                           │   Cloudinary     │
                                           └──────────────────┘
```

### Frontend — Netlify

| Parámetro | Valor |
|---|---|
| Plataforma | Netlify (plan gratuito con CDN global) |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 18 o superior |
| Auto-deploy desde | Rama `main` |
| URL de producción | https://mentormatchpe.netlify.app/ |

El archivo `netlify.toml` en la raíz del frontend es imprescindible para que React Router funcione correctamente al refrescar la página o acceder a una ruta directamente:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Backend — Render

| Parámetro | Valor |
|---|---|
| Plataforma | Render Web Service (plan gratuito) |
| Environment | Node |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Node version | 20 LTS |
| Auto-deploy desde | Rama `main` |
| URL de producción | https://mentormatch-api.onrender.com |

> **Nota:** En el plan gratuito de Render, el servicio entra en modo sleep tras 15 minutos de inactividad. La primera petición posterior puede tardar aproximadamente 30 segundos mientras el servidor se reactiva. Esto no afecta a usuarios en uso continuo.

### Base de Datos — MongoDB Atlas

| Característica | Detalle |
|---|---|
| Tipo | MongoDB (NoSQL orientado a documentos) |
| Plan | M0 Gratuito |
| Almacenamiento máximo | 512 MB |
| Backups automáticos | Últimas 24 horas (plan gratuito) |
| Alta disponibilidad | Replica set de 3 nodos |
| Control de acceso | Lista blanca de IPs + autenticación de usuario |

### Almacenamiento de Archivos — Cloudinary

| Recurso | Carpeta en Cloudinary | Formatos |
|---|---|---|
| Avatares de usuarios | `mentormatch/avatars/` | JPG, PNG, WebP |
| Comprobantes de pago | `mentormatch/payments/` | JPG, PNG, PDF |

Flujo de subida de archivos:
1. El cliente envía el archivo como `multipart/form-data` al backend.
2. Multer intercepta el archivo y lo retiene en memoria (sin escribirlo en disco).
3. El SDK de Cloudinary sube el archivo y devuelve una URL pública permanente.
4. El backend persiste esa URL en el documento correspondiente de MongoDB.

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| React | 18 | Biblioteca UI basada en componentes reutilizables |
| TypeScript | 5.x | Tipado estático sobre JavaScript |
| Vite | 5.x | Build tool y servidor de desarrollo con HMR |
| Tailwind CSS | 3.x | Framework CSS utility-first |
| React Router | 6.x | Enrutamiento SPA del lado del cliente |
| Zustand | 4.x | Gestión del estado global sin boilerplate |
| Axios | 1.x | Cliente HTTP para consumir la API REST |
| Lucide React | — | Biblioteca de iconos SVG |
| React Hot Toast | — | Notificaciones UI no intrusivas |

### Backend

| Tecnología | Versión | Propósito |
|---|---|---|
| Node.js | 20 LTS | Entorno de ejecución JavaScript del servidor |
| Express | 4.x | Framework web para la construcción de la API REST |
| TypeScript | 5.x | Tipado estático y mayor seguridad en desarrollo |
| Mongoose | 8.x | ODM para modelado y consulta de datos en MongoDB |
| JSON Web Token (JWT) | 9.x | Autenticación stateless basada en tokens firmados |
| bcrypt | 5.x | Hash seguro de contraseñas |
| Multer | — | Procesamiento de archivos `multipart/form-data` |
| Cloudinary SDK | — | Integración para subida y gestión de imágenes |
| Express Validator | 7.x | Validación y saneamiento de datos de entrada |
| node-cron | 4.x | Tareas programadas (cierre automático de sesiones) |
| Nodemailer | 7.x | Envío de emails transaccionales mediante SMTP |

### Infraestructura en la Nube

| Servicio | Plataforma | Plan | Propósito |
|---|---|---|---|
| Frontend | Netlify | Gratuito | Hosting estático con CDN global y CI/CD |
| Backend | Render | Gratuito | Web Service Node.js con CI/CD |
| Base de datos | MongoDB Atlas | M0 Gratuito | Cluster MongoDB gestionado en la nube |
| Archivos | Cloudinary | Gratuito | CDN especializado en imágenes y archivos |
| Repositorio | GitHub | Gratuito | Control de versiones y disparador de CI/CD |

---

## Roles del Sistema

El sistema implementa control de acceso basado en roles (RBAC). Cada usuario tiene exactamente un rol que determina las operaciones que puede realizar.

| Rol | Descripción | Capacidades principales |
|---|---|---|
| `student` | Estudiante en búsqueda de mentoría | Buscar mentores, reservar sesiones, subir comprobantes de pago, dejar reseñas, consultar historial de pagos |
| `mentor` | Profesional que ofrece mentorías | Gestionar disponibilidad horaria, aprobar/rechazar solicitudes, marcar sesiones como completadas, ver ingresos y reseñas |
| `admin` | Administrador de la plataforma | Aprobar/rechazar mentores, validar comprobantes de pago, gestionar usuarios, ver métricas globales |

La protección de rutas en el frontend se implementa con el componente `ProtectedRoute`:
- Si el usuario no está autenticado → redirige a `/login`
- Si está autenticado pero sin el rol requerido → redirige al dashboard correspondiente

En el backend, el middleware `authorize(role)` verifica el rol después de que `authenticateToken` valida el JWT.

---

## Modelos de Base de Datos

### Relaciones entre Entidades

```
User ──── Mentor     (1:1, userId)
User ──── Student    (1:1, userId)
Mentor ──── Availability  (1:N)
Mentor ──── Specialty     (N:M)
Student + Mentor ──── Booking  (N:M)
Booking ──── Payment  (1:1)
Booking ──── Review   (1:1)
User ──── Notification  (1:N)
```

### Descripción de Modelos

| Modelo | Descripción | Atributos principales |
|---|---|---|
| `User` | Usuario base del sistema | `email`, `password` (hash bcrypt), `firstName`, `lastName`, `role`, `avatar`, `isActive` |
| `Mentor` | Perfil extendido del mentor | `userId`, `bio`, `title`, `hourlyRate`, `specialties[]`, `languages[]`, `rating`, `totalSessions`, `isApproved` |
| `Student` | Perfil del estudiante | `userId`, `bio`, `educationLevel`, `interests[]` |
| `Specialty` | Área de especialización | `name`, `category`, `description`, `icon` |
| `Availability` | Franjas horarias del mentor | `mentorId`, `dayOfWeek` (0-6), `startTime`, `endTime`, `isRecurring` |
| `Booking` | Reserva de sesión | `studentId`, `mentorId`, `scheduledAt`, `duration` (45 \| 60 min), `topic`, `totalAmount`, `status`, `meetLink`, `paymentProof` |
| `Payment` | Registro de pago | `bookingId`, `studentId`, `mentorId`, `amount`, `currency`, `status`, `proofImage`, `platformFee` (10%), `mentorEarnings` (90%) |
| `Review` | Reseña del estudiante | `mentorId`, `studentId`, `bookingId`, `rating` (1-5), `comment`, `isVisible` |
| `Notification` | Notificación en app | `userId`, `type`, `title`, `message`, `isRead`, `link` |

### Estados del modelo `Booking`

```
pending_payment → payment_uploaded → payment_validated → confirmed → completed
                                                        ↘ rejected
                                  ↘ cancelled / refunded
```

### Estados del modelo `Payment`

```
pending_proof → pending_validation → validated
                                   ↘ rejected → refunded
```

---

## API REST — Endpoints

**URL base en producción:** `https://mentormatch-api.onrender.com`

**Convenciones de autorización:**
- `[público]` — No requiere autenticación
- `[auth]` — Requiere token JWT válido en el header `Authorization: Bearer <token>`
- `[student]` / `[mentor]` / `[admin]` — Requiere JWT válido + el rol especificado

### Generales

```
GET  /               → Información de la API                          [público]
GET  /api/health     → Health check (estado del servidor)             [público]
```

### Autenticación — `/api/auth`

```
POST  /register             → Registro de nuevo usuario estudiante    [público]
POST  /register-mentor      → Registro con perfil de mentor           [público]
POST  /login                → Login, devuelve JWT                     [público]
GET   /me                   → Datos del usuario autenticado           [auth]
PATCH /update-avatar        → Actualizar foto de perfil               [auth]
POST  /change-password      → Cambiar contraseña                      [auth]
```

### Mentores — `/api/mentors`

```
GET  /              → Listar mentores aprobados                       [público]
GET  /search        → Buscar mentores con filtros                     [público]
GET  /:id           → Perfil público de un mentor                     [público]
GET  /my-profile    → Perfil propio del mentor                        [mentor]
GET  /my-earnings   → Ingresos del mentor                             [mentor]
PUT  /profile       → Actualizar perfil del mentor                    [mentor]
```

### Estudiantes — `/api/students`

```
GET  /my-profile    → Perfil propio del estudiante                    [student]
PUT  /profile       → Actualizar perfil del estudiante                [student]
```

### Reservas — `/api/bookings`

```
POST  /                      → Crear reserva                          [student]
GET   /my-bookings           → Reservas del usuario autenticado       [auth]
GET   /:id                   → Detalle de una reserva                 [auth]
POST  /:id/upload-payment    → Subir comprobante de pago              [student]
PATCH /:id/confirm           → Confirmar sesión                       [mentor]
PATCH /:id/reject            → Rechazar solicitud                     [mentor]
PATCH /:id/cancel            → Cancelar reserva                       [auth]
PATCH /:id/complete          → Marcar como completada                 [mentor]
```

### Pagos — `/api/payments`

```
GET  /my-payments    → Pagos del estudiante                           [student]
GET  /history        → Historial de pagos                             [student]
```

### Reseñas — `/api/reviews`

```
POST /                    → Crear reseña                              [student]
GET  /my-reviews          → Reseñas recibidas                         [mentor]
GET  /mentor/:mentorId    → Reseñas de un mentor                      [público]
```

### Especialidades — `/api/specialties`

```
GET  /             → Listar especialidades                            [público]
GET  /categories   → Categorías disponibles                           [público]
```

### Disponibilidad — `/api/availability`

```
GET  /mentor/:mentorId    → Disponibilidad de un mentor               [público]
PUT  /                    → Actualizar disponibilidad                  [mentor]
GET  /slots/:mentorId     → Slots libres con fecha                    [auth]
```

### Notificaciones — `/api/notifications`

```
GET   /               → Notificaciones del usuario                    [auth]
PATCH /:id/read       → Marcar notificación como leída                [auth]
PATCH /read-all       → Marcar todas como leídas                      [auth]
```

### Administración — `/api/admin`

```
GET   /stats                        → Métricas globales del dashboard [admin]
GET   /users                        → Listar todos los usuarios       [admin]
PATCH /users/:id/toggle-status      → Bloquear o desbloquear usuario  [admin]
GET   /pending-mentors              → Mentores pendientes             [admin]
GET   /approved-mentors             → Mentores aprobados              [admin]
PATCH /mentors/:id/approve          → Aprobar mentor                  [admin]
PATCH /mentors/:id/reject           → Rechazar mentor                 [admin]
GET   /payments                     → Todos los pagos del sistema     [admin]
GET   /payments/pending             → Pagos pendientes de validación  [admin]
PATCH /payments/:id/approve         → Aprobar comprobante de pago     [admin]
PATCH /payments/:id/reject          → Rechazar comprobante de pago    [admin]
GET   /transactions                 → Historial de transacciones      [admin]
```

---

## Estructura del Repositorio

```
proyecto_tecnologico/
│
├── frontend/                        # Aplicación React (Netlify)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/              # Header, Sidebar, layouts por rol
│   │   │   ├── booking/             # Formularios y cards de reservas
│   │   │   ├── mentor/              # Cards y perfiles de mentores
│   │   │   ├── notifications/       # Dropdown de notificaciones
│   │   │   └── ui/                  # Componentes genéricos reutilizables
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # Dashboard estudiante/mentor
│   │   │   ├── MentorSearch.tsx     # Búsqueda de mentores
│   │   │   ├── MentorProfile.tsx    # Perfil público del mentor
│   │   │   ├── StudentBookings.tsx  # Mis reservas (estudiante)
│   │   │   ├── MentorSessions.tsx   # Mis sesiones (mentor)
│   │   │   ├── StudentMyPayments.tsx# Mis pagos (estudiante)
│   │   │   ├── MentorEarnings.tsx   # Mis ingresos (mentor)
│   │   │   ├── ProfilePage.tsx      # Perfil editable
│   │   │   ├── AdminDashboard.tsx   # Panel administrador
│   │   │   ├── AdminUserManagement.tsx
│   │   │   ├── AdminAproveMentors.tsx
│   │   │   ├── AdminPaymentValidation.tsx
│   │   │   └── AdminTransactions.tsx
│   │   ├── services/                # Llamadas HTTP a la API (Axios)
│   │   ├── stores/                  # Estado global (Zustand)
│   │   ├── types/                   # Interfaces TypeScript
│   │   ├── utils/                   # Helpers (avatar, fechas, etc.)
│   │   ├── App.tsx                  # Rutas y providers
│   │   └── main.tsx                 # Punto de entrada
│   ├── netlify.toml                 # Configuración redirecciones SPA
│   └── README.md
│
├── backend/                         # API REST Node.js (Render)
│   ├── src/
│   │   ├── config/                  # Conexión a BD, variables de entorno
│   │   ├── controllers/             # Lógica de cada grupo de endpoints
│   │   ├── middlewares/             # authenticateToken, authorize, upload
│   │   ├── models/                  # Esquemas Mongoose
│   │   ├── routes/                  # Definición de rutas → index.ts
│   │   ├── services/                # Lógica de negocio y notificaciones
│   │   ├── scripts/                 # Seeds y scripts de datos
│   │   ├── types/                   # Tipos globales TypeScript
│   │   ├── utils/                   # Helpers (email templates, etc.)
│   │   └── index.ts                 # Punto de entrada del servidor
│   └── README.md
│
└── README.md                        # Este archivo
```

### Rutas de la Aplicación

#### Públicas
| Ruta | Página |
|---|---|
| `/` | Landing page |
| `/login` | Inicio de sesión |
| `/register` | Registro de usuario |

#### Protegidas — Estudiante
| Ruta | Página |
|---|---|
| `/dashboard` | Dashboard con estadísticas personales |
| `/search` | Búsqueda y filtrado de mentores |
| `/mentor/:id` | Perfil público del mentor |
| `/bookings` | Mis reservas y su estado |
| `/my-payments` | Mis pagos e historial |
| `/profile` | Mi perfil editable |

#### Protegidas — Mentor
| Ruta | Página |
|---|---|
| `/dashboard` | Dashboard con métricas propias |
| `/sessions` | Mis sesiones y solicitudes |
| `/reviews` | Reseñas recibidas |
| `/earnings` | Mis ingresos |
| `/profile` | Mi perfil editable |

#### Protegidas — Administrador
| Ruta | Página |
|---|---|
| `/admin/dashboard` | Panel con métricas globales |
| `/admin/users` | Gestión de usuarios |
| `/admin/mentors` | Aprobación de mentores |
| `/admin/payments` | Validación de comprobantes |
| `/admin/transactions` | Historial de transacciones |

### Estado Global — Zustand Stores

| Store | Descripción |
|---|---|
| `auth.store` | Usuario autenticado, login, logout, token |
| `booking.store` | Reservas y sesiones del usuario |
| `mentor.store` | Búsqueda y perfil de mentores |
| `review.store` | Reseñas del mentor |
| `notification.store` | Notificaciones en app |

---

## Seguridad

- **Contraseñas:** Hasheadas con bcrypt (salt rounds = 10) antes de persistirse. Nunca se almacena ni transmite una contraseña en texto plano.
- **Autenticación JWT:** Token firmado con clave secreta, vigencia de 7 días. El cliente lo incluye en cada petición como `Authorization: Bearer <token>`.
- **Autorización por roles:** El middleware `authorize(role)` verifica el rol en cada endpoint sensible. Rol insuficiente → respuesta `403 Forbidden`.
- **CORS estricto:** El backend acepta solicitudes únicamente desde el dominio del frontend en producción (`CORS_ORIGIN`).
- **Validación de entrada:** Express Validator sanitiza y valida todos los datos recibidos antes de procesarlos. Mitiga inyección de datos y tipos incorrectos.
- **Sin credenciales en el código:** Ninguna clave, token ni credencial está hardcodeada en el repositorio. Todo se inyecta como variable de entorno en la plataforma de despliegue.

---

## Despliegue y Variables de Entorno

### Variables del Frontend — `frontend/.env`

```env
# Producción (configurar en panel de Netlify)
VITE_API_URL=https://mentormatch-api.onrender.com

# Desarrollo local
VITE_API_URL=http://localhost:4000
```

### Variables del Backend — `backend/.env`

```env
# General
NODE_ENV=production
PORT=4000

# Base de datos
MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster.mongodb.net/mentordb

# Autenticación
JWT_SECRET=<clave secreta larga y aleatoria>
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://mentormatchpe.netlify.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=<nombre del cloud>
CLOUDINARY_API_KEY=<api key>
CLOUDINARY_API_SECRET=<api secret>

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<correo remitente>
EMAIL_PASS=<contraseña de aplicación>
```

---

## Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/mairelis-montilla/proyecto_tecnologico
cd proyecto_tecnologico

# 2. Instalar dependencias
cd frontend && npm install
cd ../backend && npm install

# 3. Configurar variables de entorno
# Crear frontend/.env y backend/.env con los valores de desarrollo (ver sección anterior)

# 4. Levantar ambos servidores en terminales separadas
cd frontend && npm run dev   # http://localhost:5173
cd backend  && npm run dev   # http://localhost:4000
```

### Scripts disponibles — Frontend

```bash
npm run dev         # Servidor de desarrollo con HMR
npm run build       # Build de producción → dist/
npm run preview     # Preview local del build generado
npm run lint        # ESLint
npm run lint:fix    # ESLint con auto-fix
npm run format      # Prettier
```

### Scripts disponibles — Backend

```bash
npm run dev         # Desarrollo con hot reload (tsx watch)
npm run build       # Compila TypeScript → dist/
npm run start       # Ejecuta dist/index.js (producción)
npm run lint        # ESLint
npm run lint:fix    # ESLint con auto-fix
npm run format      # Prettier
```

---

## Scripts de Base de Datos

Ejecutar desde la carpeta `backend/`. Solo son necesarios al configurar el entorno por primera vez o en desarrollo.

```bash
npm run seed:admin          # Crea el usuario administrador inicial
npm run seed:specialties    # Pobla el catálogo de especialidades
npm run seed:mentors        # Datos de prueba de mentores (solo desarrollo)
npm run seed:availability   # Disponibilidad de mentores de prueba
npm run complete:sessions   # Marca sesiones pasadas como completadas
```

---

## Plan de Mantenimiento

### Monitoreo

| Componente | Panel | Qué revisar |
|---|---|---|
| Frontend | Netlify → Deploys | Estado del build, errores de compilación |
| Backend | Render → Logs | Errores de runtime, tiempo de respuesta |
| Base de datos | MongoDB Atlas → Dashboard | Uso de almacenamiento (límite 512 MB), operaciones/s |
| Archivos | Cloudinary → Dashboard | Uso de almacenamiento y ancho de banda |

### Actualizaciones Periódicas

- Revisar dependencias desactualizadas cada 3 meses: `npm outdated` en frontend y backend.
- Antes de cada merge a `main`: ejecutar `npm run build` y `npm run lint` en ambos proyectos.
- Los deploys a producción son automáticos al hacer push a `main`, no se requiere intervención manual.

### Base de Datos

- MongoDB Atlas realiza backups automáticos diarios (últimas 24 horas en plan gratuito).
- Ejecutar `npm run complete:sessions` periódicamente para cerrar sesiones pasadas.
- Monitorear el uso de almacenamiento para anticipar la migración a un plan superior antes de alcanzar el límite de 512 MB.

### Rotación de Credenciales (cada 6 meses)

- Regenerar `JWT_SECRET` y actualizar la variable en Render.
- Rotar las credenciales de Cloudinary (API Key y API Secret).
- Cambiar la contraseña de aplicación del correo remitente.

### Reporte de Problemas

- Repositorio: https://github.com/mairelis-montilla/proyecto_tecnologico
- Usar la sección **Issues** de GitHub para reportar bugs o solicitar mejoras.
- Incluir en cada reporte: descripción del problema, pasos para reproducirlo, comportamiento esperado vs. observado, y capturas de pantalla.

---

## Documentación Adicional

- [Frontend README](./frontend/README.md) — Estructura, páginas, componentes, stores, servicios
- [Backend README](./backend/README.md) — Endpoints detallados, modelos, scripts, arquitectura en capas
