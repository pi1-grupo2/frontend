const CLAVE = 'eventflow.sesion'

export function leerSesion() {
  try {
    const texto = sessionStorage.getItem(CLAVE)
    if (!texto) return null
    const datos = JSON.parse(texto)
    if (!datos?.token) return null
    return datos
  } catch {
    return null
  }
}

export function guardarSesion(sesion) {
  sessionStorage.setItem(CLAVE, JSON.stringify({
    token: sesion.token,
    organizador: sesion.organizador,
  }))
  window.dispatchEvent(new Event('eventflow-sesion'))
}

export function cerrarSesion() {
  sessionStorage.removeItem(CLAVE)
  window.dispatchEvent(new Event('eventflow-sesion'))
}
