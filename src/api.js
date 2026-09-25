const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

export class ErrorApi extends Error {
  constructor(mensaje, status, datos) {
    super(mensaje)
    this.status = status
    this.datos = datos
  }
}

async function solicitar(ruta, opciones = {}) {
  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        ...(opciones.headers ?? {}),
      },
    })
  } catch {
    throw new ErrorApi(
      'Tuvimos un inconveniente al conectar con el servidor. Tus datos no se perdieron; intenta nuevamente.',
      0,
      null,
    )
  }

  if (respuesta.status === 204) {
    return null
  }

  const texto = await respuesta.text()
  const datos = texto ? JSON.parse(texto) : null

  if (!respuesta.ok) {
    throw new ErrorApi(
      'Tuvimos un inconveniente al conectar con el servidor. Tus datos no se perdieron; intenta nuevamente.',
      respuesta.status,
      datos,
    )
  }

  return datos
}

export function consultarSalud() {
  return solicitar('/health/')
}

export function obtenerOrganizador() {
  return solicitar('/organizador/')
}

export function actualizarOrganizador(datos) {
  return solicitar('/organizador/', { method: 'PATCH', body: JSON.stringify(datos) })
}

export function listarEventos() {
  return solicitar('/events/')
}

export function obtenerEvento(eventoId) {
  return solicitar(`/events/${eventoId}/`)
}

export function crearEvento(evento) {
  return solicitar('/events/', { method: 'POST', body: JSON.stringify(evento) })
}

export function actualizarEvento(eventoId, datos) {
  return solicitar(`/events/${eventoId}/`, { method: 'PATCH', body: JSON.stringify(datos) })
}

export function eliminarEvento(eventoId) {
  return solicitar(`/events/${eventoId}/`, { method: 'DELETE' })
}

export function listarSubtareas(eventoId) {
  return solicitar(`/events/${eventoId}/subtasks/`)
}

export function crearSubtarea(eventoId, subtarea) {
  return solicitar(`/events/${eventoId}/subtasks/`, {
    method: 'POST',
    body: JSON.stringify(subtarea),
  })
}

export function actualizarSubtarea(eventoId, subtareaId, datos) {
  return solicitar(`/events/${eventoId}/subtasks/${subtareaId}/`, {
    method: 'PATCH',
    body: JSON.stringify(datos),
  })
}

export function eliminarSubtarea(eventoId, subtareaId) {
  return solicitar(`/events/${eventoId}/subtasks/${subtareaId}/`, { method: 'DELETE' })
}

export function obtenerProgreso(eventoId) {
  return solicitar(`/events/${eventoId}/progress/`)
}
