## Gestor de contenidos para Instagram y TikTok

Aplicación web pensada para desplegar en Railway que permite:

- Gestionar varias cuentas de Instagram y TikTok.
- Planificar qué contenido se sube a cada cuenta.
- Definir un calendario con fecha y hora de publicación.
- Registrar información básica de cada cuenta y del rendimiento de cada pieza de contenido.

### Arquitectura propuesta

- **Backend**: Node.js + Express + PostgreSQL (ideal para Railway).
- **Frontend**: React + Vite (UI moderna y rápida).
- **ORM/DB**: Prisma para modelar cuentas, contenidos y calendario.

### Conexión segura con Instagram y TikTok (OAuth)

La app incluye endpoints backend para conectar cuentas de forma oficial:

- `GET /api/auth/instagram/url` → genera la URL de login de Instagram para una cuenta.
- `GET /api/auth/instagram/callback` → recibe el `code`, pide el `access_token` a Instagram y lo guarda en `SocialAccount`.
- `GET /api/auth/tiktok/url` → genera la URL de login de TikTok v2.
- `GET /api/auth/tiktok/callback` → recibe el `code`, pide `access_token`/`refresh_token` a TikTok y los guarda.

Variables de entorno necesarias (añadir a `.env` y a Railway):

```bash
INSTAGRAM_CLIENT_ID=...
INSTAGRAM_CLIENT_SECRET=...
INSTAGRAM_REDIRECT_URI=https://TU-PROYECTO.up.railway.app/api/auth/instagram/callback

TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
TIKTOK_REDIRECT_URI=https://TU-PROYECTO.up.railway.app/api/auth/tiktok/callback
```

En el panel de cuentas verás botones **Conectar IG / Conectar TikTok** que abren los flujos oficiales de login.

### Aviso importante sobre APIs oficiales

La publicación automática real en Instagram y TikTok requiere:

- Cuentas Business / Developer.
- Configurar apps en Meta/TikTok, OAuth y permisos.

En esta primera versión dejaremos:

- Gestión de cuentas, contenidos y calendario desde la interfaz.
- Campos preparados para almacenar tokens de API.
- Puntos de integración listos para que añadas tus credenciales oficiales más adelante.

### Puesta en marcha local (una vez instaladas dependencias)

```bash
npm install
npm run dev
```

### Despliegue en Railway

1. Crea un nuevo proyecto en Railway y selecciona este repositorio.
2. Añade un servicio de PostgreSQL y copia la `DATABASE_URL`.
3. Configura la variable de entorno `DATABASE_URL` en el servicio Node.
4. Ejecuta las migraciones de Prisma (lo automatizaremos en los scripts de `package.json`).
5. Despliega; la app servirá el API y la SPA de React desde el mismo servicio.

