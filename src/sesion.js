const CLAVE = 'eventflow.sesion'

function vigente(datos) {
  if (!datos?.token) return false
  if (!datos.expira_en) return true
  return new Date(datos.expira_en).getTime() > Date.now()
}

export function leerSesion() {
  try {
    const texto = sessionStorage.getItem(CLAVE)
    if (!texto) return null
    const datos = JSON.parse(texto)
    if (!vigente(datos)) {
      sessionStorage.removeItem(CLAVE)
      return null
    }
    return datos
  } catch {
    sessionStorage.removeItem(CLAVE)
    return null
  }
}

export function guardarSesion(sesion) {
  sessionStorage.setItem(CLAVE, JSON.stringify({
    token: sesion.token,
    expira_en: sesion.expira_en,
    organizador: sesion.organizador,
  }))
  window.dispatchEvent(new Event('eventflow-sesion'))
}

export function cerrarSesion() {
  sessionStorage.removeItem(CLAVE)
  window.dispatchEvent(new Event('eventflow-sesion'))
}
