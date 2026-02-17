# API Endpoints - Administracion

Todos los endpoints de admin requieren:
- Header: `Authorization: Bearer <token_admin>`
- El usuario debe tener rol `admin`

Base URL: `http://localhost:4000/api`

---

## 1. Gestion de Usuarios

### GET /api/admin/users - Listar usuarios con filtros

**Query Parameters:**

| Parametro | Tipo   | Requerido | Descripcion                                      |
|-----------|--------|-----------|--------------------------------------------------|
| page      | number | No        | Pagina (default: 1)                              |
| limit     | number | No        | Items por pagina (default: 10, max: 50)          |
| role      | string | No        | Filtrar por rol: `student`, `mentor`, `admin`    |
| status    | string | No        | Filtrar por estado: `active`, `blocked`, `inactive` |
| search    | string | No        | Buscar por nombre o email (min 2 caracteres)     |
| sortBy    | string | No        | Ordenar por: `createdAt`, `firstName`, `lastName`, `email`, `role` |
| sortOrder | string | No        | Orden: `asc` o `desc` (default: `desc`)          |

**Ejemplo de llamada:**

```javascript
// Listar todos los usuarios
const res = await fetch('/api/admin/users', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Con filtros
const res = await fetch('/api/admin/users?role=student&status=active&page=1&limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Busqueda por nombre o email
const res = await fetch('/api/admin/users?search=juan&role=mentor', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Respuesta exitosa (200):**

```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "_id": "665abc123...",
        "email": "juan@email.com",
        "firstName": "Juan",
        "lastName": "Perez",
        "role": "student",
        "avatar": "https://res.cloudinary.com/...",
        "isActive": true,
        "isEmailVerified": true,
        "isBlocked": false,
        "blockReason": null,
        "blockedAt": null,
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 48,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### GET /api/admin/users/:id - Detalle de usuario

**Ejemplo de llamada:**

```javascript
const res = await fetch('/api/admin/users/665abc123...', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Respuesta exitosa (200):**

```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "665abc123...",
      "email": "juan@email.com",
      "firstName": "Juan",
      "lastName": "Perez",
      "role": "student",
      "avatar": null,
      "isActive": true,
      "isEmailVerified": true,
      "isBlocked": false,
      "blockReason": null,
      "blockedAt": null,
      "createdAt": "2025-01-15T10:00:00.000Z"
    },
    "profile": {
      "_id": "665def456...",
      "userId": "665abc123...",
      "bio": "Estudiante de ingenieria",
      "institution": "ISIL",
      "career": "Ingenieria de Software",
      "semester": 6,
      "interests": [
        { "_id": "...", "name": "React", "category": "Frontend" }
      ],
      "totalSessions": 3
    }
  }
}
```

---

### PATCH /api/admin/users/:id - Actualizar usuario

**Body (JSON):**

| Campo     | Tipo    | Requerido | Descripcion                           |
|-----------|---------|-----------|---------------------------------------|
| firstName | string  | No        | Nombre (2-50 caracteres)              |
| lastName  | string  | No        | Apellido (2-50 caracteres)            |
| role      | string  | No        | Nuevo rol: `student`, `mentor`, `admin` |
| isActive  | boolean | No        | Activar/desactivar cuenta             |

**Ejemplo de llamada:**

```javascript
// Cambiar rol de usuario
const res = await fetch('/api/admin/users/665abc123...', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    role: 'mentor'
  })
});

