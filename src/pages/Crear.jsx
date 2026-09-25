import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  actualizarOrganizador,
  crearEvento,
  crearSubtarea,
  obtenerOrganizador,
} from '../api'
import { TIPOS_EVENTO } from '../formato'

let claveSubtarea = 1

function nuevaSubtarea() {
  claveSubtarea += 1
  return {
    clave: claveSubtarea,
    nombre: '',
    horas: '',
    fecha: '',
    nota: '',
    guardada: false,
  }
}

export default function Crear() {
  const navegar = useNavigate()
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('')
  const [contacto, setContacto] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [lugar, setLugar] = useState('')
  const [limite, setLimite] = useState(6)
  const [subtareas, setSubtareas] = useState([nuevaSubtarea()])
  const [errores, setErrores] = useState({})
  const [erroresSubtareas, setErroresSubtareas] = useState({})
  const [avisoPlan, setAvisoPlan] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [eventoIdParcial, setEventoIdParcial] = useState(null)

  useEffect(() => {
    let vigente = true
    obtenerOrganizador()
      .then((datos) => {
        if (vigente && datos?.limite_diario_horas != null) {
          setLimite(Number(datos.limite_diario_horas))
        }
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [])

  function validar() {
    const nuevosErrores = {}
    const nuevosErroresSubtareas = {}

    if (!nombre.trim()) {
      nuevosErrores.nombre = 'Este campo es obligatorio para planificar el evento.'
    }
    if (!tipo) {
      nuevosErrores.tipo = 'Este campo es obligatorio para planificar el evento.'
    }
    if (!fecha) {
      nuevosErrores.fecha = 'Este campo es obligatorio para planificar el evento.'
    } else {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const fechaEvento = new Date(`${fecha}T00:00:00`)
      if (fechaEvento <= hoy) {
        nuevosErrores.fecha = 'La fecha del evento debe ser posterior al día de hoy.'
      }
    }
    if (!hora) {
      nuevosErrores.hora = 'Este campo es obligatorio para planificar el evento.'
    }
    if (!lugar.trim()) {
      nuevosErrores.lugar = 'Este campo es obligatorio para planificar el evento.'
    }
    if (limite === '' || Number(limite) < 1 || Number(limite) > 16) {
      nuevosErrores.limite = 'Las horas de gestión deben ser un valor entre 1 y 16.'
    }

    if (subtareas.length === 0) {
      setAvisoPlan(
        'Agrega al menos una gestión clave (salón, catering, invitaciones) con sus horas estimadas.',
      )
    } else {
      setAvisoPlan('')
    }

    subtareas.forEach((subtarea) => {
      const fallo = {}
      if (!subtarea.nombre.trim()) {
        fallo.nombre = 'El nombre de la gestión es obligatorio.'
      }
      if (subtarea.horas === '' || Number(subtarea.horas) <= 0) {
        fallo.horas = 'Las horas estimadas deben ser un valor mayor a 0 (ej. 1.5, 3).'
      }
      if (!subtarea.fecha) {
        fallo.fecha = 'La fecha objetivo es obligatoria.'
      } else if (fecha && subtarea.fecha > fecha) {
        fallo.fecha = 'El plazo de la gestión logística no puede ser posterior a la fecha del evento.'
      }
      if (Object.keys(fallo).length > 0) {
        nuevosErroresSubtareas[subtarea.clave] = fallo
      }
    })

    return {
      erroresFormulario: nuevosErrores,
      erroresSubtareas: nuevosErroresSubtareas,
      sinPlan: subtareas.length === 0,
    }
  }

  function cambiarSubtarea(clave, campo, valor) {
    setSubtareas((anteriores) =>
      anteriores.map((subtarea) =>
        subtarea.clave === clave ? { ...subtarea, [campo]: valor } : subtarea,
      ),
    )
    setHasError(false)
  }

  async function handleSubmit(evento) {
    evento.preventDefault()
    setHasError(false)

    const resultado = validar()
    setErrores(resultado.erroresFormulario)
    setErroresSubtareas(resultado.erroresSubtareas)

    if (
      Object.keys(resultado.erroresFormulario).length > 0 ||
      Object.keys(resultado.erroresSubtareas).length > 0 ||
      resultado.sinPlan
    ) {
      return
    }

    setIsLoading(true)

    try {
      const organizador = await obtenerOrganizador()
      if (Number(organizador.limite_diario_horas) !== Number(limite)) {
        await actualizarOrganizador({ limite_diario_horas: Number(limite) })
      }

      let eventoId = eventoIdParcial
      if (!eventoId) {
        const creado = await crearEvento({
          organizador: organizador.id,
          nombre: nombre.trim(),
          tipo,
          cliente_contacto: contacto.trim() || 'Sin contacto',
          fecha_hora_evento: `${fecha}T${hora}`,
          lugar: lugar.trim(),
          plazo_limite: fecha,
        })
        eventoId = creado.id
        setEventoIdParcial(eventoId)
      }

      for (const subtarea of subtareas) {
        if (subtarea.guardada) continue
        await crearSubtarea(eventoId, {
          nombre: subtarea.nombre.trim(),
          horas_estimadas: Number(subtarea.horas),
          fecha_objetivo: subtarea.fecha,
          estado: 'PENDIENTE',
          nota_posposicion: subtarea.nota.trim() || null,
        })
        setSubtareas((anteriores) =>
          anteriores.map((item) =>
            item.clave === subtarea.clave ? { ...item, guardada: true } : item,
          ),
        )
      }

      navegar(`/evento/${eventoId}`, {
        state: {
          toast: {
            titulo: 'Evento creado',
            mensaje: '¡El evento y su plan logístico inicial se guardaron con éxito!',
          },
        },
      })
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="pagina">
      <Link className="enlace-volver" to="/hoy">← Volver a Hoy</Link>
      <h1>Crear nuevo evento</h1>
      <p className="intro">
        Define las coordenadas de tu celebración y estructura su plan logístico inicial con subtareas.
      </p>

      {hasError && (
        <div className="aviso aviso-error" role="alert">
          <h2>No se pudo guardar</h2>
          <p>
            Tuvimos un inconveniente al conectar con el servidor.
            Tus datos no se perdieron; intenta nuevamente.
          </p>
          <button type="button" className="boton boton-primario" onClick={() => setHasError(false)}>
            Reintentar
          </button>
        </div>
      )}

      {isLoading && (
        <p className="estado-carga" role="status">
          Guardando plan... Procesando el evento y registrando gestiones logísticas en el servidor.
        </p>
      )}

      <form className="formulario" onSubmit={handleSubmit} noValidate>
        <fieldset>
          <legend>1. Identidad y tipo de evento</legend>

          <div className="campo">
            <label htmlFor="nombre">
              Nombre del evento <span className="obligatorio" aria-hidden="true">*</span>
            </label>
            <small id="ayuda-nombre" className="ayuda-campo">
              Nombre descriptivo para identificarlo rápidamente en el tablero y calendario.
            </small>
            <input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Boda Civil Valentina & Carlos"
              aria-describedby={errores.nombre ? 'ayuda-nombre error-nombre' : 'ayuda-nombre'}
              aria-invalid={Boolean(errores.nombre)}
            />
            {errores.nombre && <p id="error-nombre" className="error-campo" role="alert">{errores.nombre}</p>}
          </div>

          <div className="campo">
            <label htmlFor="tipo">
              Tipo de evento <span className="obligatorio" aria-hidden="true">*</span>
            </label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              aria-invalid={Boolean(errores.tipo)}
              aria-describedby={errores.tipo ? 'error-tipo' : undefined}
            >
              <option value="">Selecciona una opción...</option>
              {TIPOS_EVENTO.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
            </select>
            {errores.tipo && <p id="error-tipo" className="error-campo" role="alert">{errores.tipo}</p>}
          </div>

          <div className="campo">
            <label htmlFor="contacto">Cliente o contacto principal</label>
            <input
              id="contacto"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              placeholder="Ej: Laura Gómez"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend>2. Coordenadas operativas y capacidad</legend>
          <div className="rejilla">
            <div className="campo">
              <label htmlFor="fecha">
                Fecha del evento <span className="obligatorio" aria-hidden="true">*</span>
              </label>
              <input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                aria-invalid={Boolean(errores.fecha)}
                aria-describedby={errores.fecha ? 'error-fecha' : undefined}
              />
              {errores.fecha && <p id="error-fecha" className="error-campo" role="alert">{errores.fecha}</p>}
            </div>
            <div className="campo">
              <label htmlFor="hora">
                Hora de inicio <span className="obligatorio" aria-hidden="true">*</span>
              </label>
              <input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                aria-invalid={Boolean(errores.hora)}
                aria-describedby={errores.hora ? 'error-hora' : undefined}
              />
              {errores.hora && <p id="error-hora" className="error-campo" role="alert">{errores.hora}</p>}
            </div>
          </div>
          </div>

          <div className="campo">
            <label htmlFor="lugar">
              Lugar / sede principal <span className="obligatorio" aria-hidden="true">*</span>
            </label>
            <input
              id="lugar"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              placeholder="Ej: Centro de Eventos La Hacienda"
              aria-invalid={Boolean(errores.lugar)}
              aria-describedby={errores.lugar ? 'error-lugar' : undefined}
            />
            {errores.lugar && <p id="error-lugar" className="error-campo" role="alert">{errores.lugar}</p>}
          </div>
        </fieldset>

          <div className="campo campo-estrecho">
            <label htmlFor="limite">
              Límite diario de horas <span className="obligatorio" aria-hidden="true">*</span>
            </label>
            <small id="ayuda-limite" className="ayuda-campo">
              Horas máximas de preparación por día. Recomendado: 6. Debe estar entre 1 y 16.
            </small>
            <input
              id="limite"
              type="number"
              min="1"
              max="16"
              step="1"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              aria-invalid={Boolean(errores.limite)}
              aria-describedby={errores.limite ? 'ayuda-limite error-limite' : 'ayuda-limite'}
            />
            {errores.limite && <p id="error-limite" className="error-campo" role="alert">{errores.limite}</p>}
          </div>
        </fieldset>

        <fieldset>
          <legend>3. Plan logístico inicial</legend>
          <p className="intro-seccion">
            Las gestiones logísticas permiten calcular el esfuerzo total del evento.
          </p>

          {avisoPlan && <p className="error-campo" role="alert">{avisoPlan}</p>}

          {subtareas.length === 0 && (
            <div className="estado-vacio estado-vacio-compacto">
              <p>Agrega al menos una gestión clave (salón, catering, invitaciones) con sus horas estimadas.</p>
            </div>
          )}

          {subtareas.map((subtarea, indice) => {
            const fallo = erroresSubtareas[subtarea.clave] || {}
            return (
              <div key={subtarea.clave} className="tarjeta-gestion">
                <div className="encabezado-gestion">
                  <h2>Gestión logística #{indice + 1}</h2>
                  <button
                    type="button"
                    className="boton boton-peligro"
                    onClick={() => setSubtareas((anteriores) => anteriores.filter((item) => item.clave !== subtarea.clave))}
                  >
                    Eliminar
                  </button>
                </div>
                <div className="campo">
                  <label htmlFor={`gestion-nombre-${subtarea.clave}`}>
                    Nombre de la gestión <span className="obligatorio" aria-hidden="true">*</span>
                  </label>
                  <input
                    id={`gestion-nombre-${subtarea.clave}`}
                    value={subtarea.nombre}
                    onChange={(e) => cambiarSubtarea(subtarea.clave, 'nombre', e.target.value)}
                    placeholder="Ej: Confirmar degustación de menú con catering"
                    aria-invalid={Boolean(fallo.nombre)}
                  />
                  {fallo.nombre && <p className="error-campo" role="alert">{fallo.nombre}</p>}
                </div>
                <div className="rejilla">
                  <div className="campo">
                    <label htmlFor={`gestion-horas-${subtarea.clave}`}>
                      Horas estimadas <span className="obligatorio" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={`gestion-horas-${subtarea.clave}`}
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={subtarea.horas}
                      onChange={(e) => cambiarSubtarea(subtarea.clave, 'horas', e.target.value)}
                      placeholder="Ej: 3"
                      aria-invalid={Boolean(fallo.horas)}
                    />
                    {fallo.horas && <p className="error-campo" role="alert">{fallo.horas}</p>}
                  </div>
                  <div className="campo">
                    <label htmlFor={`gestion-fecha-${subtarea.clave}`}>
                      Fecha objetivo <span className="obligatorio" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={`gestion-fecha-${subtarea.clave}`}
                      type="date"
                      value={subtarea.fecha}
                      onChange={(e) => cambiarSubtarea(subtarea.clave, 'fecha', e.target.value)}
                      aria-invalid={Boolean(fallo.fecha)}
                    />
                    {fallo.fecha && <p className="error-campo" role="alert">{fallo.fecha}</p>}
                  </div>
                </div>
                <div className="campo">
                  <label htmlFor={`gestion-nota-${subtarea.clave}`}>Nota u observación</label>
                  <textarea
                    id={`gestion-nota-${subtarea.clave}`}
                    rows="2"
                    value={subtarea.nota}
                    onChange={(e) => cambiarSubtarea(subtarea.clave, 'nota', e.target.value)}
                    placeholder="Agrega una observación si es necesario."
                  />
                </div>
              </div>
            )
          })}

          <button
            type="button"
            className="boton boton-secundario"
            onClick={() => setSubtareas((anteriores) => [...anteriores, nuevaSubtarea()])}
          >
            + Agregar gestión
          </button>
        </fieldset>

        <div className="acciones-formulario">
          <Link className="boton boton-secundario" to="/eventos">Cancelar</Link>
          <button type="submit" className="boton boton-primario" disabled={isLoading}>
            {isLoading && <span className="spinner" aria-hidden="true" />}
            {isLoading ? 'Guardando...' : 'Crear evento y plan'}
          </button>
        </div>
      </form>
    </section>
  )
}
