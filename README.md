# MaryMar POS

Sistema de punto de venta (POS) y gestión financiera para el Restaurante MaryMar. Incluye ventas, menú, gastos, costos recurrentes (sueldos y pagos operativos) con seguimiento día por día, notas internas, panel financiero y administración de usuarios.

## Tecnologías

**Backend**
- Node.js + Express 5
- PostgreSQL + Prisma ORM
- JWT para autenticación, bcrypt para contraseñas

**Frontend**
- React 19 + Vite
- React Router
- Sass (SCSS)
- Axios
- lucide-react (íconos)

**Infraestructura local**
- Docker (solo para la base de datos PostgreSQL)

## Requisitos previos

- [Node.js](https://nodejs.org/) 20 o superior (probado con Node 24)
- [Docker](https://www.docker.com/) y Docker Compose (para levantar PostgreSQL)
- npm (viene con Node.js)

## Estructura del proyecto

```
marymar-pos/
├── docker-compose.yml       Levanta la base de datos PostgreSQL
├── backend/                 API en Express
│   ├── prisma/
│   │   ├── schema.prisma    Modelos de la base de datos
│   │   ├── migrations/      Historial de migraciones
│   │   └── seed.js          Datos iniciales (usuario admin, categorías, productos)
│   └── src/
│       ├── server.js        Punto de entrada del servidor
│       ├── routes/          Endpoints de la API
│       ├── middleware/      Autenticación (verificarToken, soloAdmin)
│       └── utils/           Lógica compartida (fechas, cálculos financieros)
└── frontend/                Aplicación React
    └── src/
        ├── pages/            Una carpeta por pantalla
        ├── components/       Piezas reutilizables (modales, formularios, gráficos)
        ├── api/               Funciones que llaman a la API del backend
        ├── context/           Sesión de usuario (AuthContext)
        └── styles/            Sistema de diseño (variables, mixins)
```

## Instalación y primer arranque

### 1. Base de datos (PostgreSQL vía Docker)

Desde la raíz del proyecto:

```bash
docker compose up -d
```

Esto levanta un contenedor de PostgreSQL en el puerto `5432` con los datos definidos en `docker-compose.yml` (usuario `marymar`, base `marymar_db`). El volumen `db_data` persiste los datos aunque apagues el contenedor.

Para detenerlo: `docker compose down` (los datos se conservan). Para borrar también los datos: `docker compose down -v`.

### 2. Backend

```bash
cd backend
npm install
```

Crea (o revisa) el archivo `backend/.env` con estas variables:

```
DATABASE_URL="postgresql://marymar:marymar123@localhost:5432/marymar_db"
PORT=4000
JWT_SECRET="una-clave-secreta-larga-y-unica"
```

Aplica las migraciones (crea las tablas en la base de datos):

```bash
npx prisma migrate deploy
```

(La primera vez, o si agregas nuevas migraciones en desarrollo, usa `npx prisma migrate dev` en su lugar — ver sección de comandos).

Carga los datos iniciales (usuario administrador, categorías y productos de ejemplo):

```bash
npx prisma db seed
```

Esto crea el usuario administrador:
- **Usuario:** `admin`
- **Contraseña:** `admin123`

Cámbiala luego desde Configuración → Cambiar mi contraseña.

Levanta el servidor:

```bash
npm run dev
```

El backend queda disponible en `http://localhost:4000`.

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
```

Revisa que exista `frontend/.env` con:

```
VITE_API_URL=http://localhost:4000/api
```

Levanta el servidor de desarrollo:

```bash
npm run dev
```

El frontend queda disponible en `http://localhost:5173` (o el siguiente puerto libre, ej. `5174`, si el 5173 está ocupado — Vite lo indica en la terminal).

Abre esa dirección en el navegador e inicia sesión con `admin` / `admin123`.

## Comandos disponibles

### Backend (`backend/`)

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias del backend |
| `npm run dev` | Levanta el servidor con **nodemon** (se reinicia solo al guardar cambios) |
| `node src/server.js` | Levanta el servidor una sola vez, sin reinicio automático |
| `npx prisma studio` | Abre una interfaz visual en `http://localhost:5555` para ver y editar la base de datos directamente |
| `npx prisma migrate dev --name <nombre>` | Crea y aplica una nueva migración a partir de cambios en `schema.prisma` (uso en desarrollo) |
| `npx prisma migrate deploy` | Aplica las migraciones pendientes sin crear nuevas (uso en producción / primer arranque) |
| `npx prisma db seed` | Ejecuta `prisma/seed.js` (usuario admin + datos de ejemplo) |
| `npx prisma generate` | Regenera el cliente de Prisma (normalmente automático tras cada migración) |

### Frontend (`frontend/`)

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias del frontend |
| `npm run dev` | Levanta el servidor de desarrollo de Vite con recarga en caliente |
| `npm run build` | Genera la versión de producción en `frontend/dist/` |
| `npm run preview` | Sirve localmente el resultado de `npm run build`, para probarlo antes de desplegar |
| `npm run lint` | Revisa el código con oxlint |

### Docker (raíz del proyecto)

| Comando | Qué hace |
|---|---|
| `docker compose up -d` | Levanta la base de datos PostgreSQL en segundo plano |
| `docker compose down` | Detiene el contenedor (conserva los datos) |
| `docker compose down -v` | Detiene el contenedor y **borra** los datos guardados |
| `docker compose logs -f db` | Muestra los logs de la base de datos en vivo |

## Variables de entorno

### `backend/.env`

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL (usuario, contraseña, host, puerto, nombre de la base) |
| `PORT` | Puerto donde corre la API (por defecto `4000`) |
| `JWT_SECRET` | Clave secreta para firmar los tokens de sesión (JWT). Debe ser larga y privada — nunca subirla a git |

### `frontend/.env`

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API del backend que consume el frontend |

## Base de datos: modelos principales

- **Usuario** — cuentas del sistema (rol `ADMIN` o `CAJERO`)
- **Categoria** / **Producto** — el menú del restaurante
- **Venta** / **DetalleVenta** — ventas registradas y sus platos
- **Gasto** — gastos variables puntuales
- **CostoRecurrente** — sueldos y costos operativos (diarios o mensuales)
- **PagoCostoRecurrente** — historial de pagos de esos costos
- **DiaCostoRecurrente** — estado día por día de un sueldo diario (pendiente, pagado, descontado con nota, día extra)
- **Nota** — notas internas del equipo

## Notas de seguridad

- Todas las rutas de la API (excepto `/api/auth/login` y `/api/health`) requieren un token JWT válido en el header `Authorization: Bearer <token>`.
- Las rutas administrativas (usuarios, dashboard, costos recurrentes, configuración) además exigen rol `ADMIN`.
- Las contraseñas se guardan con hash `bcrypt`, nunca en texto plano.
- `JWT_SECRET` y las credenciales de la base de datos nunca deben compartirse ni subirse a un repositorio público.
