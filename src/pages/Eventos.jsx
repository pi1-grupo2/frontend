import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { listarEventos, obtenerOrganizador } from '../api'
import Toast from '../components/Toast'
import { etiquetaTipo, formatearFechaHora } from '../formato'

export default function Eventos() {
  const ubicacion = useLocation()
  const [toast, setToast] = useState(ubicacion.state?.toast ?? null)
  const [eventos, setEventos] = useState([])
  const [organizador, setOrganizador] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  const cargar = useCallback(() => {
    let vigente = true
    setCargando(true)
    setError(false)

    obtenerOrganizador()
      .then((persona) => {
        if (vigente) setOrganizador(persona)
      })
      .catch(() => {})

    listarEventos()
      .then((lista) => {
        if (vigente) setEventos(lista)
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
  }, [])

  useEffect(() => cargar(), [cargar])

  return (
    <section className="pagina">
      {toast && <Toast titulo={toast.titulo} mensaje={toast.mensaje} onClose={() => setToast(null)} />}
      <header className="encabezado-pagina">
        <h1>Mis Eventos</h1>
        {organizador && (
          <p className="chip-usuario">
            <span aria-hidden="true">👤</span> {organizador.nombre} (Organizador)
          </p>
        )}
      </header>

      {cargando && (
        <div className="esqueleto esqueleto-bloque" aria-busy="true">
          <p className="solo-lectores">Cargando eventos...</p>
        </div>
      )}

      {error && (
        <div>
          <section className="tarjeta-progreso tarjeta-progreso-error" role="alert">
            <div className="circulo-progreso circulo-error" aria-hidden="true">✕</div>
            <div>
              <h2>Progreso General de Eventos</h2>
              <p>No se pudieron calcular las métricas de capacidad.</p>
              <div className="barra-progreso barra-error" />
            </div>
          </section>
          <div className="estado-vacio">
            <div className="icono-estado icono-error" aria-hidden="true">!</div>
            <p>Ha ocurrido un error cargando los eventos del sistema.</p>
            <button type="button" className="boton boton-secundario" onClick={cargar}>
              Intentar de nuevo
            </button>
          </div>
        </div>
      )}

      {!cargando && !error && eventos.length === 0 && (
        <div className="estado-vacio">
          <div className="icono-estado" aria-hidden="true">📖</div>
          <h2>No tienes eventos creados</h2>
          <p>
            Comienza planificando tu primer evento y desglosa sus gestiones
            logísticas para organizar tu tiempo.
          </p>
          <Link className="boton boton-primario" to="/crear">+ Crear nuevo evento</Link>
        </div>
      )}

      {!cargando && !error && eventos.length > 0 && (
        <ul className="lista-eventos">
          {eventos.map((evento) => (
            <li key={evento.id}>
              <article className="tarjeta-evento">
                <div>
                  <h2>{evento.nombre}</h2>
                  <p>{etiquetaTipo(evento.tipo)}</p>
                  <p>{formatearFechaHora(evento.fecha_hora_evento)}</p>
                  <p>{evento.lugar}</p>
                </div>
                <Link className="boton boton-primario" to={`/evento/${evento.id}`}>Ver detalle</Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
