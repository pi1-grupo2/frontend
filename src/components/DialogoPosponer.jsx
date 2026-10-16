
import { useEffect, useRef, useState } from 'react'
import { obtenerSugerenciaPosponer } from '../api'
import { formatearFecha, formatearHoras } from '../formato'

const ENFOCABLES =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled])'

export default function DialogoPosponer({
  nombre,
  eventoId,
  subtareaId,
  fechaActual,
  fechaEvento,
  onConfirmar,
  onCerrar,
}) {
  const dialogoRef = useRef(null)
  const notaRef = useRef(null)
  const tituloConflictoRef = useRef(null)

  const [nota, setNota] = useState('')
  const [fecha, setFecha] = useState('')
  const [sugerencia, setSugerencia] = useState(null)
  const [cargandoSugerencia, setCargandoSugerencia] = useState(true)
  const [errorSugerencia, setErrorSugerencia] = useState(false)
  const [errorFecha, setErrorFecha] = useState('')
  const [errorGeneral, setErrorGeneral] = useState(false)
  const [conflicto, setConflicto] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const origen = document.activeElement
    notaRef.current?.focus()

    return () => {
      if (origen instanceof HTMLElement && document.contains(origen)) {
        origen.focus()
      }
    }
  }, [])

  useEffect(() => {
    let vigente = true

    async function consultarSugerencia() {
      setCargandoSugerencia(true)
      try {
        const respuesta = await obtenerSugerenciaPosponer(eventoId, subtareaId)
        if (!vigente) return
        setSugerencia(respuesta)
        setFecha(respuesta.fecha_sugerida ?? '')
      } catch (error) {
        if (!vigente) return
        if (error?.datos?.codigo === 'gestion_ejecutada') {
          setErrorGeneral(true)
        } else {
          setErrorSugerencia(true)
        }
      } finally {
        if (vigente) setCargandoSugerencia(false)
      }
    }

    consultarSugerencia()
    return () => {
      vigente = false
    }
  }, [eventoId, subtareaId])

  useEffect(() => {
    if (conflicto) tituloConflictoRef.current?.focus()
  }, [conflicto])

  useEffect(() => {
    function alTeclado(evento) {
      if (evento.key === 'Escape') {
        if (!guardando) onCerrar()
        return
      }

      if (evento.key !== 'Tab') return
      const elementos = Array.from(
        dialogoRef.current?.querySelectorAll(ENFOCABLES) ?? [],
      )
      if (!elementos.length) return

      const primero = elementos[0]
      const ultimo = elementos[elementos.length - 1]

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alTeclado)
    return () => document.removeEventListener('keydown', alTeclado)
  }, [guardando, onCerrar])

  function crearDatos(fechaObjetivo = '') {
    const datos = { estado: 'POSPUESTA' }

    if (fechaObjetivo) datos.fecha_objetivo = fechaObjetivo

    const notaLimpia = nota.trim()
    if (notaLimpia) datos.nota_posposicion = notaLimpia

    return datos
  }

  async function enviar(datos, confirmarSobrecarga = false) {
    setGuardando(true)
    setErrorGeneral(false)
    setErrorFecha('')
    setConflicto(null)

    try {
      await onConfirmar({
        datos: confirmarSobrecarga
          ? { ...datos, confirmar_sobrecarga: true }
          : datos,
        nota: nota.trim(),
        fechaObjetivo: datos.fecha_objetivo ?? '',
        confirmarSobrecarga,
      })
    } catch (error) {
      const respuesta = error?.datos ?? {}

      if (error?.status === 409 && respuesta.codigo === 'sobrecarga_diaria') {
        setConflicto({ ...respuesta, datos })
      } else if (error?.status === 400 && respuesta.codigo === 'dia_excedido') {
        setErrorFecha(
          `Ese día quedaría con ${formatearHoras(respuesta.horas_planificadas)} de gestión. Un día no puede superar 24 horas.`,
        )
      } else if (error?.status === 400 && respuesta.fecha_objetivo) {
        const detalle = respuesta.fecha_objetivo
        setErrorFecha(Array.isArray(detalle) ? detalle[0] : String(detalle))
      } else if (respuesta.codigo === 'gestion_ejecutada') {
        setErrorGeneral(true)
      } else {
        setErrorGeneral(true)
      }

      throw error
    } finally {
      setGuardando(false)
    }
  }

  async function intentarEnviar(datos, confirmar = false) {
    try {
      await enviar(datos, confirmar)
    } catch {
      // El error ya se representa dentro del diálogo.
    }
  }

  function posponerEnFechaSugerida() {
    if (!sugerencia?.fecha_sugerida) return
    intentarEnviar(crearDatos(sugerencia.fecha_sugerida))
  }

  function posponerEnOtraFecha(evento) {
    evento.preventDefault()
    if (!fecha) {
      setErrorFecha('Selecciona una fecha para posponer la gestión.')
      return
    }
    if (fecha < (sugerencia?.busqueda_desde ?? fechaActual)) {
      setErrorFecha('La fecha debe ser posterior a la fecha actual de la gestión.')
      return
    }
    if (fechaEvento && fecha > fechaEvento) {
      setErrorFecha('La fecha no puede superar la fecha del evento.')
      return
    }
    intentarEnviar(crearDatos(fecha))
  }

  const rangoDisponible = Boolean(
    sugerencia?.busqueda_desde && sugerencia?.busqueda_hasta,
  )

  return (
    <div className="modal-fondo">
      <div
        ref={dialogoRef}
        className="modal modal-formulario"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogo-posponer-titulo"
      >
        <h2 id="dialogo-posponer-titulo">Posponer gestión</h2>

        <p className="resumen-gestion">
          <strong>{nombre}</strong>
          <br />
          Fecha actual: {fechaActual ? formatearFecha(fechaActual) : 'Sin fecha'}
        </p>

        <div aria-live="polite" aria-atomic="true">
          {cargandoSugerencia && <p>Buscando una fecha disponible…</p>}

          {!cargandoSugerencia && sugerencia?.fecha_sugerida && (
            <div className="aviso aviso-advertencia">
              <h3>Fecha sugerida</h3>
              <p>
                {formatearFecha(sugerencia.fecha_sugerida)}
              </p>
              {sugerencia.horas_planificadas != null && (
                <p>
                  Ese día quedaría con{' '}
                  {formatearHoras(sugerencia.horas_planificadas)} de{' '}
                  {formatearHoras(sugerencia.limite_diario_horas)} planificadas.
                </p>
              )}
            </div>
          )}

          {!cargandoSugerencia && sugerencia?.fecha_sugerida == null && sugerencia && (
            <p role="status">
              No encontramos una fecha sugerida dentro del periodo del evento.
              Puedes elegir otra fecha o conservar la fecha actual.
            </p>
          )}

          {errorSugerencia && (
            <p role="status">
              No fue posible consultar una sugerencia. Puedes elegir una fecha
              o posponer sin cambiar la fecha actual.
            </p>
          )}
        </div>

        {!conflicto && (
          <form className="formulario" onSubmit={posponerEnOtraFecha} noValidate>
            <div className="campo">
              <label htmlFor="dialogo-posponer-nota">Nota</label>
              <small id="dialogo-posponer-ayuda" className="ayuda-campo">
                Opcional. Por ejemplo: esperando confirmación de salón.
              </small>
              <textarea
                ref={notaRef}
                id="dialogo-posponer-nota"
                rows={3}
                value={nota}
                onChange={(evento) => setNota(evento.target.value)}
                aria-describedby="dialogo-posponer-ayuda"
              />
            </div>

            {(rangoDisponible || errorSugerencia) && (
              <div className="campo campo-estrecho">
                <label htmlFor="dialogo-posponer-fecha">Elegir otra fecha</label>
                <input
                  id="dialogo-posponer-fecha"
                  type="date"
                  min={sugerencia?.busqueda_desde ?? fechaActual ?? undefined}
                  max={sugerencia?.busqueda_hasta ?? fechaEvento ?? undefined}
                  value={fecha}
                  onChange={(evento) => {
                    setFecha(evento.target.value)
                    setErrorFecha('')
                  }}
                  aria-invalid={Boolean(errorFecha)}
                  aria-describedby={errorFecha ? 'dialogo-posponer-error-fecha' : undefined}
                />
                {errorFecha && (
                  <p id="dialogo-posponer-error-fecha" className="error-campo" role="alert">
                    {errorFecha}
                  </p>
                )}
              </div>
            )}

            {errorGeneral && (
              <div className="aviso aviso-error" role="alert">
                <p>No se pudo posponer la gestión.</p>
                <p>La gestión no se ha actualizado. Intenta de nuevo.</p>
              </div>
            )}

            {!conflicto && (
              <div className="modal-acciones">
                {sugerencia?.fecha_sugerida && (
                  <button
                    type="button"
                    className="boton boton-primario"
                    onClick={posponerEnFechaSugerida}
                    disabled={guardando || cargandoSugerencia}
                  >
                    {guardando ? 'Guardando…' : `Posponer al ${formatearFecha(sugerencia.fecha_sugerida)}`}
                  </button>
                )}

                {(rangoDisponible || errorSugerencia) && (
                  <button type="submit" className="boton boton-secundario" disabled={guardando}>
                    Elegir esta fecha
                  </button>
                )}

                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={() => intentarEnviar(crearDatos())}
                  disabled={guardando}
                >
                  Posponer sin cambiar la fecha
                </button>

                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={onCerrar}
                  disabled={guardando}
                >
                  Cancelar
                </button>
              </div>
            )}
          </form>
        )}

        {conflicto && (
          <div className="conflicto">
            <div className="aviso aviso-advertencia" role="alert">
              <h3 ref={tituloConflictoRef} tabIndex={-1}>
                <span aria-hidden="true">⚠ </span>
                La fecha supera el límite diario
              </h3>
              <p className="cifra-conflicto">
                {formatearHoras(conflicto.horas_planificadas)}
                <span> de {formatearHoras(conflicto.limite_diario_horas)}</span>
              </p>
              <p>
                El {conflicto.fecha && formatearFecha(conflicto.fecha)} quedaría
                con {formatearHoras(conflicto.horas_planificadas)} planificadas.
                El límite diario es {formatearHoras(conflicto.limite_diario_horas)}.
                Todavía no se ha guardado nada.
              </p>
            </div>

            {conflicto.fecha_sugerida && (
              <div className="modal-acciones">
                <button
                  type="button"
                  className="boton boton-primario"
                  onClick={() =>
                    intentarEnviar(
                      { ...conflicto.datos, fecha_objetivo: conflicto.fecha_sugerida },
                    )
                  }
                  disabled={guardando}
                >
                  Mover al {formatearFecha(conflicto.fecha_sugerida)}
                </button>
              </div>
            )}

            <div className="salidas-conflicto">
              <button
                type="button"
                className="enlace-boton"
                onClick={() => intentarEnviar(conflicto.datos, true)}
                disabled={guardando}
              >
                Guardar aunque supere el límite
              </button>
              <button
                type="button"
                className="enlace-boton"
                onClick={() => setConflicto(null)}
                disabled={guardando}
              >
                Volver
              </button>
              <button
                type="button"
                className="enlace-boton"
                onClick={onCerrar}
                disabled={guardando}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
