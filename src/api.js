const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

/**
 * Consulta el endpoint de salud de la API.
 *
 * Existe para demostrar que el frontend alcanza al backend, que es la
 * evidencia que pide el criterio C7 del Sprint 0. Tambien es donde aparece
 * el primer error de CORS, y es mejor que aparezca ahora y no en el Sprint 1.
 */
export async function consultarSalud() {
  const respuesta = await fetch(`${API_URL}/health/`)
  if (!respuesta.ok) {
    throw new Error(`La API respondio ${respuesta.status}`)
  }
  return respuesta.json()
}
