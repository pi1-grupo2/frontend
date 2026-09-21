const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

/**
 * Consulta el endpoint de salud de la API.
 *
 * Se conserva porque pertenece al Sprint 0.
 */
export async function consultarSalud() {
  const respuesta = await fetch(`${API_URL}/health/`)

  if (!respuesta.ok) {
    throw new Error(`La API respondio ${respuesta.status}`)
  }

  return respuesta.json()
}

/**
 * Mock temporal para US-01.
 *
 * Simula la creación de un evento mientras el endpoint real
 * del backend todavía no está disponible.
 *
 * El objeto enviado respeta el contrato definido para POST /api/events/.
 */
export async function crearEventoMock(evento) {
  // Simula el tiempo de respuesta del servidor.
  await new Promise((resolve) => setTimeout(resolve, 1200))

  // Para probar el estado de error temporalmente,
  // descomenta la siguiente línea:
  // throw new Error('MOCK_ERROR')

  return {
    success: true,
    message: 'Evento creado correctamente',
    data: {
      id: 1,
      ...evento,
      status: 'planning',
      progress: 0,
      completed_tasks: 0,
      total_tasks: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  }
}