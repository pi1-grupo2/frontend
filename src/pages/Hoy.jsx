import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarEventos, listarSubtareas } from '../api'
import { etiquetaSituacion } from '../formato'

const ESTADOS_FILTRO = [
  { value: 'VENCIDA', label: 'Vencida' },
  { value: 'PARA_HOY', label: 'Para hoy' },
]

export default function Hoy() {
  const [eventos, setEventos] = useState([])
  const [gestiones, setGestiones] = useState([])
  const [filtroEvento, setFiltroEvento] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let vigente = true

    async function cargar() {
      setCargando(true)
      setError(false)
      try {
        const listaEventos = await listarEventos()
        const grupos = await Promise.all(
          listaEventos.map(async (evento) => {
            const subtareas = await listarSubtareas(evento.id)
            return subtareas
              .filter((subtarea) => subtarea.situacion === 'PARA_HOY' || subtarea.situacion === 'VENCIDA')
              .map((subtarea) => ({ ...subtarea, eventoNombre: evento.nombre, eventoId: evento.id }))
          }),
        )
        if (!vigente) return
        setEventos(listaEventos)
        setGestiones(grupos.flat())
      } catch {
        if (vigente) setError(true)
      } finally {
        if (vigente) setCargando(false)
      }
    }

    cargar()
    return () => {
      vigente = false
    }
  }, [])

  const filtrosActivos = filtroEvento !== '' || filtroEstado !== ''

  const visibles = useMemo(() => {
    return gestiones.filter((gestion) => {
      if (filtroEvento && String(gestion.eventoId) !== filtroEvento) return false
      if (filtroEstado && gestion.situacion !== filtroEstado) return false
      return true
    })
  }, [gestiones, filtroEvento, filtroEstado])

  function limpiarFiltros() {
    setFiltroEvento('')
    setFiltroEstado('')
  }

  return (
    <section className="pagina">
      <h1>Hoy</h1>
      <p className="intro">Gestiones vencidas y las que debes resolver hoy.</p>

      {cargando && <div className="esqueleto esqueleto-bloque" aria-busy="true" />}

      {error && (
        <div className="aviso aviso-error" role="alert">
          <h2>No se pudieron cargar las gestiones</h2>
          <p>Tuvimos un inconveniente al conectar con el servidor.</p>
        </div>
      )}

      {!cargando && !error && gestiones.length === 0 && (
        <div className="estado-vacio">
          <div className="icono-estado" aria-hidden="true">📖</div>
          <h2>No tienes gestiones para hoy</h2>
          <p>Cuando una gestión venza o tenga fecha de hoy, aparecerá en esta lista.</p>
          <Link className="boton boton-primario" to="/crear">+ Crear nuevo evento</Link>
        </div>
      )}

      {!cargando && !error && gestiones.length > 0 && (
        <form className="filtros" onSubmit={(evento) => evento.preventDefault()}>
          <div className="campo">
            <label htmlFor="filtro-evento">Evento</label>
            <select
              id="filtro-evento"
              value={filtroEvento}
              onChange={(evento) => setFiltroEvento(evento.target.value)}
            >
              <option value="">Todos los eventos</option>
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>{evento.nombre}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="filtro-estado">Estado</label>
            <select
              id="filtro-estado"
              value={filtroEstado}
              onChange={(evento) => setFiltroEstado(evento.target.value)}
            >
              <option value="">Todos los estados</option>
              {ESTADOS_FILTRO.map((estado) => (
                <option key={estado.value} value={estado.value}>{estado.label}</option>
              ))}
            </select>
          </div>
          {filtrosActivos && (
            <button type="button" className="boton boton-secundario" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          )}
        </form>
      )}

      {!cargando && !error && gestiones.length > 0 && visibles.length === 0 && (
        <div className="estado-vacio" role="status">
          <div className="icono-estado icono-error" aria-hidden="true">!</div>
          <h2>Ninguna gestión coincide con los filtros</h2>
          <p>Prueba con otro evento o estado, o quita los filtros para volver a ver todas las gestiones.</p>
          <button type="button" className="boton boton-primario" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      )}

      {!cargando && !error && visibles.length > 0 && (
        <ul className="lista-gestiones" aria-live="polite">
          {visibles.map((gestion) => (
            <li key={gestion.id} className="tarjeta-gestion">
              <div className="encabezado-gestion">
                <h2>{gestion.nombre}</h2>
                <span className={`insignia insignia-${gestion.situacion.toLowerCase()}`}>
                  {etiquetaSituacion(gestion.situacion)}
                </span>
              </div>
              <p>{gestion.eventoNombre}</p>
              <p>Horas estimadas: <strong>{gestion.horas_estimadas}</strong></p>
              <p>Plazo: <strong>{gestion.fecha_objetivo}</strong></p>
              <Link to={`/evento/${gestion.eventoId}`}>Ver evento</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
