# Frontend · Organizador de Eventos Independientes

SPA del Miniproyecto 1 de Proyecto Integrador I (750018C). Grupo 2, Universidad del Valle,
semestre 2026-2.

## Stack

- React con Vite
- React Router
- Desplegado en Vercel

## Arranque local

```bash
git clone https://github.com/pi1-grupo2/frontend.git
cd frontend

npm install
cp .env.example .env       # apuntar VITE_API_URL a la API
npm run dev
```

Queda en http://localhost:5173. El pie de página muestra si la API responde y si la base de datos
está viva.

## Rutas

Son las que define la arquitectura de información del Sprint 0. Hoy son pantallas vacías: el
criterio C7 pide que la SPA corra, no que las vistas estén implementadas.

| Ruta | Para qué | Entra en |
| --- | --- | --- |
| `/` | Redirige automáticamente a `/hoy` | Navegación general |
| `/login` | Autenticación con correo y contraseña | Sprint 2 |
| `/registro` | Registro de nuevos organizadores | Sprint 2 |
| `/hoy` | Consultar y gestionar tareas urgentes, vencidas y próximas | Sprints 2 y 3 |
| `/crear` | Crear evento y planificación inicial de subtareas | Sprint 1 |
| `/eventos` | Listado y gestión de eventos | Sprints 1 y 4 |
| `/evento/:id` | Detalle, edición, reprogramación y gestión de subtareas | Sprints 1 y 3 |
| `/configuracion` | Configuración de la aplicación | Transversal |
| `/progreso` | Redirige automáticamente a `/eventos` | Sprint 4 |
| `*` | Muestra un mensaje cuando la ruta no existe | Transversal |

## Variables de entorno

| Variable | Para qué sirve |
| --- | --- |
| `VITE_API_URL` | URL base de la API, terminada en `/api` |

En Vite solo las variables con prefijo `VITE_` llegan al navegador, y por eso mismo quedan visibles
en el bundle que descarga el usuario. Nunca poner secretos ahí.

## Sobre `vercel.json`

Contiene una reescritura que manda todas las rutas a `index.html`. Sin eso, entrar directo a `/hoy`
o recargar esa página devuelve 404 en Vercel, porque el servidor busca un archivo que no existe. En
una SPA el enrutamiento lo resuelve el navegador, no el servidor.

## Accesibilidad

C.E.5 es competencia evaluada y TS-06 dice que la accesibilidad es transversal desde temprano. El
esqueleto ya trae `lang="es"`, enlace para saltar al contenido, foco visible con `:focus-visible`,
la ruta activa marcada con negrita además del color, y `role="status"` en el bloque que cambia solo.

Al reemplazar los estilos, conservar el bloque de foco visible.

## Convenciones de trabajo

- Commits en formato Conventional Commits
- Ramas: `feature/<descripcion>-<iniciales>`
- `main` está protegida. Nada entra sin pull request aprobado por otra persona
- Los comentarios del PR se resuelven antes de fusionar

## Despliegue

| Entorno | URL |
| --- | --- |
| Frontend en producción | https://pi1-grupo2-frontend.vercel.app/login |
| API | https://pi1-grupo2-api.onrender.com/api/docs/ |

## Estado

Sprint 0. Base técnica operativa (TS-01). Las vistas entran desde el Sprint 1.
