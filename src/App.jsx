import { useRef } from 'react'
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useMatch, useNavigate } from 'react-router-dom'
import { cerrarSesionRemota } from './api'
import { ProveedorSesion, useSesion } from './components/ProveedorSesion'
import Hoy from './pages/Hoy.jsx'
import Crear from './pages/Crear.jsx'
import Eventos from './pages/Eventos.jsx'
import EventoDetalle from './pages/EventoDetalle.jsx'
import Login from './pages/Login.jsx'
import Registro from './pages/Registro.jsx'
import Configuracion from './pages/Configuracion.jsx'
import { cerrarSesion, tomarAviso } from './sesion'

function RutaProtegida() {
  const { sesion, comprobando } = useSesion()
  const ubicacion = useLocation()
  const avisoRedireccion = useRef(null)

  if (comprobando) {
    return (
      <div className="pantalla-login">
        <div className="esqueleto esqueleto-bloque" aria-busy="true" />
      </div>
    )
  }

  if (!sesion) {
    // Solo hay aviso cuando la sesión se cerró o expiró. Llegar sin sesión no es un error del usuario.
    if (!avisoRedireccion.current) avisoRedireccion.current = tomarAviso()
    return (
      <Navigate
        to="/login"
        replace
        state={{ desde: ubicacion.pathname, aviso: avisoRedireccion.current }}
      />
    )
  }

  return <Outlet />
}

// "Mis eventos" también se marca dentro del detalle de un evento, que es parte de esa sección.
// NavLink solo se activa con su propia ruta, así que este enlace se marca a mano.
// En la lista es la página actual ("page"); en el detalle es la sección actual ("true").
function EnlaceMisEventos() {
  const enLista = useMatch('/eventos')
  const enDetalle = useMatch('/evento/:id')
  const actual = enLista ? 'page' : enDetalle ? 'true' : undefined
  return <Link to="/eventos" aria-current={actual}>Mis eventos</Link>
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
    navigate('/login', { replace: true, state: { aviso: 'cerrada' } })
  }

  return (
    <div className="app">
      <a className="saltar-al-contenido" href="#contenido">Saltar al contenido</a>
      <aside className="barra-lateral">
        <p className="marca"><span aria-hidden="true">⚡</span> EventFlow</p>
        <nav aria-label="Navegación principal">
          <NavLink to="/hoy">Hoy</NavLink>
          <NavLink to="/crear">+ Crear evento</NavLink>
          <EnlaceMisEventos />
          <NavLink to="/configuracion">Configuración</NavLink>
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
        <Route path="/registro" element={<Registro />} />
        <Route element={<RutaProtegida />}>
          <Route element={<Shell />}>
            {/* La raíz lleva a Hoy: es la vista de lo urgente y la primera del menú. */}
            <Route path="/" element={<Navigate to="/hoy" replace />} />
            <Route path="/hoy" element={<Hoy />} />
            <Route path="/crear" element={<Crear />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/evento/:id" element={<EventoDetalle />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/progreso" element={<Navigate to="/eventos" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<p className="pagina-ausente">Esta página no existe.</p>} />
      </Routes>
    </ProveedorSesion>
  )
}
