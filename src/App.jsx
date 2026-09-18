import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Hoy from './pages/Hoy.jsx'
import Crear from './pages/Crear.jsx'
import EventoDetalle from './pages/EventoDetalle.jsx'
import Progreso from './pages/Progreso.jsx'
import EstadoServicio from './EstadoServicio.jsx'

export default function App() {
  return (
    <div className="contenedor">
      <a className="saltar-al-contenido" href="#contenido">
        Saltar al contenido
      </a>

      <header>
        <h1>Organizador de Eventos</h1>
        <nav aria-label="Navegación principal">
          <ul>
            <li><NavLink to="/hoy">Hoy</NavLink></li>
            <li><NavLink to="/crear">Crear evento</NavLink></li>
            <li><NavLink to="/progreso">Progreso</NavLink></li>
          </ul>
        </nav>
      </header>

      <main id="contenido">
        <Routes>
          {/* Las cuatro rutas que define la arquitectura de informacion del Sprint 0.
              Por ahora son pantallas vacias: el criterio C7 pide que la SPA corra,
              no que las vistas esten implementadas. Eso llega desde el Sprint 1. */}
          <Route path="/" element={<Navigate to="/hoy" replace />} />
          <Route path="/hoy" element={<Hoy />} />
          <Route path="/crear" element={<Crear />} />
          <Route path="/evento/:id" element={<EventoDetalle />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="*" element={<p>Esta página no existe.</p>} />
        </Routes>
      </main>

      <footer>
        <EstadoServicio />
      </footer>
    </div>
  )
}
