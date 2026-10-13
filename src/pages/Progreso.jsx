import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarEventos, obtenerProgreso } from '../api'
import TarjetaProgreso from '../components/TarjetaProgreso'

export default function Progreso() {
  const [eventos, setEventos] = useState([])
  const [estado, setEstado] = useState('cargando')
  const [consulta, setConsulta] = useState(0)

  const cargar = useCallback(() => {
    let vigente = true
    setEstado('cargando')
    listarEventos()
      .then(async (lista) => {
        const conAvance = await Promise.all(lista.map(async (evento) => ({
          ...evento,
          avance: await obtenerProgreso(evento.id),
        })))
        if (!vigente) return
        setEventos(conAvance.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))
        setEstado('listo')
      })
      .catch(() => {
        if (vigente) setEstado('error')
      })
    return () => {
      vigente = false
    }
  }, [])

  useEffect(() => cargar(), [cargar, consulta])

  return (
    <section className="pagina">
      <h1>Progreso</h1>
      <p className="intro intro-pagina">
        Cuánto de la preparación de cada evento ya está hecho. El porcentaje es las gestiones ejecutadas sobre el total.
      </p>

      {estado === 'cargando' && (
        <div role="status">
          <span className="solo-lectores">Cargando el progreso de tus eventos...</span>
          <div className="esqueleto esqueleto-bloque" aria-hidden="true" />
        </div>
      )}

      {estado === 'error' && (
        <div className="aviso aviso-error" role="alert">
          <h2>No se pudo cargar el progreso</h2>
          <p>No llegaron los datos de tus eventos. Revisa la conexión e intenta de nuevo.</p>
          <button type="button" className="boton boton-primario" onClick={() => setConsulta((n) => n + 1)}>
            Reintentar
          </button>
        </div>
      )}

      {estado === 'listo' && eventos.length === 0 && (
        <div className="estado-vacio" role="status">
          <h2>Todavía no tienes eventos</h2>
          <p>Crea un evento y su plan logístico para ver cuánto falta para tenerlo listo.</p>
          <Link className="boton boton-primario" to="/crear">Crear evento</Link>
        </div>
      )}

      {estado === 'listo' && eventos.length > 0 && (
        <ul className="lista-progreso">
          {eventos.map((evento) => (
            <li key={evento.id}>
              <TarjetaProgreso progreso={evento.avance} />
              <p className="enlace-progreso">
                <Link to={`/evento/${evento.id}`}>Ver las gestiones de {evento.nombre}</Link>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
