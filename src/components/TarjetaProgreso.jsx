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
          <h2>No se pudo cargar el progreso</h2>
          <p>No llegaron las gestiones de este evento. Intenta de nuevo.</p>
          <div className="barra-progreso barra-error" />
          {onReintentar && (
            <button type="button" className="boton boton-secundario" onClick={onReintentar}>
              Reintentar
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
        <div className="circulo-progreso" aria-label="0 por ciento">0%</div>
        <div>
          <h2>Progreso de preparación</h2>
          <p>Este evento aún no tiene gestiones. Agrégalas en el detalle para empezar a medir el avance.</p>
          <div className="barra-progreso" aria-hidden="true" />
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
        <h2>Progreso de preparación</h2>
        <p>
          {hechas} de {total} gestiones ejecutadas
          {progreso?.nombre ? ` en ${progreso.nombre}` : ''}
        </p>
        
<div
  className="barra-progreso"
  role="progressbar"
  aria-label="Progreso de preparación"
  aria-valuenow={porcentaje}
  aria-valuemin={0}
  aria-valuemax={100}
>
  <span style={{ width: `${porcentaje}%` }} />
</div>

      </div>
    </section>
  )
}
