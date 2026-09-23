import { useState } from 'react'
import { crearSubtarea } from '../api'

/**
 * Formulario para agregar UNA subtarea a un evento ya existente (#122).
 * Se usa dentro de EventoDetalle, pasándole el id del evento y un
 * callback opcional para refrescar la lista cuando se crea con éxito.
 *
 * Uso:
 *   <FormularioSubtarea eventoId={evento.id} alCrear={() => recargarLista()} />
 */
export default function FormularioSubtarea({ eventoId, alCrear }) {
  const [nombre, setNombre] = useState('')
  const [horasEstimadas, setHorasEstimadas] = useState('')
  const [fechaObjetivo, setFechaObjetivo] = useState('')

  const [errores, setErrores] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  function validar() {
    const nuevosErrores = {}

    if (!nombre.trim()) {
      nuevosErrores.nombre = 'El nombre de la gestión es obligatorio.'
    }

    if (horasEstimadas === '' || Number(horasEstimadas) <= 0) {
      nuevosErrores.horasEstimadas =
        'Las horas estimadas deben ser un valor mayor a 0 (ej. 1.5, 3).'
    }

    if (!fechaObjetivo) {
      nuevosErrores.fechaObjetivo = 'La fecha objetivo es obligatoria.'
    }

    return nuevosErrores
  }

  function limpiarFormulario() {
    setNombre('')
    setHorasEstimadas('')
    setFechaObjetivo('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setHasError(false)
    setIsSuccess(false)

    const nuevosErrores = validar()

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }

    setErrores({})
    setIsLoading(true)

    try {
      await crearSubtarea(eventoId, {
        nombre,
        horas_estimadas: Number(horasEstimadas),
        fecha_objetivo: fechaObjetivo,
        estado: 'PENDIENTE',
      })

      setIsSuccess(true)
      limpiarFormulario()

      if (alCrear) {
        alCrear()
      }
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  function reintentar() {
    setHasError(false)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3>Agregar gestión logística</h3>

      {hasError && (
        <div role="alert">
          <p>
            No se pudo guardar la gestión. Tus datos no se perdieron;
            intenta nuevamente.
          </p>
          <button type="button" onClick={reintentar}>
            Reintentar
          </button>
        </div>
      )}

      {isSuccess && (
        <p role="status">La gestión se agregó correctamente.</p>
      )}

      <div>
        <label htmlFor="subtarea-nombre">
          Nombre de la gestión <span aria-hidden="true">*</span>
        </label>

        <input
          id="subtarea-nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Reservar salón"
          aria-invalid={Boolean(errores.nombre)}
        />

        {errores.nombre && (
          <p role="alert" className="error-campo">
            {errores.nombre}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="subtarea-horas">
          Horas estimadas <span aria-hidden="true">*</span>
        </label>

        <input
          id="subtarea-horas"
          type="number"
          min="0.1"
          step="0.1"
          value={horasEstimadas}
          onChange={(e) => setHorasEstimadas(e.target.value)}
          placeholder="Ej: 3"
          aria-invalid={Boolean(errores.horasEstimadas)}
        />

        {errores.horasEstimadas && (
          <p role="alert" className="error-campo">
            {errores.horasEstimadas}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="subtarea-fecha">
          Fecha objetivo / plazo <span aria-hidden="true">*</span>
        </label>

        <input
          id="subtarea-fecha"
          type="date"
          value={fechaObjetivo}
          onChange={(e) => setFechaObjetivo(e.target.value)}
          aria-invalid={Boolean(errores.fechaObjetivo)}
        />

        {errores.fechaObjetivo && (
          <p role="alert" className="error-campo">
            {errores.fechaObjetivo}
          </p>
        )}
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Guardando...' : 'Agregar gestión'}
      </button>
    </form>
  )
}
