import { useEffect, useState } from 'react'
import { consultarSalud } from './api.js'

/**
 * Muestra si el frontend alcanza a la API.
 *
 * Es la evidencia visual de la integracion para el criterio C7 del Sprint 0.
 * Se puede borrar cuando el producto tenga pantallas reales.
 */
export default function EstadoServicio() {
  const [estado, setEstado] = useState({ tipo: 'cargando' })

  useEffect(() => {
    let vigente = true
    consultarSalud()
      .then((datos) => vigente && setEstado({ tipo: 'ok', datos }))
      .catch((error) => vigente && setEstado({ tipo: 'error', mensaje: error.message }))
    return () => { vigente = false }
  }, [])

  return (
    <div className="estado-servicio">
      <h2>Estado del servicio</h2>
      {/* role="status" hace que el lector de pantalla anuncie el cambio
          cuando la respuesta llega. Es el criterio 4.1.3 de WCAG. */}
      <p role="status">
        {estado.tipo === 'cargando' && 'Consultando la API...'}
        {estado.tipo === 'ok' &&
          `API: ${estado.datos.estado} · Base de datos: ${estado.datos.base_de_datos}`}
        {estado.tipo === 'error' &&
          `No se pudo contactar la API. ${estado.mensaje}`}
      </p>
    </div>
  )
}
