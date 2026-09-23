import { useEffect, useState } from 'react'
import { listarSubtareas } from '../api'

/**
 * Lista de subtareas de un evento (#123), versión mínima de solo lectura:
 * nombre, horas estimadas y plazo. Sin editar ni borrar (eso es US-03,
 * está pausado).
 *
 * Uso dentro de EventoDetalle:
 *   <ListaSubtareas eventoId={evento.id} />
 */
export default function ListaSubtareas({ eventoId }) {
  const [subtareas, setSubtareas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function cargarSubtareas() {
      setIsLoading(true)
      setHasError(false)

      try {
        const datos = await listarSubtareas(eventoId)

        if (!cancelado) {
          setSubtareas(datos)
        }
      } catch (error) {
        if (!cancelado) {
          setHasError(true)
        }
      } finally {
        if (!cancelado) {
          setIsLoading(false)
        }
      }
    }

    if (eventoId) {
      cargarSubtareas()
    }

    return () => {
      cancelado = true
    }
  }, [eventoId])

  if (isLoading) {
    return (
      <div role="status">
        <p>Cargando subtareas...</p>
      </div>
    )
  }

  if (hasError) {
    return (
      <div role="alert">
        <h3>No se pudieron cargar las subtareas</h3>
        <p>Tuvimos un inconveniente al conectar con el servidor.</p>
      </div>
    )
  }

  if (subtareas.length === 0) {
    return (
      <div>
        <p>Todavía no hay subtareas registradas para este evento.</p>
      </div>
    )
  }

  return (
    <ul>
      {subtareas.map((subtarea) => (
        <li key={subtarea.id}>
          <h4>{subtarea.nombre}</h4>
          <p>Horas estimadas: <strong>{subtarea.horas_estimadas}</strong></p>
          <p>Plazo: <strong>{subtarea.fecha_objetivo}</strong></p>
        </li>
      ))}
    </ul>
  )
}
