export default function TarjetaProgreso({ progreso, cargando, error, onReintentar }) {
  if (cargando) {
    return (
      <section className="tarjeta-progreso" aria-busy="true">
        <div className="esqueleto esqueleto-circulo" />
        <div>
          <div className="esqueleto esqueleto-linea" />
          <div className="esqueleto esqueleto-linea esqueleto-corta" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="tarjeta-progreso tarjeta-progreso-error" role="alert">
        <div className="circulo-progreso circulo-error" aria-hidden="true">✕</div>
        <div>
          <h2>Progreso de Preparación del Evento</h2>
          <p>No se han podido cargar las gestiones del evento.</p>
          <div className="barra-progreso barra-error" />
          {onReintentar && (
            <button type="button" className="boton boton-secundario" onClick={onReintentar}>
              Intentar de nuevo
            </button>
          )}
        </div>
      </section>
    )
  }

  const total = progreso?.total_subtareas ?? 0
  const hechas = progreso?.subtareas_ejecutadas ?? 0
  const porcentaje = progreso?.progreso ?? 0

  if (total === 0) {
    return (
      <section className="tarjeta-progreso tarjeta-progreso-vacio" role="status">
        <div className="circulo-progreso circulo-exito" aria-hidden="true">✓</div>
        <div>
          <h2>Progreso de Preparación del Evento</h2>
          <p>Aún no tienes gestiones planificadas para este evento.</p>
          <div className="barra-progreso barra-exito" />
        </div>
      </section>
    )
  }

  return (
    <section className="tarjeta-progreso" role="status">
      <div
        className="circulo-progreso circulo-activo"
        aria-label={`${porcentaje} por ciento`}
      >
        {porcentaje}%
      </div>
      <div>
        <h2>Progreso de Preparación del Evento</h2>
        <p>
          {hechas} de {total} gestiones logísticas ejecutadas
          {progreso?.nombre ? ` en ${progreso.nombre}` : ''}
        </p>
        <div className="barra-progreso" aria-hidden="true">
          <span style={{ width: `${porcentaje}%` }} />
        </div>
      </div>
    </section>
  )
}
