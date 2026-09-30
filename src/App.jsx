import { NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { cerrarSesionRemota } from './api'
import { ProveedorSesion, useSesion } from './components/ProveedorSesion'
import Hoy from './pages/Hoy.jsx'
import Crear from './pages/Crear.jsx'
import Eventos from './pages/Eventos.jsx'
import EventoDetalle from './pages/EventoDetalle.jsx'
import Login from './pages/Login.jsx'
import { cerrarSesion } from './sesion'

function RutaProtegida() {
  const { sesion, comprobando } = useSesion()
  const ubicacion = useLocation()

  if (comprobando) {
    return (
      <div className="pantalla-login">
        <div className="esqueleto esqueleto-bloque" aria-busy="true" />
      </div>
    )
  }

  if (!sesion) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  return <Outlet />
}

function Shell() {
  const { sesion } = useSesion()
  const navigate = useNavigate()

  async function salir() {
    try {
      await cerrarSesionRemota()
    } catch {
      // Si la API no responde, la sesión de este navegador se cierra igual.
    }
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app">
      <a className="saltar-al-contenido" href="#contenido">Saltar al contenido</a>
      <aside className="barra-lateral">
        <p className="marca"><span aria-hidden="true">⚡</span> EventFlow</p>
        <nav aria-label="Navegación principal">
          <NavLink to="/hoy">Hoy</NavLink>
          <NavLink to="/crear">+ Crear evento</NavLink>
          <NavLink to="/eventos">Mis eventos</NavLink>
        </nav>
        <p className="sesion-usuario">{sesion?.organizador?.nombre}</p>
        <button type="button" className="boton-salir" onClick={salir}>Cerrar sesión</button>
      </aside>
      <div className="lienzo">
        <main id="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ProveedorSesion>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RutaProtegida />}>
          <Route element={<Shell />}>
            <Route path="/" element={<Navigate to="/eventos" replace />} />
            <Route path="/hoy" element={<Hoy />} />
            <Route path="/crear" element={<Crear />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/evento/:id" element={<EventoDetalle />} />
            <Route path="/progreso" element={<Navigate to="/eventos" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<p className="pagina-ausente">Esta página no existe.</p>} />
      </Routes>
    </ProveedorSesion>
  )
}
