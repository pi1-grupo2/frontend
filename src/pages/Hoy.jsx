import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { listarEventos, listarSubtareas } from '../api'
import Toast from '../components/Toast'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const ORDEN_GRUPOS = ['VENCIDA', 'PARA_HOY', 'PROXIMA']
const TITULOS = {
  VENCIDA: 'Vencidas',
  PARA_HOY: 'Para hoy',
  PROXIMA: 'Próximos 7 días',
}
const VACIO = {
  VENCIDA: 'Sin gestiones vencidas.',
  PARA_HOY: 'Sin gestiones para hoy.',
  PROXIMA: 'Sin gestiones en los próximos 7 días.',
}
const VACIO_FILTRO = {
  VENCIDA: 'Sin gestiones vencidas con estos filtros.',
  PARA_HOY: 'Sin gestiones para hoy con estos filtros.',
  PROXIMA: 'Sin gestiones en los próximos 7 días con estos filtros.',
}
const REGLA = 'Primero las vencidas, luego las de hoy y las de los próximos 7 días. En cada grupo va arriba la de fecha y hora más temprana. Si coinciden, la de menos horas estimadas.'

// A qué grupo de /hoy pertenece una gestión. Lo usan el filtro por estado y el armado
// de los grupos, para que los dos clasifiquen igual.
function grupoDe(gestion, hoy) {
  if (gestion.fecha_objetivo < hoy) return 'VENCIDA'
  if (gestion.fecha_objetivo === hoy) return 'PARA_HOY'
  return 'PROXIMA'
}