// Editar datos basicos
const res = await fetch('/api/admin/users/665abc123...', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'Juan Carlos',
    lastName: 'Perez Lopez'
  })
});
```

**Respuesta exitosa (200):**

```json
{
  "status": "success",
  "message": "Usuario actualizado exitosamente",
  "data": {
    "user": {
      "_id": "665abc123...",
      "email": "juan@email.com",
      "firstName": "Juan Carlos",
      "lastName": "Perez Lopez",
      "role": "mentor",
      "isActive": true
    }
  }
}
```

**Nota:** Un admin no puede cambiar su propio rol.

---

### PATCH /api/admin/users/:id/block - Bloquear usuario

**Body (JSON):**

| Campo  | Tipo   | Requerido | Descripcion                           |
|--------|--------|-----------|---------------------------------------|
| reason | string | Si        | Motivo del bloqueo (5-500 caracteres) |

**Ejemplo de llamada:**

```javascript
const res = await fetch('/api/admin/users/665abc123.../block', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'Comportamiento inapropiado en sesiones de mentoria'
  })
});
```

**Respuesta exitosa (200):**

```json
{
  "status": "success",
  "message": "Usuario bloqueado exitosamente",
  "data": {
    "user": {
      "_id": "665abc123...",
      "email": "juan@email.com",
      "firstName": "Juan",
      "lastName": "Perez",
      "isBlocked": true,
      "blockReason": "Comportamiento inapropiado en sesiones de mentoria",
      "blockedAt": "2025-06-01T15:30:00.000Z"
    }
  }
}
```

**Efectos del bloqueo:**
- El usuario NO puede iniciar sesion (recibe error 403 con codigo `USER_BLOCKED`)
- Si tiene un token activo, cualquier request autenticada retorna 403
- Se registra en el historial de bloqueos

---

### PATCH /api/admin/users/:id/unblock - Desbloquear usuario

**Body (JSON):**

| Campo  | Tipo   | Requerido | Descripcion                              |
|--------|--------|-----------|------------------------------------------|
| reason | string | Si        | Motivo del desbloqueo (5-500 caracteres) |

**Ejemplo de llamada:**

```javascript
const res = await fetch('/api/admin/users/665abc123.../unblock', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'Se reviso el caso y se determino que fue un malentendido'
  })
});
```

**Respuesta exitosa (200):**

```json
{
  "status": "success",
  "message": "Usuario desbloqueado exitosamente",
  "data": {
    "user": {
      "_id": "665abc123...",
      "isBlocked": false,
      "blockReason": null,
      "blockedAt": null
    }
  }
}
```

---

### GET /api/admin/users/:id/block-history - Historial de bloqueos

**Ejemplo de llamada:**

```javascript
const res = await fetch('/api/admin/users/665abc123.../block-history', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Respuesta exitosa (200):**

```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "665abc123...",
      "firstName": "Juan",
      "lastName": "Perez",
      "email": "juan@email.com"
    },
    "history": [
      {
        "_id": "666aaa...",
        "userId": "665abc123...",
        "action": "unblock",
        "reason": "Se reviso el caso y se determino que fue un malentendido",
        "adminId": {
          "_id": "664admin...",
          "firstName": "Admin",
          "lastName": "Principal",
          "email": "admin@mentormatch.com"
        },
        "createdAt": "2025-06-02T10:00:00.000Z"
      },
      {
        "_id": "666bbb...",
        "userId": "665abc123...",
        "action": "block",
        "reason": "Comportamiento inapropiado en sesiones de mentoria",
        "adminId": {
          "_id": "664admin...",
          "firstName": "Admin",
          "lastName": "Principal",
          "email": "admin@mentormatch.com"
        },
        "createdAt": "2025-06-01T15:30:00.000Z"
      }
    ]
  }
}
```

---

## 2. Login - Mensaje de usuario bloqueado

Cuando un usuario bloqueado intenta hacer login, recibe:

**POST /api/auth/login**

```javascript
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'juan@email.com',
    password: 'password123'
  })
});
```

**Respuesta de usuario bloqueado (403):**

```json
{
  "status": "error",
  "message": "Tu cuenta ha sido bloqueada. Motivo: Comportamiento inapropiado en sesiones de mentoria",
  "code": "USER_BLOCKED"
}
```

**Para el front:** Pueden verificar `code === 'USER_BLOCKED'` para mostrar un mensaje personalizado.

---

## 3. Historial de Transacciones (Pagos)

### GET /api/admin/payments - Listar pagos con filtros avanzados

**Query Parameters:**

| Parametro     | Tipo   | Requerido | Descripcion                                                           |
|---------------|--------|-----------|-----------------------------------------------------------------------|
| page          | number | No        | Pagina (default: 1)                                                   |
| limit         | number | No        | Items por pagina (default: 20, max: 50)                               |
| status        | string | No        | `pending_proof`, `pending_validation`, `validated`, `rejected`, `refunded` |
| dateFrom      | string | No        | Fecha inicio (ISO8601, ej: `2025-01-01`)                              |
| dateTo        | string | No        | Fecha fin (ISO8601, ej: `2025-12-31`)                                 |
| search        | string | No        | Buscar por nombre o email de estudiante/mentor (min 2 chars)          |
| paymentMethod | string | No        | `yape`, `plin`, `transfer`, `cash`                                    |

**Ejemplos de llamada:**

```javascript
// Todos los pagos
const res = await fetch('/api/admin/payments', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Filtrar por estado y fecha
const res = await fetch('/api/admin/payments?status=validated&dateFrom=2025-01-01&dateTo=2025-06-30', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Buscar por nombre de usuario
const res = await fetch('/api/admin/payments?search=maria&paymentMethod=yape', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Respuesta exitosa (200):**

```json
{
  "status": "success",
  "data": {
    "payments": [
      {
        "_id": "667pay...",
        "bookingId": {
          "_id": "667book...",
          "scheduledAt": "2025-06-15T14:00:00.000Z",
          "duration": 60,
          "topic": "React Hooks avanzados",
          "status": "confirmed",
          "totalAmount": 50,
          "studentId": {
            "userId": {
              "firstName": "Maria",
              "lastName": "Garcia",
              "email": "maria@email.com"
            }
          },
          "mentorId": {
            "userId": {
              "firstName": "Carlos",
              "lastName": "Lopez",
              "email": "carlos@email.com"
            },
            "hourlyRate": 50,
            "title": "Senior Developer"
          }
        },
        "amount": 50,
        "currency": "PEN",
        "paymentMethod": "yape",
        "status": "validated",
        "proofImage": "https://res.cloudinary.com/...",
        "platformFee": 5,
        "mentorEarnings": 45,
        "createdAt": "2025-06-10T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### GET /api/admin/payments/summary - Resumen financiero

**Ejemplo de llamada:**

```javascript
const res = await fetch('/api/admin/payments/summary', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Respuesta exitosa (200):**

```json
{
  "status": "success",
  "data": {
    "summary": {
      "totalRecaudado": 5000,
      "totalPendientes": 800,
      "totalRechazados": 150,
      "totalReembolsados": 200,
      "totalPlatformFees": 500,
      "totalMentorEarnings": 4500,
      "countValidated": 100,
      "countPending": 16,
      "countRejected": 3,
      "countRefunded": 4,
      "totalTransactions": 123
    }
  }
}
```

**Descripcion de campos:**

| Campo               | Descripcion                                      |
|---------------------|--------------------------------------------------|
| totalRecaudado      | Monto total de pagos validados                   |
| totalPendientes     | Monto total de pagos pendientes                  |
| totalRechazados     | Monto total de pagos rechazados                  |
| totalReembolsados   | Monto total de reembolsos                        |
| totalPlatformFees   | Total ganado por la plataforma (10%)             |
| totalMentorEarnings | Total pagado a mentores (90%)                    |
| countValidated      | Cantidad de pagos validados                      |
| countPending        | Cantidad de pagos pendientes                     |
| countRejected       | Cantidad de pagos rechazados                     |
| countRefunded       | Cantidad de reembolsos                           |
| totalTransactions   | Total de transacciones                           |

---

### GET /api/admin/payments/export - Exportar pagos a CSV

**Query Parameters:** Los mismos filtros que GET /api/admin/payments (status, dateFrom, dateTo)

**Ejemplo de llamada:**

```javascript
// Exportar todos
const res = await fetch('/api/admin/payments/export', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const blob = await res.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'pagos.csv';
a.click();

// Exportar filtrado por fecha y estado
const res = await fetch('/api/admin/payments/export?status=validated&dateFrom=2025-01-01&dateTo=2025-06-30', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Respuesta:** Archivo CSV descargable con columnas:
- ID, Fecha, Estado, Monto, Moneda, Metodo de Pago, Comision Plataforma, Ganancias Mentor, Estudiante, Email Estudiante, Mentor, Email Mentor, Tema, Motivo Rechazo

---

## Resumen de todos los endpoints nuevos

| Metodo | Endpoint                              | Descripcion                         |
|--------|---------------------------------------|-------------------------------------|
| GET    | /api/admin/users                      | Listar usuarios con filtros         |
| GET    | /api/admin/users/:id                  | Detalle de un usuario               |
| PATCH  | /api/admin/users/:id                  | Actualizar datos / cambiar rol      |
| PATCH  | /api/admin/users/:id/block            | Bloquear usuario                    |
| PATCH  | /api/admin/users/:id/unblock          | Desbloquear usuario                 |
| GET    | /api/admin/users/:id/block-history    | Historial de bloqueos               |
| GET    | /api/admin/payments                   | Listar pagos (filtros avanzados)    |
| GET    | /api/admin/payments/summary           | Resumen financiero                  |
| GET    | /api/admin/payments/export            | Exportar pagos a CSV                |
| GET    | /api/admin/payments/pending           | Pagos pendientes (ya existia)       |
| PATCH  | /api/admin/payments/:id/approve       | Aprobar pago (ya existia)           |
| PATCH  | /api/admin/payments/:id/reject        | Rechazar pago (ya existia)          |

---

## Codigos de error comunes

| Codigo | Significado                                    |
|--------|------------------------------------------------|
| 400    | Datos invalidos / validacion fallida           |
| 401    | No autenticado (token faltante o invalido)     |
| 403    | Sin permisos (no es admin) o usuario bloqueado |
| 404    | Recurso no encontrado                          |
| 500    | Error interno del servidor                     |

## Modelo BlockHistory (nuevo)

```
{
  userId:    ObjectId (ref: User)
  action:    'block' | 'unblock'
  reason:    String (requerido, max 500)
  adminId:   ObjectId (ref: User)
  createdAt: Date
  updatedAt: Date
}
```

## Campos nuevos en modelo User

```
{
  ...campos existentes,
  isBlocked:   Boolean (default: false)
  blockReason: String (max 500, null cuando no bloqueado)
  blockedAt:   Date (null cuando no bloqueado)
}
```
