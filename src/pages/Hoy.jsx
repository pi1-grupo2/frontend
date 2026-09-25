import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarEventos, listarSubtareas } from '../api'
import { etiquetaSituacion } from '../formato'

export default function Hoy() {
  const [gestiones, setGestiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let vigente = true

    async function cargar() {
      setCargando(true)
      setError(false)
      try {
        const eventos = await listarEventos()
        const grupos = await Promise.all(
          eventos.map(async (evento) => {
            const subtareas = await listarSubtareas(evento.id)
            return subtareas
              .filter((subtarea) => subtarea.situacion === 'PARA_HOY' || subtarea.situacion === 'VENCIDA')
              .map((subtarea) => ({ ...subtarea, eventoNombre: evento.nombre, eventoId: evento.id }))
          }),
        )
        if (vigente) setGestiones(grupos.flat())
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
        <ul className="lista-gestiones">
          {gestiones.map((gestion) => (
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