function hoyBogota() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function sumarDias(iso, dias) {
  const [anio, mes, dia] = iso.split('-').map(Number)
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

function diasEntre(desde, hasta) {
  const [anio, mes, dia] = desde.split('-').map(Number)
  const [anioHasta, mesHasta, diaHasta] = hasta.split('-').map(Number)
  const inicio = Date.UTC(anio, mes - 1, dia)
  const fin = Date.UTC(anioHasta, mesHasta - 1, diaHasta)
  return Math.round((fin - inicio) / 86400000)
}

function fechaCorta(iso, hoy) {
  if (iso === hoy) return 'Hoy'
  const [, mes, dia] = iso.split('-').map(Number)
  return `${dia} ${MESES[mes - 1]}`
}

function etiquetaVencida(fecha, hoy) {
  const dias = diasEntre(fecha, hoy)
  return dias === 1 ? 'Vencida · hace 1 día' : `Vencida · hace ${dias} días`
}

function ordenarGestiones(lista) {
  return [...lista].sort((a, b) => {
    if (a.fecha_objetivo !== b.fecha_objetivo) {
      return a.fecha_objetivo < b.fecha_objetivo ? -1 : 1
    }
    const horaA = a.hora_objetivo || '99:99'
    const horaB = b.hora_objetivo || '99:99'
    if (horaA !== horaB) return horaA < horaB ? -1 : 1
    const esfuerzo = Number(a.horas_estimadas) - Number(b.horas_estimadas)
    if (esfuerzo !== 0) return esfuerzo
    const creadaA = a.creado_en || ''
    const creadaB = b.creado_en || ''
    if (creadaA !== creadaB) return creadaA < creadaB ? -1 : 1
    return a.id - b.id
  })
}

function textoConteo(cantidad) {
  return cantidad === 1 ? 'Se muestra 1 gestión.' : `Se muestran ${cantidad} gestiones.`
}

export default function Hoy() {
  const ubicacion = useLocation()
  const filtroEventoRef = useRef(null)
  const cerrarReglaRef = useRef(null)
  const [cuentaCreada, setCuentaCreada] = useState(Boolean(ubicacion.state?.cuentaCreada))
  const [eventos, setEventos] = useState([])
  const [gestiones, setGestiones] = useState([])
  const [filtroEvento, setFiltroEvento] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [consulta, setConsulta] = useState(0)
  const [reglaAbierta, setReglaAbierta] = useState(false)
  const hoy = hoyBogota()
  const limite = sumarDias(hoy, 7)

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
            return subtareas.map((subtarea) => ({
              ...subtarea,
              eventoNombre: evento.nombre,
              eventoId: evento.id,
            }))
          }),
        )
        if (!vigente) return
        setEventos([...listaEventos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))
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
  }, [consulta])

  useEffect(() => {
    if (!reglaAbierta) return undefined
    cerrarReglaRef.current?.focus()
    function tecla(evento) {
      if (evento.key === 'Escape') setReglaAbierta(false)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [reglaAbierta])

  const filtrosActivos = filtroEvento !== '' || filtroEstado !== ''

  const activas = useMemo(() => {
    return gestiones.filter((gestion) => (gestion.estado ?? 'PENDIENTE') !== 'EJECUTADA')
  }, [gestiones])

  const enVentana = useMemo(() => {
    return ordenarGestiones(activas.filter((gestion) => gestion.fecha_objetivo <= limite))
  }, [activas, limite])

  const visibles = useMemo(() => {
    return enVentana.filter((gestion) => {
      if (filtroEvento && String(gestion.eventoId) !== filtroEvento) return false
      if (filtroEstado && grupoDe(gestion, hoy) !== filtroEstado) return false
      return true
    })
  }, [enVentana, filtroEvento, filtroEstado, hoy])

  const grupos = useMemo(() => {
    const porGrupo = { VENCIDA: [], PARA_HOY: [], PROXIMA: [] }
    visibles.forEach((gestion) => {
      porGrupo[grupoDe(gestion, hoy)].push(gestion)
    })
    const proximas = porGrupo.PROXIMA
    porGrupo.PROXIMA = proximas.slice(0, 20)
    return {
      listas: porGrupo,
      fuera: proximas.length - porGrupo.PROXIMA.length,
    }
  }, [visibles, hoy])

  const totalVisible = ORDEN_GRUPOS.reduce((suma, id) => suma + grupos.listas[id].length, 0)
  const hayDatos = enVentana.length > 0
  const mostrarGrupos = hayDatos && (!filtrosActivos || totalVisible > 0)
  // Con filtro por estado solo se muestra el grupo elegido. Los otros dos quedarían vacíos
  // repitiendo lo que el usuario acaba de pedir.
  const gruposEnPantalla = filtroEstado ? [filtroEstado] : ORDEN_GRUPOS

  function limpiarFiltros() {
    setFiltroEvento('')
    setFiltroEstado('')
    filtroEventoRef.current?.focus()
  }

  return (
    <section className="pagina">
      {cuentaCreada && <Toast titulo="Cuenta creada." mensaje="" onClose={() => setCuentaCreada(false)} />}
      <h1>Hoy</h1>
      <p className="intro intro-pagina">Gestiones vencidas, para hoy y de los próximos 7 días.</p>

      {!cargando && !error && (
        <div className="regla-orden">
          <button
            type="button"
            className="enlace-boton"
            aria-expanded={reglaAbierta}
            onClick={() => setReglaAbierta(true)}
          >
            ¿Cómo se ordena esto?
          </button>
          {reglaAbierta && (
            <div className="panel-regla" role="dialog" aria-labelledby="titulo-regla">
              <h2 id="titulo-regla">Orden de las gestiones</h2>
              <p>{REGLA}</p>
              <button ref={cerrarReglaRef} type="button" className="boton boton-secundario" onClick={() => setReglaAbierta(false)}>
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}

      {cargando && (
        <div aria-live="polite">
          <p className="solo-lectores">Cargando gestiones.</p>
          <div className="esqueletos-hoy" aria-hidden="true">
            <div className="esqueleto esqueleto-bloque" />
            <div className="esqueleto esqueleto-bloque" />
            <div className="esqueleto esqueleto-bloque" />
          </div>
        </div>
      )}

      {error && (
        <div className="estado-vacio" role="alert">
          <h2>No se pudieron cargar las gestiones</h2>
          <p>Ocurrió un problema al obtener la información. Si el error continúa, conviene revisar la conexión a internet.</p>
          <button type="button" className="boton boton-primario" onClick={() => setConsulta((valor) => valor + 1)}>
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && gestiones.length === 0 && (
        <div className="estado-vacio">
          <h2>Sin gestiones todavía</h2>
          <p>Las gestiones de cada evento aparecen aquí, ordenadas por fecha.</p>
          <Link className="boton boton-primario" to="/crear">Crear evento</Link>
        </div>
      )}

      {!cargando && !error && gestiones.length > 0 && !hayDatos && (
        <div className="estado-vacio">
          <h2>Agenda al día</h2>
          <p>No hay gestiones vencidas ni con fecha en los próximos 7 días.</p>
          <Link className="boton boton-secundario" to="/eventos">Ver mis eventos</Link>
        </div>
      )}

      {!cargando && !error && hayDatos && (
        <form className="filtros" onSubmit={(evento) => evento.preventDefault()}>
          <div className="campo">
            <label htmlFor="filtro-evento">Evento</label>
            <select
              ref={filtroEventoRef}
              id="filtro-evento"
              className={filtroEvento ? 'selector-activo' : undefined}
              value={filtroEvento}
              onChange={(evento) => setFiltroEvento(evento.target.value)}
            >
              <option value="">Todos</option>
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>{evento.nombre}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="filtro-estado">Estado</label>
            <select
              id="filtro-estado"
              className={filtroEstado ? 'selector-activo' : undefined}
              value={filtroEstado}
              onChange={(evento) => setFiltroEstado(evento.target.value)}
            >
              {/* Solo estados que el usuario puede producir hoy. "Pospuestas" regresa
                  cuando exista la acción de posponer (US-09, Sprint 4). */}
              <option value="">Todos</option>
              <option value="VENCIDA">Vencidas</option>
              <option value="PARA_HOY">Para hoy</option>
              <option value="PROXIMA">Próximas</option>
            </select>
          </div>
        </form>
      )}

      {!cargando && !error && hayDatos && (
        <p className="linea-resultado" aria-live="polite">
          {textoConteo(totalVisible)}
          {filtrosActivos && (
            <button type="button" className="enlace-boton" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          )}
        </p>
      )}

      {!cargando && !error && hayDatos && filtrosActivos && totalVisible === 0 && (
        <div className="estado-vacio" role="status">
          <h2>Sin resultados</h2>
          <p>Ninguna gestión coincide con los filtros elegidos.</p>
          <button type="button" className="boton boton-secundario" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      )}

      {mostrarGrupos && (
        <div>
          {gruposEnPantalla.map((id) => {
            const lista = grupos.listas[id]
            return (
              <section
                key={id}
                className={`grupo-prioridad grupo-${id.toLowerCase()} ${id === 'PROXIMA' ? 'grupo-segundo-plano' : 'grupo-primer-plano'}`}
                aria-labelledby={`grupo-${id}`}
              >
                <h2 id={`grupo-${id}`}>{TITULOS[id]} · {lista.length}</h2>
                {lista.length === 0 && (
                  <p className="apoyo-grupo">{filtrosActivos ? VACIO_FILTRO[id] : VACIO[id]}</p>
                )}
                {lista.length > 0 && (
                  <ul className="lista-gestiones">
                    {lista.map((gestion) => (
                      <li key={gestion.id} className={`tarjeta-gestion ${id === 'PROXIMA' ? 'tarjeta-compacta' : ''}`}>
                        <p className="fecha-gestion">{fechaCorta(gestion.fecha_objetivo, hoy)}</p>
                        <div className="encabezado-gestion">
                          <h3>{gestion.nombre}</h3>
                          {id === 'VENCIDA' && (
                            <span className="insignia insignia-vencida">{etiquetaVencida(gestion.fecha_objetivo, hoy)}</span>
                          )}
                          {gestion.estado === 'POSPUESTA' && (
                            <span className="insignia insignia-pospuesta">Pospuesta</span>
                          )}
                        </div>
                        {id === 'PROXIMA' ? (
                          <p>{gestion.eventoNombre} · {gestion.horas_estimadas} h</p>
                        ) : (
                          <>
                            <p>{gestion.eventoNombre}</p>
                            <p>Horas estimadas: <strong>{gestion.horas_estimadas}</strong></p>
                          </>
                        )}
                        <Link to={`/evento/${gestion.eventoId}`}>Ver evento</Link>
                      </li>
                    ))}
                  </ul>
                )}
                {id === 'PROXIMA' && grupos.fuera > 0 && (
                  <p className="apoyo-grupo">
                    {grupos.fuera === 1
                      ? 'Queda 1 gestión por fuera de esta lista.'
                      : `Quedan ${grupos.fuera} gestiones por fuera de esta lista.`}
                  </p>
                )}
              </section>
            )
          })}
        </div>
      )}
    </section>
  )
}
