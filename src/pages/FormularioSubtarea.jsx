import { useState } from 'react'
import { crearSubtarea } from '../api'

export default function FormularioSubtarea({ eventoId, fechaEvento, alCrear }) {
  const [nombre, setNombre] = useState('')
  const [horasEstimadas, setHorasEstimadas] = useState('')
  const [fechaObjetivo, setFechaObjetivo] = useState('')
  const [errores, setErrores] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  function validar() {
    const fallo = {}
    if (!nombre.trim()) fallo.nombre = 'El nombre de la gestión es obligatorio.'
    if (horasEstimadas === '' || Number(horasEstimadas) <= 0) {
      fallo.horasEstimadas = 'Las horas estimadas deben ser un valor mayor a 0 (ej. 1.5, 3).'
    }
    if (!fechaObjetivo) {
      fallo.fechaObjetivo = 'La fecha objetivo es obligatoria.'
    } else if (fechaEvento && fechaObjetivo > fechaEvento) {
      fallo.fechaObjetivo = 'El plazo de la gestión logística no puede ser posterior a la fecha del evento.'
    }
    return fallo
  }

  async function handleSubmit(evento) {
    evento.preventDefault()
    setHasError(false)
    setIsSuccess(false)
    const fallo = validar()
    setErrores(fallo)
    if (Object.keys(fallo).length > 0) return

    setIsLoading(true)
    try {
      await crearSubtarea(eventoId, {
        nombre: nombre.trim(),
        horas_estimadas: Number(horasEstimadas),
        fecha_objetivo: fechaObjetivo,
        estado: 'PENDIENTE',
      })
      setNombre('')
      setHorasEstimadas('')
      setFechaObjetivo('')
      setIsSuccess(true)
      if (alCrear) await alCrear()
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form id="nueva-gestion" className="formulario formulario-anidado" onSubmit={handleSubmit} noValidate>
      <h3>Agregar gestión logística</h3>
      {hasError && (
        <div className="aviso aviso-error" role="alert">
          <h2>No se pudo guardar</h2>
          <p>No se pudo guardar la gestión. Tus datos no se perdieron; intenta nuevamente.</p>
          <button type="button" className="boton boton-primario" onClick={() => setHasError(false)}>
            Reintentar
          </button>
        </div>
      )}
      {isSuccess && <p className="ayuda-campo" role="status">La gestión se agregó correctamente.</p>}
      <div className="campo">
        <label htmlFor="subtarea-nombre">
          Nombre de la gestión <span className="obligatorio" aria-hidden="true">*</span>
        </label>
        <input
          id="subtarea-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Reservar salón"
          aria-invalid={Boolean(errores.nombre)}
        />
        {errores.nombre && <p className="error-campo" role="alert">{errores.nombre}</p>}
      </div>
      <div className="rejilla">
        <div className="campo">
          <label htmlFor="subtarea-horas">
            Horas estimadas <span className="obligatorio" aria-hidden="true">*</span>
          </label>
          <input
            id="subtarea-horas"
            type="number"
            min="0.5"
            step="0.5"
            value={horasEstimadas}
            onChange={(e) => setHorasEstimadas(e.target.value)}
            placeholder="Ej: 3"
            aria-invalid={Boolean(errores.horasEstimadas)}
          />
          {errores.horasEstimadas && <p className="error-campo" role="alert">{errores.horasEstimadas}</p>}
        </div>
        <div className="campo">
          <label htmlFor="subtarea-fecha">
            Fecha objetivo <span className="obligatorio" aria-hidden="true">*</span>
          </label>
          <input
            id="subtarea-fecha"
            type="date"
            value={fechaObjetivo}
            onChange={(e) => setFechaObjetivo(e.target.value)}
            aria-invalid={Boolean(errores.fechaObjetivo)}
          />
          {errores.fechaObjetivo && <p className="error-campo" role="alert">{errores.fechaObjetivo}</p>}
        </div>
      </div>
      <button type="submit" className="boton boton-primario" disabled={isLoading}>
        {isLoading && <span className="spinner" aria-hidden="true" />}
        {isLoading ? 'Guardando...' : '+ Subtarea'}
      </button>
    </form>
  )
}
