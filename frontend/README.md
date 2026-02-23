# Frontend — MentorMatch

Aplicación web desplegada en Netlify. Construida con React 18, TypeScript, Vite y Tailwind CSS.

- **URL producción:** https://mentormatchpe.netlify.app/
- **Backend API:** https://mentormatch-api.onrender.com
- **Repositorio:** https://github.com/mairelis-montilla/proyecto_tecnologico

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| React 18 | UI library |
| TypeScript 5 | Tipado estático |
| Vite 5 | Build tool y dev server |
| Tailwind CSS 3 | Estilos utility-first |
| React Router 6 | Navegación SPA |
| Zustand | Estado global |
| Axios | HTTP client |
| Lucide React | Iconos |
| React Hot Toast | Notificaciones UI |

---

## Estructura de Carpetas

```
src/
├── components/
│   ├── Layout/             # Header, Sidebar, layouts por rol
│   ├── booking/            # Formularios y cards de reservas
│   ├── mentor/             # Cards y perfiles de mentores
│   ├── notifications/      # Dropdown de notificaciones
│   └── ui/                 # Componentes genéricos
│
├── pages/
│   ├── Dashboard.tsx               # Dashboard estudiante/mentor
│   ├── MentorSearch.tsx            # Búsqueda de mentores
│   ├── MentorProfile.tsx           # Perfil público del mentor
│   ├── StudentBookings.tsx         # Mis reservas (estudiante)
│   ├── MentorSessions.tsx          # Mis sesiones (mentor)
│   ├── MentorReviewsPage.tsx       # Mis reseñas (mentor)
│   ├── StudentMyPayments.tsx       # Mis pagos (estudiante)
│   ├── MentorEarnings.tsx          # Mis ingresos (mentor)
│   ├── ProfilePage.tsx             # Perfil editable
│   ├── AdminDashboard.tsx          # Panel admin
│   ├── AdminUserManagement.tsx     # Gestión de usuarios
│   ├── AdminAproveMentors.tsx      # Aprobación de mentores
│   ├── AdminPaymentValidation.tsx  # Validación de pagos
│   └── AdminTransactions.tsx       # Transacciones
│
├── services/               # Llamadas HTTP a la API
├── stores/                 # Estado global con Zustand
├── types/                  # Interfaces TypeScript
├── utils/                  # Helpers (avatar, fechas, etc.)
├── App.tsx                 # Rutas y providers
└── main.tsx                # Punto de entrada
```

---

## Despliegue en Netlify

**Plataforma:** Netlify (plan gratuito con CDN global)

| Parámetro | Valor |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Auto-deploy | Sí, desde rama `main` |

### Variables de Entorno (Netlify)

```env
VITE_API_URL=https://mentormatch-api.onrender.com
```

### Redirecciones SPA — `netlify.toml`

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Este archivo es necesario para que React Router funcione correctamente al refrescar la página o acceder directamente a una ruta.

---

## Variables de Entorno para Desarrollo Local

Crea `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000
```

---

## Scripts Disponibles

```bash
npm run dev         # Servidor de desarrollo (http://localhost:5173)
npm run build       # Build de producción → dist/
npm run preview     # Preview local del build
npm run lint        # ESLint
npm run lint:fix    # ESLint con auto-fix
npm run format      # Prettier
```

---

## Rutas de la Aplicación

### Públicas
| Ruta | Página |
|---|---|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Registro de usuario |

### Protegidas — Estudiante
| Ruta | Página |
|---|---|
| `/dashboard` | Dashboard con estadísticas |
| `/search` | Búsqueda de mentores |
| `/mentor/:id` | Perfil público del mentor |
| `/bookings` | Mis reservas |
| `/my-payments` | Mis pagos e historial |
| `/profile` | Mi perfil |

### Protegidas — Mentor
| Ruta | Página |
|---|---|
| `/dashboard` | Dashboard con métricas |
| `/sessions` | Mis sesiones |
| `/reviews` | Mis reseñas |
| `/earnings` | Mis ingresos |
| `/profile` | Mi perfil |

### Protegidas — Admin
| Ruta | Página |
|---|---|
| `/admin/dashboard` | Panel con métricas globales |
| `/admin/users` | Gestión de usuarios |
| `/admin/mentors` | Aprobación de mentores |
| `/admin/payments` | Validación de comprobantes |
| `/admin/transactions` | Historial de transacciones |

---

## Estado Global (Zustand Stores)

| Store | Descripción |
|---|---|
| `auth.store` | Usuario autenticado, login, logout |
| `booking.store` | Reservas y sesiones |
| `mentor.store` | Búsqueda y perfil de mentores |
| `review.store` | Reseñas del mentor |
| `notification.store` | Notificaciones en app |

---

## Servicios API

| Servicio | Endpoints consumidos |
|---|---|
| `auth.service` | `/auth/*` |
| `mentor.service` | `/mentors/*` |
| `booking.service` | `/bookings/*` |
| `review.service` | `/reviews/*` |
| `payment.service` | `/payments/*` |
| `availability.service` | `/availability/*` |
| `specialty.service` | `/specialties/*` |
| `notification.service` | `/notifications/*` |
| `admin.service` | `/admin/*` |

---

## Protección de Rutas

Las rutas están protegidas con el componente `ProtectedRoute`:

```tsx
<ProtectedRoute allowedRoles={['student']}>
  <StudentMyPayments />
</ProtectedRoute>
```

Si el usuario no está autenticado, redirige a `/login`.
Si está autenticado pero no tiene el rol requerido, redirige al dashboard correspondiente.

---

## Convenciones de Código

- Componentes en PascalCase: `MentorCard.tsx`
- Servicios en camelCase: `mentor.service.ts`
- Stores: `feature.store.ts`
- Tipos: `feature.types.ts`
- Usar `@/` para imports absolutos desde `src/`
- Componentes funcionales con hooks, sin class components

---

## Plan de Mantenimiento

- El deploy es automático al hacer `push` a `main`
- Verificar en el panel de Netlify que el build pase sin errores tras cada merge
- Revisar el tab "Deploy previews" de Netlify para PRs antes de mergear
- Actualizar dependencias con `npm outdated` cada trimestre
- Si el backend (Render) está dormido, la primera carga puede tardar ~30 s
