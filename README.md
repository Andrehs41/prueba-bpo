# Multi-Tenant Micro-Architecture — Slice Vertical

Prueba técnica Full-Stack (Concept BPO). Demuestra **aislamiento de datos**,
**control de acceso por roles**, **gestión de estado global** y el uso de
**interceptores y middlewares** como abstracciones centralizadas (DRY).

## Stack

| Capa      | Tecnología                                                        |
|-----------|-------------------------------------------------------------------|
| Backend   | Node.js + Express + TypeScript, driver nativo **mysql2**          |
| Base datos| **MySQL 8** (vía Docker Compose)                                  |
| Auth      | JWT (`jsonwebtoken`) + `bcryptjs`                                 |
| Frontend  | React + **Vite** + TypeScript                                     |
| Routing   | react-router-dom v6                                               |
| Estado    | Redux Toolkit + react-redux                                       |
| Red       | Axios (instancia con request interceptor)                         |

## Estructura del proyecto

```
prueba-bpo/
├── docker-compose.yml         # MySQL 8 + montaje del init.sql
├── backend/
│   ├── db/init.sql            # esquema + data dummy (migración)
│   └── src/
│       ├── config/            # env tipado + pool mysql2
│       ├── middlewares/       # identifyTenant, checkAuth, errorHandler
│       ├── services/          # acceso a datos (tenant, user, records)
│       ├── controllers/       # auth, records
│       ├── routes/            # /api/v1 (auth, records)
│       ├── utils/             # AppError, asyncHandler
│       ├── types/             # augment de Express (req.tenant, req.user)
│       ├── app.ts             # ensamblado de Express
│       └── server.ts          # bootstrap
└── frontend/
    └── src/
        ├── api/axios.ts       # instancia Axios + interceptor X-Tenant-ID
        ├── app/               # store, hooks tipados, resetAction
        ├── features/          # tenantSlice, authSlice, recordsSlice
        ├── components/        # ProtectedLayout (route guard), RecordsTable
        ├── hooks/             # useDebounce
        └── pages/             # Login, Dashboard
```

## Requisitos previos

- **Node.js** ≥ 18 (probado con v24)
- **Docker Desktop** (para MySQL). *Alternativa:* un MySQL local — ver más abajo.

---

## Levantar el proyecto desde cero

### 1. Base de datos (Docker)

Desde la raíz del repo:

```bash
docker compose up -d
```

Esto levanta MySQL 8 en el **puerto host 3307** (→ 3306 del contenedor) y ejecuta
automáticamente `backend/db/init.sql` la primera vez, creando las tablas
`tenants`, `users`, `records` y cargando la data dummy.

> El puerto host es **3307** para no chocar con un MySQL local en 3306.
> Si quieres usar otro, ajusta `docker-compose.yml` y `backend/.env`.

Verificar:
```bash
docker exec bpo_mysql mysql -ubpo_user -pbpo_pass multitenant -e "SELECT slug FROM tenants;"
```

#### Alternativa sin Docker
Si tienes MySQL instalado localmente, crea la BD y ejecuta el script:
```bash
mysql -u root -p < backend/db/init.sql
```
y ajusta `backend/.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`).

### 2. Backend

```bash
cd backend
cp .env.example .env      # en Windows PowerShell: Copy-Item .env.example .env
npm install
npm run dev               # http://localhost:4000
```

`npm run build` compila a `dist/` y `npm start` corre la versión compilada.

### 3. Frontend

```bash
cd frontend
cp .env.example .env      # en Windows PowerShell: Copy-Item .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Abre **http://localhost:5173** → te redirige a `/login`.

---

## Credenciales de prueba (data dummy)

Hay **6 empresas** sembradas. En el login se eligen desde un selector (cargado
con `GET /tenants`). El patrón de correos es `admin@<slug>.com` y
`usuario@<slug>.com`. Contraseñas: **ADMIN → `admin123`**, **USER → `user123`**.

| Empresa                       | slug                      | Usuarios sembrados        |
|-------------------------------|---------------------------|---------------------------|
| Distribuidora Andina S.A.S.   | `distribuidora-andina`    | admin + usuario           |
| Café Monteverde               | `cafe-monteverde`         | admin + usuario           |
| Transportes Rápidos Ltda.     | `transportes-rapidos`     | admin + usuario           |
| Clínica Vida Sana             | `clinica-vida-sana`       | admin                     |
| Constructora Horizonte        | `constructora-horizonte`  | admin                     |
| Moda Urbana                   | `moda-urbana`             | admin                     |

Ejemplo: `admin@distribuidora-andina.com` / `admin123`.
Tras el login se navega a `/:tenantSlug/dashboard`
(p. ej. `/distribuidora-andina/dashboard`).

---

## API (Backend)

Base: `http://localhost:4000/api/v1`

