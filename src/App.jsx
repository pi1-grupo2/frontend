import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Hoy from './pages/Hoy.jsx'
import Crear from './pages/Crear.jsx'
import Eventos from './pages/Eventos.jsx'
import EventoDetalle from './pages/EventoDetalle.jsx'

export default function App() {
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
      </aside>
      <div className="lienzo">
        <main id="contenido">
          <Routes>
            <Route path="/" element={<Navigate to="/eventos" replace />} />
            <Route path="/hoy" element={<Hoy />} />
            <Route path="/crear" element={<Crear />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/evento/:id" element={<EventoDetalle />} />
            <Route path="/progreso" element={<Navigate to="/eventos" replace />} />
            <Route path="*" element={<p>Esta página no existe.</p>} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
