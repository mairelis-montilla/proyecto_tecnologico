# Frontend - MentorMatch

Aplicación web para sistema de reserva de mentorías. Construida con React, TypeScript, Vite y Tailwind CSS.

## Tecnologías

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool rápido
- **Tailwind CSS** - Framework de CSS utility-first
- **ESLint** - Linter de código
- **Prettier** - Formateador de código

## Estructura de Carpetas

```
src/
├── assets/         # Imágenes, fuentes, archivos estáticos
├── components/     # Componentes reutilizables de React
├── hooks/          # Custom React hooks
├── pages/          # Componentes de páginas/vistas
├── services/       # Servicios API y llamadas HTTP
├── styles/         # Archivos CSS globales
├── types/          # Definiciones de tipos TypeScript
├── utils/          # Funciones utilitarias
├── App.tsx         # Componente principal
└── main.tsx        # Punto de entrada
```

## Requisitos Previos

- Node.js >= 14
- Yarn o npm

## Instalación

```bash
# Instalar dependencias
yarn install

# o con npm
npm install
```

## Scripts Disponibles

```bash
# Desarrollo - Inicia servidor dev en http://localhost:3000
yarn dev

# Build - Genera build de producción
yarn build

# Preview - Vista previa del build de producción
yarn preview

# Lint - Ejecuta ESLint
yarn lint

# Lint Fix - Corrige problemas de ESLint automáticamente
yarn lint:fix

# Format - Formatea código con Prettier
yarn format

# Format Check - Verifica formato sin modificar archivos
yarn format:check
```

## Configuración

### Path Aliases

El proyecto está configurado con alias de rutas:

```typescript
import Component from '@/components/Component'
```

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=MentorMatch
```

Accede a las variables con `import.meta.env.VITE_API_URL`

## Páginas y Funcionalidades Principales

### Páginas (por implementar)
- **Home** - Página de inicio con búsqueda de mentores
- **Login/Register** - Autenticación de usuarios
- **Dashboard** - Panel según rol (estudiante/mentor)
- **Mentor Profile** - Perfil público de mentor
- **Search Results** - Resultados de búsqueda
- **Booking** - Crear reserva de mentoría
- **My Bookings** - Gestión de reservas
- **Profile Settings** - Configuración de perfil

### Componentes Principales (por implementar)
- **MentorCard** - Tarjeta de mentor
- **SearchBar** - Barra de búsqueda
- **CalendarView** - Vista de disponibilidad
- **BookingForm** - Formulario de reserva
- **ReviewCard** - Tarjeta de valoración
- **Navigation** - Barra de navegación

### Servicios API (por implementar)
- **authService** - Login, registro, logout
- **mentorService** - CRUD de mentores
- **bookingService** - Gestión de reservas
- **specialtyService** - Especialidades
- **reviewService** - Valoraciones

## Desarrollo

1. Inicia el servidor de desarrollo:
   ```bash
   yarn dev
   ```

2. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

3. Los cambios se reflejarán automáticamente con Hot Module Replacement (HMR)

## Build de Producción

```bash
# Generar build optimizado
yarn build

# Vista previa local del build
yarn preview
```

Los archivos optimizados se generarán en la carpeta `dist/`

## Estándares de Código

- Usa TypeScript para todo el código
- Sigue las reglas de ESLint configuradas
- Formatea código con Prettier antes de commit
- Usa componentes funcionales con hooks
- Nombra componentes en PascalCase
- Nombra archivos de componentes igual que el componente

## Buenas Prácticas

- Mantén componentes pequeños y enfocados
- Extrae lógica compleja a custom hooks
- Usa TypeScript interfaces para props
- Implementa manejo de errores adecuado
- Optimiza renders con React.memo cuando sea necesario