| Método | Ruta            | Auth                 | Descripción                                            |
|--------|-----------------|----------------------|--------------------------------------------------------|
| GET    | `/health`       | —                    | Healthcheck                                            |
| GET    | `/tenants`      | — (público)          | Lista de empresas (id/slug/name) para el selector      |
| POST   | `/auth/login`   | `X-Tenant-ID`        | Login dentro del tenant; devuelve JWT                  |
| GET    | `/records`      | JWT + `X-Tenant-ID`  | Lista records **solo del tenant** (`?limit=&offset=`)  |
| POST   | `/records`      | JWT (ADMIN) + tenant | Crea record vinculado al tenant automáticamente        |

Todas las peticiones a `/records` y `/auth/login` requieren la cabecera
**`X-Tenant-ID`** (acepta el *slug* o el *id* numérico del tenant).

### Ejemplo

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" -H "X-Tenant-ID: distribuidora-andina" \
  -d '{"email":"admin@distribuidora-andina.com","password":"admin123"}' | jq -r .token)

# Listar records del tenant (paginado)
curl "http://localhost:4000/api/v1/records?limit=5&offset=0" \
  -H "X-Tenant-ID: distribuidora-andina" -H "Authorization: Bearer $TOKEN"
```

---

## Decisiones de arquitectura (cómo se cumplen los criterios)

### Seguridad y aislamiento dinámico
- **El backend gobierna la seguridad.** `tenant_id` se inyecta *siempre* desde
  el contexto del servidor (`req.tenant`), nunca desde el body o query del
  cliente. Las queries de `records` filtran por `tenant_id` obligatoriamente.
- **`identifyTenant`** lee `X-Tenant-ID`, valida el tenant contra la BD y
  adjunta `req.tenant`. Si no existe → `404`.
- **`checkAuth`** valida el JWT y comprueba que `token.tenantId === req.tenant.id`.
  Un token válido de un tenant **no** sirve para otro aunque se cambie el header
  (responde `403`). También aplica control por rol (`POST /records` solo ADMIN).
- Cambiar el `:tenantSlug` en la URL del frontend no da acceso: el *route guard*
  redirige a `/login`, y aunque se manipule el cliente, el backend rechaza.

### Estado global (Redux Toolkit) y anti *data-bleeding*
- `tenantSlice` guarda el tenant activo; `authSlice` el token/usuario;
  `recordsSlice` los datos.
- **Reset global:** la acción `resetStore` (`app/reset`) es interceptada por el
  *root reducer*, que pasa `undefined` a todos los slices para reconstruir su
  `initialState`. Se dispara en **logout** y al **entrar a `/login`**,
  garantizando que no queden datos del tenant anterior en memoria.

### Interceptor de Axios (DRY)
- Una única instancia (`src/api/axios.ts`) con un *request interceptor* que
  inyecta `X-Tenant-ID` (desde el estado global) y `Authorization` en cada
  petición. El store se inyecta con `injectStore(store)` para evitar imports
  circulares y leer siempre el estado vivo.

### Optimización de renderizado
- Filtro local de la tabla con **debounce** (`useDebounce`, 300 ms) +
  **`useMemo`** para no recalcular el filtrado en cada tecla.
- `RecordsTable` envuelto en **`React.memo`** para re-renderizar solo cuando
  cambia la referencia de los datos.

---

## Notas
- Puerto MySQL host: **3307**. Backend: **4000**. Frontend: **5173**.
- Para detener la BD: `docker compose down` (añade `-v` para borrar los datos y
  forzar que `init.sql` vuelva a ejecutarse).
