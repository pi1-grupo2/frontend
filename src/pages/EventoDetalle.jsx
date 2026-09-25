import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  actualizarEvento,
  actualizarSubtarea,
  eliminarEvento,
  eliminarSubtarea,
  listarSubtareas,
  obtenerEvento,
  obtenerProgreso,
} from '../api'
import ModalConfirmacion from '../components/ModalConfirmacion'
import TarjetaProgreso from '../components/TarjetaProgreso'
import Toast from '../components/Toast'
import FormularioSubtarea from './FormularioSubtarea'
import {
  TIPOS_EVENTO,
  etiquetaSituacion,
  etiquetaTipo,
  fechaDeIso,
  formatearFechaHora,
  horaDeIso,
} from '../formato'

export default function EventoDetalle() {
  const { id } = useParams()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [evento, setEvento] = useState(null)
  const [subtareas, setSubtareas] = useState([])
  const [progreso, setProgreso] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [errorProgreso, setErrorProgreso] = useState(false)
  const [modo, setModo] = useState('ver')
  const [formulario, setFormulario] = useState(null)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState(false)
  const [modal, setModal] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [toast, setToast] = useState(ubicacion.state?.toast ?? null)

  const cargar = useCallback(() => {
    let vigente = true
    setCargando(true)
    setError(false)
    setErrorProgreso(false)

    obtenerEvento(id)
      .then(async (datos) => {
        if (!vigente) return
        setEvento(datos)
        const lista = await listarSubtareas(id)
        if (!vigente) return
        setSubtareas(lista)
        try {
          const avance = await obtenerProgreso(id)
          if (vigente) setProgreso(avance)
        } catch {
          if (vigente) setErrorProgreso(true)
        }
      })
      .catch(() => {
        if (vigente) setError(true)
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [id])

  useEffect(() => cargar(), [cargar])

  function empezarEdicion() {
    setFormulario({
      nombre: evento.nombre,
      tipo: evento.tipo,
      contacto: evento.cliente_contacto === 'Sin contacto' ? '' : evento.cliente_contacto,
      fecha: fechaDeIso(evento.fecha_hora_evento),
      hora: horaDeIso(evento.fecha_hora_evento),
      lugar: evento.lugar,
    })
    setErrores({})
    setErrorGuardado(false)
    setModo('editar')
  }

  function validarEdicion() {
    const fallo = {}
    if (!formulario.nombre.trim()) fallo.nombre = 'Este campo es obligatorio para planificar el evento.'
    if (!formulario.tipo) fallo.tipo = 'Este campo es obligatorio para planificar el evento.'
    if (!formulario.fecha) {
      fallo.fecha = 'Este campo es obligatorio para planificar el evento.'
    } else {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      if (new Date(`${formulario.fecha}T00:00:00`) <= hoy) {
        fallo.fecha = 'La fecha del evento debe ser posterior al día de hoy.'
      }
    }
    if (!formulario.hora) fallo.hora = 'Este campo es obligatorio para planificar el evento.'
    if (!formulario.lugar.trim()) fallo.lugar = 'Este campo es obligatorio para planificar el evento.'
    return fallo
  }

  async function guardarCambios(eventoFormulario) {
    eventoFormulario.preventDefault()
    const fallo = validarEdicion()
    setErrores(fallo)
    if (Object.keys(fallo).length > 0) return

    setGuardando(true)
    setErrorGuardado(false)
    try {
      const actualizado = await actualizarEvento(id, {
        nombre: formulario.nombre.trim(),
        tipo: formulario.tipo,
        cliente_contacto: formulario.contacto.trim() || 'Sin contacto',
        fecha_hora_evento: `${formulario.fecha}T${formulario.hora}`,
        lugar: formulario.lugar.trim(),
        plazo_limite: formulario.fecha,
      })
      setEvento(actualizado)
      setModo('ver')
      setToast({
        titulo: 'Cambios guardados',
        mensaje: 'La información del evento y sus gestiones han sido actualizadas.',
      })
    } catch {
      setErrorGuardado(true)
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarEliminacion() {
    setEliminando(true)
    try {
      if (modal.tipo === 'evento') {
        await eliminarEvento(id)
        navegar('/eventos', {
          state: {
            toast: {
              titulo: 'Elemento eliminado',
              mensaje: 'El registro fue eliminado correctamente del sistema.',
            },
          },
        })
        return
      }
      await eliminarSubtarea(id, modal.subtarea.id)
      setModal(null)
      setToast({
        titulo: 'Elemento eliminado',
        mensaje: 'El registro fue eliminado correctamente del sistema.',
      })
      const lista = await listarSubtareas(id)
      setSubtareas(lista)
      const avance = await obtenerProgreso(id)
      setProgreso(avance)
    } catch {
      setErrorGuardado(true)
      setModal(null)
    } finally {
      setEliminando(false)
    }
  }

  async function marcarEjecutada(subtarea) {
    await actualizarSubtarea(id, subtarea.id, { estado: 'EJECUTADA' })
    const lista = await listarSubtareas(id)
    setSubtareas(lista)
    const avance = await obtenerProgreso(id)
    setProgreso(avance)
  }

  if (cargando) {
    return (
      <section className="pagina" aria-busy="true">
        <div className="esqueleto esqueleto-bloque" />
      </section>
    )
  }

  if (error || !evento) {
    return (
      <section className="pagina">
        <div className="estado-vacio">
          <div className="icono-estado icono-error" aria-hidden="true">!</div>
          <h1>No se pudo abrir el evento</h1>
          <p>Ha ocurrido un error cargando los eventos del sistema.</p>
          <button type="button" className="boton boton-secundario" onClick={cargar}>
            Intentar de nuevo
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="pagina">
      {toast && <Toast titulo={toast.titulo} mensaje={toast.mensaje} onClose={() => setToast(null)} />}

      {modo === 'ver' ? (
        <Link className="enlace-volver" to="/eventos">← Volver a Mis eventos</Link>
      ) : (
        <button type="button" className="enlace-volver enlace-boton" onClick={() => setModo('ver')}>
          ← Cancelar edición
        </button>
      )}

      <header className="encabezado-detalle">
        <h1>{modo === 'editar' ? 'Editar Evento' : evento.nombre}</h1>
        {modo === 'ver' && (
          <button type="button" className="boton boton-primario" onClick={empezarEdicion}>
            Editar evento
          </button>
        )}
      </header>

      {modo === 'ver' && (
        <article className="ficha-evento">
          <dl className="rejilla-ficha">
            <div>
              <dt>Tipo de evento</dt>
              <dd>{etiquetaTipo(evento.tipo)}</dd>
            </div>
            <div>
              <dt>Fecha y hora</dt>
              <dd>{formatearFechaHora(evento.fecha_hora_evento)}</dd>
            </div>
            <div>
              <dt>Sede / ubicación</dt>
              <dd>{evento.lugar}</dd>
            </div>
            <div>
              <dt>Contacto del cliente</dt>
              <dd>{evento.cliente_contacto}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="boton boton-peligro"
            onClick={() => setModal({ tipo: 'evento' })}
          >
            Eliminar evento
          </button>
        </article>
      )}

      {modo === 'editar' && (
        <form className="formulario" onSubmit={guardarCambios} noValidate>
          {errorGuardado && (
            <div className="aviso aviso-error" role="alert">
              <h2>No se pudo guardar</h2>
              <p>Tuvimos un inconveniente al conectar con el servidor. Tus datos no se perdieron; intenta nuevamente.</p>
              <button type="button" className="boton boton-primario" onClick={() => setErrorGuardado(false)}>
                Reintentar
              </button>
            </div>
          )}
          <fieldset>
            <legend>Datos del evento</legend>
            <div className="campo">
              <label htmlFor="editar-nombre">
                Nombre del evento <span className="obligatorio" aria-hidden="true">*</span>
              </label>
              <input
                id="editar-nombre"
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                aria-invalid={Boolean(errores.nombre)}
              />
              {errores.nombre && <p className="error-campo" role="alert">{errores.nombre}</p>}
            </div>
            <div className="rejilla">
              <div className="campo">
                <label htmlFor="editar-tipo">
                  Tipo de evento <span className="obligatorio" aria-hidden="true">*</span>
                </label>
                <select
                  id="editar-tipo"
                  value={formulario.tipo}
                  onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
                  aria-invalid={Boolean(errores.tipo)}
                >
                  {TIPOS_EVENTO.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                  ))}
                </select>
                {errores.tipo && <p className="error-campo" role="alert">{errores.tipo}</p>}
              </div>
              <div className="campo">
                <label htmlFor="editar-fecha">
                  Fecha del evento <span className="obligatorio" aria-hidden="true">*</span>
                </label>
                <input
                  id="editar-fecha"
                  type="date"
                  value={formulario.fecha}
                  onChange={(e) => setFormulario({ ...formulario, fecha: e.target.value })}
                  aria-invalid={Boolean(errores.fecha)}
                />
                {errores.fecha && <p className="error-campo" role="alert">{errores.fecha}</p>}
              </div>
            </div>
            <div className="rejilla">
              <div className="campo">
                <label htmlFor="editar-hora">
                  Hora de inicio <span className="obligatorio" aria-hidden="true">*</span>
                </label>
                <input
                  id="editar-hora"
                  type="time"
                  value={formulario.hora}
                  onChange={(e) => setFormulario({ ...formulario, hora: e.target.value })}
                  aria-invalid={Boolean(errores.hora)}
                />
                {errores.hora && <p className="error-campo" role="alert">{errores.hora}</p>}
              </div>
              <div className="campo">
                <label htmlFor="editar-lugar">
                  Lugar / sede principal <span className="obligatorio" aria-hidden="true">*</span>
                </label>
                <input
                  id="editar-lugar"
                  value={formulario.lugar}
                  onChange={(e) => setFormulario({ ...formulario, lugar: e.target.value })}
                  aria-invalid={Boolean(errores.lugar)}
                />
                {errores.lugar && <p className="error-campo" role="alert">{errores.lugar}</p>}
              </div>
            </div>
            <div className="campo">
              <label htmlFor="editar-contacto">Cliente o contacto principal</label>
              <input
                id="editar-contacto"
                value={formulario.contacto}
                onChange={(e) => setFormulario({ ...formulario, contacto: e.target.value })}
              />
            </div>
          </fieldset>
          <div className="acciones-edicion">
            <div className="acciones-formulario">
              <button type="submit" className="boton boton-primario" disabled={guardando}>
                {guardando && <span className="spinner" aria-hidden="true" />}
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" className="boton boton-secundario" onClick={() => setModo('ver')}>
                Cancelar
              </button>
            </div>
            <button type="button" className="boton boton-peligro" onClick={() => setModal({ tipo: 'evento' })}>
              Eliminar evento
            </button>
          </div>
        </form>
      )}

      <TarjetaProgreso
        progreso={progreso}
        cargando={false}
        error={errorProgreso}
        onReintentar={cargar}
      />

      <section className="plan-logistico">
        <div className="encabezado-detalle">
          <h2>Plan logístico activo</h2>
        </div>
        <p className="intro">Muestra el listado de gestiones ordenadas con sus plazos y horas calculadas.</p>

        {subtareas.length === 0 ? (
          <div className="estado-vacio">
            <div className="icono-estado" aria-hidden="true">📖</div>
            <h2>Aún no tienes gestiones planificadas</h2>
            <p>Comienza agregando subtareas clave como salón, sonido o catering.</p>
            <a className="boton boton-primario" href="#nueva-gestion">+ Agregar gestión logística</a>
          </div>
        ) : (
          <ul className="lista-gestiones">
            {subtareas.map((subtarea) => (
              <li key={subtarea.id} className="tarjeta-gestion">
                <div className="encabezado-gestion">
                  <h3>{subtarea.nombre}</h3>
                  <span className={`insignia insignia-${(subtarea.situacion || '').toLowerCase()}`}>
                    {etiquetaSituacion(subtarea.situacion)}
                  </span>
                </div>
                <p>Horas estimadas: <strong>{subtarea.horas_estimadas}</strong></p>
                <p>Plazo: <strong>{subtarea.fecha_objetivo}</strong></p>
                {subtarea.nota_posposicion && <p>{subtarea.nota_posposicion}</p>}
                <div className="acciones-formulario">
                  {subtarea.estado !== 'EJECUTADA' && (
                    <button type="button" className="boton boton-secundario" onClick={() => marcarEjecutarSeguro(subtarea)}>
                      Marcar como ejecutada
                    </button>
                  )}
                  <button
                    type="button"
                    className="boton boton-peligro"
                    onClick={() => setModal({ tipo: 'gestion', subtarea })}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <FormularioSubtarea
          eventoId={id}
          fechaEvento={fechaDeIso(evento.fecha_hora_evento)}
          alCrear={async () => {
            const lista = await listarSubtareas(id)
            setSubtareas(lista)
            const avance = await obtenerProgreso(id)
            setProgreso(avance)
            setErrorProgreso(false)
          }}
        />
      </section>

      <ModalConfirmacion
        abierto={Boolean(modal)}
        titulo={modal?.tipo === 'gestion' ? '¿Eliminar esta gestión?' : '¿Eliminar este evento?'}
        mensaje={
          modal?.tipo === 'gestion'
            ? 'Esta subtarea logística se removerá del plan y sus horas se descontarán del cálculo de capacidad del día.'
            : `Esta acción eliminará permanentemente el evento "${evento.nombre}" y todas sus ${subtareas.length} gestiones logísticas asociadas. No se puede deshacer.`
        }
        textoConfirmar={modal?.tipo === 'gestion' ? 'Eliminar' : 'Eliminar evento'}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setModal(null)}
        cargando={eliminando}
      />
    </section>
  )

  async function marcarEjecutarSeguro(subtarea) {
    try {
      await marcarEjecutada(subtarea)
    } catch {
      setErrorGuardado(true)
    }
  }
}
