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

