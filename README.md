# MentorMatch - Sistema de Reserva de Mentorías

Plataforma web que conecta estudiantes con mentores especializados en diferentes áreas del conocimiento. Sistema full stack con frontend en React y backend en Node.js, ambos con TypeScript y MongoDB.

## Descripción del Proyecto

MentorMatch es una plataforma que facilita la conexión entre estudiantes que buscan orientación académica y profesional con mentores expertos en diversas disciplinas. Los estudiantes pueden explorar perfiles de mentores, ver su disponibilidad y reservar sesiones de mentoría.

Lee el [contexto completo del proyecto](./contexto.md) para más detalles sobre funcionalidades y arquitectura.

## Estructura del Proyecto

```
.
├── contexto.md        # Documentación completa del proyecto
├── frontend/          # Aplicación React + Vite + TypeScript + Tailwind
│   ├── src/
│   ├── package.json
│   └── README.md
│
└── backend/           # API Node.js + Express + TypeScript + MongoDB
    ├── src/
    │   ├── models/    # Modelos de Mongoose (User, Mentor, Booking, etc.)
    │   ├── config/    # Configuración de BD
    │   └── ...
    ├── package.json
    └── README.md
```

## Tecnologías

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- ESLint + Prettier

### Backend
- Node.js
- Express
- TypeScript
- MongoDB + Mongoose
- JWT + bcrypt
- ESLint + Prettier

## Requisitos Previos

- Node.js >= 14 (recomendado 20 LTS)
- MongoDB instalado y corriendo localmente
- Yarn o npm

## Instalación Rápida

### 1. Instalar dependencias de ambos proyectos

```bash
# Frontend
cd frontend
yarn install

# Backend
cd ../backend
yarn install
```

### 2. Configurar MongoDB

Asegúrate de que MongoDB esté corriendo:
```bash
# Windows (con MongoDB Community Server instalado)
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend/`:
```bash
cd backend
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones.

## Desarrollo

### Iniciar ambos servidores

**Terminal 1 - Frontend:**
```bash
cd frontend
yarn dev
```
El frontend estará en [http://localhost:3000](http://localhost:3000)

**Terminal 2 - Backend:**
```bash
cd backend
yarn dev
```
El backend estará en [http://localhost:4000](http://localhost:4000)

### Probar la conexión

```bash
# Health check del backend
curl http://localhost:4000/api/health
```

## Configuración

### Frontend
El frontend ya está configurado para conectarse al backend en `http://localhost:4000`.
Para cambiar esto, edita `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000
```

### Backend
Configura el backend editando `backend/.env`:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/mentordb
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
APP_NAME=MentorMatch
```

## Scripts Útiles

### Frontend
```bash
cd frontend
yarn dev          # Desarrollo
yarn build        # Build de producción
yarn preview      # Preview del build
yarn lint         # Lint
yarn lint:fix     # Fix lint
yarn format       # Formatear código
```

### Backend
```bash
cd backend
yarn dev          # Desarrollo con hot reload
yarn build        # Compilar TypeScript
yarn start        # Producción
yarn lint         # Lint
yarn lint:fix     # Fix lint
yarn format       # Formatear código
```

## Documentación

- [Frontend README](./frontend/README.md) - Documentación detallada del frontend
- [Backend README](./backend/README.md) - Documentación detallada del backend

## Funcionalidades Principales

### Para Estudiantes
- Buscar mentores por especialidad
- Ver perfiles de mentores con experiencia y calificaciones
- Reservar sesiones de mentoría
- Gestionar reservas (ver, cancelar)
- Dejar valoraciones y comentarios

### Para Mentores
- Crear y gestionar perfil profesional
- Definir especialidades y experiencia
- Configurar disponibilidad horaria
- Gestionar solicitudes de mentoría
- Ver historial de sesiones

### Para Administradores
- Aprobar cuentas de mentores
- Gestionar usuarios
- Ver estadísticas del sistema

## Modelos de Base de Datos

El backend incluye los siguientes modelos de Mongoose:
- **User**: Usuarios del sistema (estudiantes, mentores, admins)
- **Mentor**: Perfiles de mentores con especialidades
- **Specialty**: Áreas de especialización
- **Availability**: Horarios disponibles de mentores
- **Booking**: Reservas de mentorías
- **Review**: Valoraciones y comentarios

Ver [contexto.md](./contexto.md) para detalles completos del modelo de datos.

## Próximos Pasos de Desarrollo

1. **Autenticación**:
   - Implementar registro y login con JWT
   - Crear middleware de autenticación
   - Proteger rutas según rol de usuario

2. **Frontend**:
   - Implementar sistema de rutas (React Router)
   - Crear páginas: Home, Login, Register, Dashboard
   - Componentes de búsqueda y filtrado
   - Sistema de reservas
   - Gestión de perfil

3. **Backend**:
   - Endpoints de autenticación
   - CRUD de mentores y especialidades
   - Sistema de reservas
   - Validación de disponibilidad
   - Sistema de valoraciones

## Estructura Recomendada para Nuevas Features

### Frontend
```
src/
├── components/
│   └── FeatureName/
│       ├── FeatureName.tsx
│       └── index.ts
├── pages/
│   └── FeaturePage.tsx
├── services/
│   └── feature.service.ts
└── types/
    └── feature.types.ts
```

### Backend
```
src/
├── controllers/
│   └── feature.controller.ts
├── routes/
│   └── feature.routes.ts
├── services/
│   └── feature.service.ts
└── models/
    └── feature.model.ts
```

## Buenas Prácticas

- Mantén sincronizadas las interfaces TypeScript entre frontend y backend
- Usa variables de entorno para configuración
- Commitea con mensajes descriptivos
- Revisa y formatea código antes de hacer push
- Documenta funciones y componentes complejos

## Solución de Problemas

### El frontend no puede conectarse al backend
- Verifica que el backend esté corriendo en el puerto correcto
- Revisa la configuración de CORS en el backend
- Verifica la variable `VITE_API_URL` en el frontend

### Error de TypeScript
- Ejecuta `yarn install` en ambos proyectos
- Verifica que las versiones de TypeScript sean compatibles
- Revisa los archivos `tsconfig.json`

### Error de ESLint/Prettier
- Ejecuta `yarn lint:fix` y `yarn format`
- Verifica que las extensiones de VSCode estén instaladas

## Actualización de Node.js

**Nota importante**: Si tienes Node.js 16.x, considera actualizar a Node.js 20 LTS o superior para mejor compatibilidad con las herramientas modernas.

Descarga desde: [https://nodejs.org](https://nodejs.org)
