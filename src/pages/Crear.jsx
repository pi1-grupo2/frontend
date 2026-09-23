import { useState } from 'react'
import { crearEventoMock } from '../api'

export default function Crear() {
  const [formulario, setFormulario] = useState({
    name: '',
    event_type: '',
    client_contact: '',
    description: '',
    event_date: '',
    start_time: '',
    location: '',
    daily_hours_limit: 6,
  })

  const [subtareas, setSubtareas] = useState([
    {
      id: 1,
      name: '',
      estimated_hours: '',
      target_date: '',
      note: '',
    },
    {
      id: 2,
      name: '',
      estimated_hours: '',
      target_date: '',
      note: '',
    },
  ])

  const [errores, setErrores] = useState({})
  const [erroresSubtareas, setErroresSubtareas] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [eventoCreado, setEventoCreado] = useState(null)

  function cambiarCampo(e) {
    const { name, value } = e.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }))

    setErrores((anterior) => ({
      ...anterior,
      [name]: '',
    }))

    setHasError(false)
  }

  function cambiarSubtarea(id, campo, valor) {
    setSubtareas((anteriores) =>
      anteriores.map((subtarea) =>
        subtarea.id === id
          ? {
              ...subtarea,
              [campo]: valor,
            }
          : subtarea
      )
    )

    setErroresSubtareas((anteriores) => ({
      ...anteriores,
      [id]: {
        ...(anteriores[id] || {}),
        [campo]: '',
      },
    }))

    setHasError(false)
  }

  function agregarSubtarea() {
    const nuevoId =
      subtareas.length > 0
        ? Math.max(...subtareas.map((subtarea) => subtarea.id)) + 1
        : 1

    setSubtareas((anteriores) => [
      ...anteriores,
      {
        id: nuevoId,
        name: '',
        estimated_hours: '',
        target_date: '',
        note: '',
      },
    ])
  }

  function eliminarSubtarea(id) {
    setSubtareas((anteriores) =>
      anteriores.filter((subtarea) => subtarea.id !== id)
    )

    setErroresSubtareas((anteriores) => {
      const nuevosErrores = { ...anteriores }
      delete nuevosErrores[id]
      return nuevosErrores
    })
  }

  function validarFormulario() {
    const nuevosErrores = {}
    const nuevosErroresSubtareas = {}

    if (!formulario.name.trim()) {
      nuevosErrores.name =
        'Este campo es obligatorio para planificar el evento.'
    }

    if (!formulario.event_type) {
      nuevosErrores.event_type =
        'Este campo es obligatorio para planificar el evento.'
    }

    if (!formulario.event_date) {
      nuevosErrores.event_date =
        'Este campo es obligatorio para planificar el evento.'
    } else {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      const fechaEvento = new Date(
        `${formulario.event_date}T00:00:00`
      )

      if (fechaEvento <= hoy) {
        nuevosErrores.event_date =
          'La fecha del evento debe ser posterior al día de hoy.'
      }
    }

    if (!formulario.start_time) {
      nuevosErrores.start_time =
        'Este campo es obligatorio para planificar el evento.'
    }

    if (!formulario.location.trim()) {
      nuevosErrores.location =
        'Este campo es obligatorio para planificar el evento.'
    }

    if (
      formulario.daily_hours_limit === '' ||
      Number(formulario.daily_hours_limit) <= 0 ||
      Number(formulario.daily_hours_limit) > 16
    ) {
      nuevosErrores.daily_hours_limit =
        'Las horas de gestión deben ser un valor entre 1 y 16.'
    }

    subtareas.forEach((subtarea) => {
      const errores = {}

      if (!subtarea.name.trim()) {
        errores.name =
          'Este campo es obligatorio para planificar la gestión.'
      }

      if (
        subtarea.estimated_hours === '' ||
        Number(subtarea.estimated_hours) <= 0
      ) {
        errores.estimated_hours =
          'Las horas estimadas deben ser un valor mayor a 0 (ej. 1.5, 3).'
      }

      if (!subtarea.target_date) {
        errores.target_date =
          'Este campo es obligatorio para planificar la gestión.'
      } else if (
        formulario.event_date &&
        subtarea.target_date > formulario.event_date
      ) {
        errores.target_date =
          'La fecha objetivo no puede ser posterior a la fecha del evento.'
      }

      if (Object.keys(errores).length > 0) {
        nuevosErroresSubtareas[subtarea.id] = errores
      }
    })

    return {
      erroresFormulario: nuevosErrores,
      erroresSubtareas: nuevosErroresSubtareas,
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setHasError(false)

    const {
      erroresFormulario,
      erroresSubtareas: erroresEncontrados,
    } = validarFormulario()

    if (
      Object.keys(erroresFormulario).length > 0 ||
      Object.keys(erroresEncontrados).length > 0
    ) {
      setErrores(erroresFormulario)
      setErroresSubtareas(erroresEncontrados)
      return
    }

    setErrores({})
    setErroresSubtareas({})
    setIsLoading(true)

    try {
      const datosParaEnviar = {
        name: formulario.name,
        event_type: formulario.event_type,
        description: formulario.description,
        event_date: formulario.event_date,
        location: formulario.location,
        daily_hours_limit: Number(formulario.daily_hours_limit),
      }

      const respuesta = await crearEventoMock(datosParaEnviar)

      setEventoCreado(respuesta.data)
      setIsSuccess(true)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  function reintentar() {
    setHasError(false)
  }

  if (isSuccess && eventoCreado) {
    return (
      <section className="pagina-formulario">
        <div className="aviso aviso-exito" role="status">
          <h2>Evento creado</h2>
          <p>
            El evento y su plan logístico inicial se guardaron con éxito.
          </p>
          <p>
            Evento: <strong>{eventoCreado.name}</strong>
          </p>
          <a className="boton boton-primario" href={`/evento/${eventoCreado.id}`}>
            Ver evento
          </a>
        </div>
      </section>
    )
  }

  return (
    <section className="pagina-formulario">
      <a className="enlace-volver" href="/hoy">← Volver a Hoy</a>

      <h2>Crear nuevo evento</h2>

      <p className="intro-pagina">
        Define las coordenadas clave de tu evento y estructura su
        plan logístico inicial con subtareas.
      </p>

      {hasError && (
        <div className="aviso aviso-error" role="alert">
          <h3>No se pudo guardar</h3>
          <p>
            Tuvimos un inconveniente al conectar con el servidor.
            Tus datos no se perdieron; intenta nuevamente.
          </p>
          <button type="button" className="boton boton-secundario" onClick={reintentar}>
            Reintentar
          </button>
        </div>
      )}

      <form className="formulario" onSubmit={handleSubmit} noValidate>
        <fieldset>
          <legend>1. Identidad y propósito del evento</legend>

          <div className="campo">
            <label htmlFor="name">
              Nombre del evento <span aria-hidden="true">*</span>
            </label>

            <small id="ayuda-name" className="ayuda-campo">
              Nombre descriptivo para identificarlo rápidamente en
              el tablero y calendario.
            </small>

            <input
              id="name"
              name="name"
              type="text"
              value={formulario.name}
              onChange={cambiarCampo}
              placeholder="Ej: Boda de Laura y Andrés"
              aria-describedby={errores.name ? 'ayuda-name error-name' : 'ayuda-name'}
              aria-invalid={Boolean(errores.name)}
            />

            {errores.name && (
              <p id="error-name" role="alert" className="error-campo">
                {errores.name}
              </p>
            )}
          </div>

          <div className="campo">
            <label htmlFor="event_type">
              Tipo de evento <span aria-hidden="true">*</span>
            </label>

            <select
              id="event_type"
              name="event_type"
              value={formulario.event_type}
              onChange={cambiarCampo}
              aria-describedby={
                errores.event_type
                  ? 'error-event-type'
                  : undefined
              }
              aria-invalid={Boolean(errores.event_type)}
            >
              <option value="">Selecciona una opción...</option>
              <option value="Boda">Boda</option>
              <option value="Corporativo / Congreso">
                Corporativo / Congreso
              </option>
              <option value="Social / Fiesta">
                Social / Fiesta
              </option>
              <option value="Cumpleaños">Cumpleaños</option>
              <option value="Otro tipo de evento">
                Otro tipo de evento
              </option>
            </select>

            {errores.event_type && (
              <p id="error-event-type" role="alert">
                {errores.event_type}
              </p>
            )}
          </div>

          <div className="campo">
            <label htmlFor="client_contact">
              Cliente o contacto principal
            </label>

            <input
              id="client_contact"
              name="client_contact"
              type="text"
              value={formulario.client_contact}
              onChange={cambiarCampo}
              placeholder="Ej: Laura Gómez"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend>2. Coordenadas operativas</legend>

          <div className="rejilla-campos">
          <div className="campo">
            <label htmlFor="event_date">
              Fecha del evento <span aria-hidden="true">*</span>
            </label>

            <input
              id="event_date"
              name="event_date"
              type="date"
              value={formulario.event_date}
              onChange={cambiarCampo}
              aria-describedby={
                errores.event_date
                  ? 'error-event-date'
                  : undefined
              }
              aria-invalid={Boolean(errores.event_date)}
            />

            {errores.event_date && (
              <p id="error-event-date" role="alert">
                {errores.event_date}
              </p>
            )}
          </div>

          <div className="campo">
            <label htmlFor="start_time">
              Hora de inicio <span aria-hidden="true">*</span>
            </label>

            <input
              id="start_time"
              name="start_time"
              type="time"
              value={formulario.start_time}
              onChange={cambiarCampo}
              aria-describedby={
                errores.start_time
                  ? 'error-start-time'
                  : undefined
              }
              aria-invalid={Boolean(errores.start_time)}
            />

            {errores.start_time && (
              <p id="error-start-time" role="alert">
                {errores.start_time}
              </p>
            )}
          </div>
          </div>

          <div className="campo">
            <label htmlFor="location">
              Lugar / Sede principal <span aria-hidden="true">*</span>
            </label>

            <input
              id="location"
              name="location"
              type="text"
              value={formulario.location}
              onChange={cambiarCampo}
              placeholder="Ej: Centro de Eventos La Hacienda"
              aria-describedby={
                errores.location
                  ? 'error-location'
                  : undefined
              }
              aria-invalid={Boolean(errores.location)}
            />

            {errores.location && (
              <p id="error-location" role="alert">
                {errores.location}
              </p>
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend>3. Preferencias de planificación</legend>

          <p className="intro-seccion">
            Esto no es un dato del evento: indica cuántas horas al día
            puedes dedicar a prepararlo, para avisarte si el plan queda
            sobrecargado.
          </p>

          <div className="campo campo-estrecho">
            <label htmlFor="daily_hours_limit">
              Horas máximas de preparación por día
              <span aria-hidden="true"> *</span>
            </label>

            <small id="ayuda-daily-hours" className="ayuda-campo">
              Recomendado: 6 horas. Debe estar entre 1 y 16.
            </small>

            <input
              id="daily_hours_limit"
              name="daily_hours_limit"
              type="number"
              min="1"
              max="16"
              step="1"
              value={formulario.daily_hours_limit}
              onChange={cambiarCampo}
              aria-describedby={
                errores.daily_hours_limit
                  ? 'ayuda-daily-hours error-daily-hours'
                  : 'ayuda-daily-hours'
              }
              aria-invalid={Boolean(errores.daily_hours_limit)}
            />

            {errores.daily_hours_limit && (
              <p id="error-daily-hours" role="alert" className="error-campo">
                {errores.daily_hours_limit}
              </p>
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend>4. Plan logístico inicial</legend>

          <p className="intro-seccion">
            Desglosa las primeras gestiones clave (catering, salón,
            invitaciones) con su fecha objetivo y esfuerzo estimado
            para arrancar la planificación.
          </p>

          {subtareas.map((subtarea, indice) => {
            const erroresActuales =
              erroresSubtareas[subtarea.id] || {}

            return (
              <div key={subtarea.id} className="tarjeta-gestion">
                <div className="encabezado-gestion">
                  <h3>
                    Gestión logística #{indice + 1}
                  </h3>

                  <button
                    type="button"
                    className="boton boton-peligro"
                    onClick={() =>
                      eliminarSubtarea(subtarea.id)
                    }
                  >
                    Eliminar
                  </button>
                </div>

                <div className="campo">
                  <label htmlFor={`subtask-name-${subtarea.id}`}>
                    Nombre de la gestión{' '}
                    <span aria-hidden="true">*</span>
                  </label>

                  <input
                    id={`subtask-name-${subtarea.id}`}
                    type="text"
                    value={subtarea.name}
                    onChange={(e) =>
                      cambiarSubtarea(
                        subtarea.id,
                        'name',
                        e.target.value
                      )
                    }
                    placeholder="Ej: Reservar salón"
                    aria-invalid={Boolean(erroresActuales.name)}
                  />

                  {erroresActuales.name && (
                    <p role="alert" className="error-campo">
                      {erroresActuales.name}
                    </p>
                  )}
                </div>

                <div className="rejilla-campos">
                <div className="campo">
                  <label
                    htmlFor={`subtask-hours-${subtarea.id}`}
                  >
                    Horas estimadas{' '}
                    <span aria-hidden="true">*</span>
                  </label>

                  <input
                    id={`subtask-hours-${subtarea.id}`}
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={subtarea.estimated_hours}
                    onChange={(e) =>
                      cambiarSubtarea(
                        subtarea.id,
                        'estimated_hours',
                        e.target.value
                      )
                    }
                    placeholder="Ej: 3"
                    aria-invalid={Boolean(
                      erroresActuales.estimated_hours
                    )}
                  />

                  {erroresActuales.estimated_hours && (
                    <p role="alert" className="error-campo">
                      {erroresActuales.estimated_hours}
                    </p>
                  )}
                </div>

                <div className="campo">
                  <label
                    htmlFor={`subtask-date-${subtarea.id}`}
                  >
                    Fecha objetivo / plazo límite{' '}
                    <span aria-hidden="true">*</span>
                  </label>

                  <input
                    id={`subtask-date-${subtarea.id}`}
                    type="date"
                    value={subtarea.target_date}
                    onChange={(e) =>
                      cambiarSubtarea(
                        subtarea.id,
                        'target_date',
                        e.target.value
                      )
                    }
                    aria-invalid={Boolean(
                      erroresActuales.target_date
                    )}
                  />

                  {erroresActuales.target_date && (
                    <p role="alert" className="error-campo">
                      {erroresActuales.target_date}
                    </p>
                  )}
                </div>
                </div>

                <div className="campo">
                  <label
                    htmlFor={`subtask-note-${subtarea.id}`}
                  >
                    Nota u observación (Opcional)
                  </label>

                  <textarea
                    id={`subtask-note-${subtarea.id}`}
                    rows="3"
                    value={subtarea.note}
                    onChange={(e) =>
                      cambiarSubtarea(
                        subtarea.id,
                        'note',
                        e.target.value
                      )
                    }
                    placeholder="Agrega una observación si es necesario."
                  />
                </div>
              </div>
            )
          })}

          <button
            type="button"
            className="boton boton-secundario"
            onClick={agregarSubtarea}
          >
            + Agregar otra gestión logística
          </button>
        </fieldset>

        <div className="acciones-formulario">
          <button
            type="button"
            className="boton boton-secundario"
            onClick={() => window.history.back()}
          >
            Cancelar
          </button>

          <button type="submit" className="boton boton-primario" disabled={isLoading}>
            {isLoading
              ? 'Guardando...'
              : 'Crear evento y plan inicial'}
          </button>
        </div>
      </form>
    </section>
  )
}