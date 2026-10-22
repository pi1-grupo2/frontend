# Frontend · EvenFlow — Organizador de Eventos Independientes

Aplicación web de una sola página (SPA) del Miniproyecto 1 de Proyecto Integrador I (750018C), Grupo 2, Universidad del Valle, semestre 2026-2.

EvenFlow permite organizar eventos y gestionar sus actividades, fechas, horas estimadas y progreso, con el objetivo de facilitar la planificación y detectar posibles sobrecargas en la jornada.

## Stack tecnológico

- **React** para la construcción de la interfaz.
- **Vite** como herramienta de desarrollo y compilación.
- **React Router** para la navegación entre vistas.
- **JavaScript y CSS** para la lógica y los estilos de la aplicación.
- **API REST** para la comunicación con el backend.
- **Vercel** para el despliegue del frontend.

## Requisitos previos

- Node.js y npm instalados.
- Acceso al repositorio del frontend.
- Backend disponible para probar las funcionalidades que requieren comunicación con la API.

## Arranque local

Clona el repositorio e instala las dependencias:

```bash
git clone https://github.com/pi1-grupo2/frontend.git
cd frontend
npm install
```

Configura las variables de entorno creando un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Si se utiliza un backend desplegado, reemplaza la URL por la dirección base correspondiente de la API.

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Vite mostrará en la terminal la dirección local de la aplicación, normalmente:

http://localhost:5173

## Rutas de la aplicación

| Ruta | Descripción |
|---|---|
| `/hoy` | Consulta las gestiones del día, las actividades vencidas y las próximas. Incluye organización de actividades y acciones de gestión según la implementación disponible. |
| `/crear` | Formulario para crear un evento y registrar sus datos y actividades iniciales. |
| `/evento/:id` | Consulta y gestión de un evento específico, incluida la edición y reprogramación de actividades cuando están disponibles. |
| `/progreso` | Consulta el avance de los eventos y sus actividades. |
| `/login` | Acceso a la aplicación mediante autenticación, según la configuración del backend. |

## Funcionalidades

### Gestión de eventos y actividades

- Creación y consulta de eventos.
- Registro y gestión de actividades o subtareas.
- Consulta del detalle de cada evento.
- Edición y reprogramación de actividades, de acuerdo con las operaciones disponibles en la API.

### Vista Hoy y organización de la jornada

- Organización de las actividades según su estado y fecha.
- Identificación de actividades vencidas y próximas.
- Visualización de información relevante para priorizar el trabajo diario.
- Manejo de situaciones de sobrecarga diaria y acciones para resolverlas, según la integración disponible con el backend.

### Seguimiento del progreso

- Consulta del avance de los eventos.
- Visualización del estado de las actividades para facilitar el seguimiento de la planificación.

### Manejo de errores y estados de interfaz

La interfaz contempla estados de carga, errores y confirmaciones en las operaciones que lo requieren. Las respuestas de la API determinan los resultados de las operaciones y las validaciones que se muestran al usuario.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend, terminada en `/api`. |

Vite expone al navegador las variables cuyo nombre comienza por `VITE_`. Por lo tanto, no deben incluirse contraseñas, tokens privados ni otras credenciales secretas en estas variables.

El archivo `.env` local no debe subirse al repositorio si contiene información privada. Se recomienda mantener un `.env.example` con las variables necesarias y valores de ejemplo no sensibles.

## Enrutamiento de la SPA

El archivo `vercel.json` debe mantener la configuración necesaria para que las rutas de React Router funcionen al acceder directamente a una URL o recargar una vista desplegada.

En una SPA, React Router administra la navegación en el navegador. El servidor debe redirigir las rutas de la aplicación a `index.html` para evitar respuestas 404 al acceder directamente a rutas como `/hoy` o `/evento/:id`.

## Accesibilidad

La accesibilidad es un aspecto transversal del desarrollo de EvenFlow y forma parte de los criterios de evaluación del proyecto.

Se debe conservar y verificar, según la implementación actual:

- Idioma español declarado en el documento HTML.
- Enlace para saltar al contenido principal.
- Indicadores de foco visibles para la navegación con teclado.
- Identificación de la ruta activa sin depender exclusivamente del color.
- Uso adecuado de regiones y mensajes de estado accesibles.
- Etiquetas y controles comprensibles para formularios y diálogos.
- Posibilidad de cerrar diálogos mediante el teclado cuando corresponda.

Al modificar los estilos globales, se deben conservar los indicadores de foco y los demás recursos de accesibilidad existentes.

## Convenciones de trabajo

- Utilizar commits con el formato Conventional Commits.
- Crear ramas de trabajo siguiendo las convenciones acordadas por el equipo.
- Integrar cambios a `main` mediante pull requests.
- Respetar la protección de la rama principal y los requisitos de aprobación.
- Resolver los comentarios de revisión antes de fusionar los cambios.
- Mantener la documentación actualizada conforme evolucionen las funcionalidades.

## Despliegue

| Entorno | Dirección |
|---|---|
| Frontend | Consultar la URL vigente del despliegue en Vercel. |
| Backend | Consultar la URL vigente de la API y su configuración de entorno. |

La disponibilidad del frontend no garantiza que el backend o la base de datos estén funcionando. Las funcionalidades que dependen de estos servicios requieren que la API esté accesible y correctamente configurada.

## Estado del proyecto

Frontend en desarrollo evolutivo durante el semestre 2026-2. Las funcionalidades se implementan y verifican progresivamente mediante las historias de usuario, tareas y criterios de aceptación de los sprints del Miniproyecto 1.

Este README describe la arquitectura y las funcionalidades previstas o trabajadas en la aplicación. La disponibilidad exacta de cada operación depende de la implementación vigente del frontend y de su integración con el backend.
