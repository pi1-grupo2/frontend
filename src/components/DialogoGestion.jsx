import { useEffect, useRef, useState } from 'react'
import { actualizarSubtarea } from '../api'
import { formatearFecha, formatearHoras, hoyBogota } from '../formato'

// Textos provisionales. Los definitivos los entrega UX (tareas #192, #205 y #218): se cambian aquí.
const TEXTOS = {
  tituloEditar: 'Editar gestión',
  tituloReprogramar: 'Reprogramar gestión',
  nombre: 'Nombre de la gestión',
  horas: 'Horas estimadas',
  ayudaHoras: 'Se aceptan medias horas, por ejemplo 1,5.',
  fecha: 'Fecha objetivo',
  fechaNueva: 'Nueva fecha',
  guardar: 'Guardar cambios',
  reprogramar: 'Reprogramar',
  guardando: 'Guardando...',
  cancelar: 'Cancelar',
  errorNombre: 'El nombre de la gestión es obligatorio.',
  errorHoras: 'Las horas estimadas deben ser un valor mayor a 0, por ejemplo 1,5 o 3.',
  errorFechaVacia: 'La fecha objetivo es obligatoria.',
  errorFechaPasada: 'La nueva fecha no puede ser anterior al día de hoy.',
  errorFechaEvento: 'El plazo de la gestión no puede ser posterior a la fecha del evento.',
  errorMismaFecha: 'Elegir una fecha distinta a la actual.',
  errorGeneralTitulo: 'No fue posible guardar los cambios.',
  errorGeneralApoyo: 'Lo escrito se conserva. Intentar de nuevo en unos minutos.',
  tituloConflicto: 'Ese día quedaría con sobrecarga',
  preguntaConflicto: '¿Cómo resolverlo?',
  otraFecha: 'Elegir otra fecha',
  reducir: 'Reducir horas',
  horasReducidas: 'Horas estimadas de esta gestión',
  guardarReducidas: 'Guardar con menos horas',
  errorReducir: 'Indicar un valor mayor a 0 y menor que las horas actuales.',
  conSobrecarga: 'Guardar con sobrecarga',
}

const ENFOCABLES = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled])'

/**
 * Diálogo para cambiar una gestión. Tiene dos modos:
 * - "editar": nombre, horas y fecha (US-03). Se abre desde el detalle del evento.
 * - "reprogramar": solo la fecha (US-06). Se abre desde /hoy.
 * Los dos guardan con el mismo PATCH y comparten el aviso de sobrecarga (US-07) y su resolución (US-08).
 */
export default function DialogoGestion({ modo, gestion, eventoId, fechaEvento, onCerrar, onGuardada }) {
  const dialogoRef = useRef(null)
  const primerCampoRef = useRef(null)
  const horasRef = useRef(null)
  const fechaRef = useRef(null)
  const tituloConflictoRef = useRef(null)
  const horasReducidasRef = useRef(null)
  const horasActuales = Number(gestion.horas_estimadas)

  const [nombre, setNombre] = useState(gestion.nombre)
  const [horas, setHoras] = useState(String(horasActuales))
  const [fecha, setFecha] = useState(gestion.fecha_objetivo)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(false)
  const [guardando, setGuardando] = useState(false)
  // Cuando la API avisa sobrecarga: las cifras del día y los datos que se intentaron guardar.
  const [conflicto, setConflicto] = useState(null)
  const [reduciendo, setReduciendo] = useState(false)
  const [horasReducidas, setHorasReducidas] = useState('')
  const [errorReducir, setErrorReducir] = useState('')

  const esEdicion = modo === 'editar'
  const titulo = esEdicion ? TEXTOS.tituloEditar : TEXTOS.tituloReprogramar

  // Al abrir, el foco entra al primer campo. Al cerrar, vuelve al botón que abrió el diálogo.
  useEffect(() => {
    const origen = document.activeElement
    primerCampoRef.current?.focus()
    return () => {
      if (origen instanceof HTMLElement && document.contains(origen)) origen.focus()
    }
  }, [])

  // Escape cierra y Tab no se sale del diálogo.
  useEffect(() => {
    function alTeclado(evento) {
      if (evento.key === 'Escape') {
        if (!guardando) onCerrar()
        return
      }
      if (evento.key !== 'Tab') return
      const enfocables = Array.from(dialogoRef.current?.querySelectorAll(ENFOCABLES) ?? [])
      if (enfocables.length === 0) return
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      // El título del aviso recibe el foco sin ser un control: desde ahí, Shift+Tab tampoco puede salirse.
      const enTitulo = !enfocables.includes(document.activeElement)
      if (evento.shiftKey && (document.activeElement === primero || enTitulo)) {
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

  // El foco acompaña cada cambio de paso, para que teclado y lector de pantalla no se pierdan.
  useEffect(() => {
    if (conflicto) tituloConflictoRef.current?.focus()
  }, [conflicto])
  useEffect(() => {
    if (reduciendo) horasReducidasRef.current?.focus()
  }, [reduciendo])

  function validar() {
    const fallo = {}
    if (esEdicion) {
      if (!nombre.trim()) fallo.nombre = TEXTOS.errorNombre
      if (horas === '' || Number.isNaN(Number(horas)) || Number(horas) <= 0) fallo.horas = TEXTOS.errorHoras
    }
    const cambioFecha = fecha !== gestion.fecha_objetivo
    if (!fecha) fallo.fecha = TEXTOS.errorFechaVacia
    else if (cambioFecha && fecha < hoyBogota()) fallo.fecha = TEXTOS.errorFechaPasada
    else if (cambioFecha && fechaEvento && fecha > fechaEvento) fallo.fecha = TEXTOS.errorFechaEvento
    else if (!esEdicion && !cambioFecha) fallo.fecha = TEXTOS.errorMismaFecha
    return fallo
  }

  // Solo viaja a la API lo que cambió.
  function cambios() {
    const datos = {}
    if (esEdicion && nombre.trim() !== gestion.nombre) datos.nombre = nombre.trim()
    if (esEdicion && Number(horas) !== horasActuales) datos.horas_estimadas = Number(horas)
    if (fecha !== gestion.fecha_objetivo) datos.fecha_objetivo = fecha
    return datos
  }

  function volverAlFormulario(nuevosErrores = {}) {
    setConflicto(null)
    setReduciendo(false)
    setErrores(nuevosErrores)
    // El foco va al campo que hay que corregir. Por defecto la fecha, que existe en los dos modos.
    const destino = nuevosErrores.nombre
      ? primerCampoRef
      : nuevosErrores.horas && !nuevosErrores.fecha
        ? horasRef
        : fechaRef
    setTimeout(() => destino.current?.focus(), 0)
  }

  async function enviar(datos, confirmarSobrecarga = false) {
    setGuardando(true)
    setErrorGeneral(false)
    try {
      const cuerpo = confirmarSobrecarga ? { ...datos, confirmar_sobrecarga: true } : datos
      const actualizada = await actualizarSubtarea(eventoId, gestion.id, cuerpo)
      onGuardada(actualizada, { conSobrecarga: confirmarSobrecarga })
    } catch (error) {
      const respuesta = error.datos ?? {}
      if (error.status === 409 && respuesta.codigo === 'sobrecarga_diaria') {
        // El día supera el límite: no se guardó nada. Se muestran las cifras y las salidas.
        setConflicto({ ...respuesta, datos })
        setErrorReducir('')
      } else if (error.status === 400 && respuesta.codigo === 'dia_excedido') {
        // Este sí bloquea: un día no puede tener más de 24 horas. El error va en el campo que lo causó.
        const mensaje = `Ese día quedaría con ${formatearHoras(respuesta.horas_planificadas)} de gestión. Un día no puede tener más de 24 horas.`
        volverAlFormulario(esEdicion && !('fecha_objetivo' in datos) ? { horas: mensaje } : { fecha: mensaje })
      } else if (error.status === 400 && (respuesta.fecha_objetivo || respuesta.horas_estimadas || respuesta.nombre)) {
        volverAlFormulario({
          fecha: respuesta.fecha_objetivo?.[0],
          horas: respuesta.horas_estimadas?.[0],
          nombre: respuesta.nombre?.[0],
        })
      } else {
        setErrorGeneral(true)
      }
    } finally {
      setGuardando(false)
    }
  }

  function guardar(evento) {
    evento.preventDefault()
    const fallo = validar()
    setErrores(fallo)
    if (Object.keys(fallo).length > 0) {
      // El foco va al primer campo con error, en el orden en que se leen.
      if (fallo.nombre) primerCampoRef.current?.focus()
      else if (fallo.horas) horasRef.current?.focus()
      else fechaRef.current?.focus()
      return
    }
    const datos = cambios()
    if (Object.keys(datos).length === 0) {
      onCerrar()
      return
    }
    enviar(datos)
  }

  function guardarConMenosHoras(evento) {
    evento.preventDefault()
    const horasEnviadas = Number(conflicto.datos.horas_estimadas ?? horasActuales)
    const nuevas = Number(horasReducidas)
    if (horasReducidas === '' || Number.isNaN(nuevas) || nuevas <= 0 || nuevas >= horasEnviadas) {
      setErrorReducir(TEXTOS.errorReducir)
      horasReducidasRef.current?.focus()
      return
    }
    setErrorReducir('')
    setHoras(String(nuevas))
    enviar({ ...conflicto.datos, horas_estimadas: nuevas })
  }

  // Cuántas horas puede tener esta gestión para que el día quede dentro del límite.
  function cupoParaEstaGestion() {
    const horasEnviadas = Number(conflicto.datos.horas_estimadas ?? horasActuales)
    const restoDelDia = Number(conflicto.horas_planificadas) - horasEnviadas
    return { horasEnviadas, restoDelDia, cupo: Number(conflicto.limite_diario_horas) - restoDelDia }
  }

  return (
    <div className="modal-fondo">
      <div
        ref={dialogoRef}
        className="modal modal-formulario"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogo-gestion-titulo"
      >
        <h2 id="dialogo-gestion-titulo">{titulo}</h2>

        {!conflicto && (
          <form className="formulario" onSubmit={guardar} noValidate>
            {!esEdicion && (
              <p className="resumen-gestion">
                <strong>{gestion.nombre}</strong>
                <br />
                Fecha actual: {formatearFecha(gestion.fecha_objetivo)} · {formatearHoras(horasActuales)}
              </p>
            )}

            {esEdicion && (
              <div className="campo">
                <label htmlFor="dialogo-gestion-nombre">
                  {TEXTOS.nombre} <span className="obligatorio" aria-hidden="true">*</span>
                </label>
                <input
                  ref={primerCampoRef}
                  id="dialogo-gestion-nombre"
                  value={nombre}
                  onChange={(evento) => setNombre(evento.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errores.nombre)}
                  aria-describedby={errores.nombre ? 'dialogo-gestion-error-nombre' : undefined}
                />
                {errores.nombre && (
                  <p id="dialogo-gestion-error-nombre" className="error-campo" role="alert">{errores.nombre}</p>
                )}
              </div>
            )}

            {esEdicion && (
              <div className="campo campo-estrecho">
                <label htmlFor="dialogo-gestion-horas">
                  {TEXTOS.horas} <span className="obligatorio" aria-hidden="true">*</span>
                </label>
                <small id="dialogo-gestion-ayuda-horas" className="ayuda-campo">{TEXTOS.ayudaHoras}</small>
                <input
                  ref={horasRef}
                  id="dialogo-gestion-horas"
                  type="number"
                  inputMode="decimal"
                  min="0.5"
                  step="0.5"
                  value={horas}
                  onChange={(evento) => setHoras(evento.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errores.horas)}
                  aria-describedby={
                    errores.horas
                      ? 'dialogo-gestion-ayuda-horas dialogo-gestion-error-horas'
                      : 'dialogo-gestion-ayuda-horas'
                  }
                />
                {errores.horas && (
                  <p id="dialogo-gestion-error-horas" className="error-campo" role="alert">{errores.horas}</p>
                )}
              </div>
            )}

            <div className="campo campo-estrecho">
              <label htmlFor="dialogo-gestion-fecha">
                {esEdicion ? TEXTOS.fecha : TEXTOS.fechaNueva}{' '}
                <span className="obligatorio" aria-hidden="true">*</span>
              </label>
              <input
                ref={(elemento) => {
                  fechaRef.current = elemento
                  if (!esEdicion) primerCampoRef.current = elemento
                }}
                id="dialogo-gestion-fecha"
                type="date"
                min={hoyBogota()}
                max={fechaEvento || undefined}
                value={fecha}
                onChange={(evento) => setFecha(evento.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errores.fecha)}
                aria-describedby={errores.fecha ? 'dialogo-gestion-error-fecha' : undefined}
              />
              {errores.fecha && (
                <p id="dialogo-gestion-error-fecha" className="error-campo" role="alert">{errores.fecha}</p>
              )}
            </div>

            {errorGeneral && (
              <div className="aviso aviso-error" role="alert">
                <p>{TEXTOS.errorGeneralTitulo}</p>
                <p>{TEXTOS.errorGeneralApoyo}</p>
              </div>
            )}

            <div className="modal-acciones">
              <button type="submit" className="boton boton-primario" disabled={guardando}>
                {guardando && <span className="spinner" aria-hidden="true" />}
                {guardando ? TEXTOS.guardando : esEdicion ? TEXTOS.guardar : TEXTOS.reprogramar}
              </button>
              <button type="button" className="boton boton-secundario" onClick={onCerrar} disabled={guardando}>
                {TEXTOS.cancelar}
              </button>
            </div>
          </form>
        )}

        {conflicto && (
          <div className="conflicto">
            {/* La advertencia no depende del color: lleva icono, título y las cifras en texto. */}
            <div className="aviso aviso-advertencia" role="alert">
              <h3 ref={tituloConflictoRef} tabIndex={-1}>
                <span aria-hidden="true">⚠ </span>
                {TEXTOS.tituloConflicto}
              </h3>
              <p className="cifra-conflicto">
                {formatearHoras(conflicto.horas_planificadas)}
                <span> de {formatearHoras(conflicto.limite_diario_horas)}</span>
              </p>
              <p>
                El {formatearFecha(conflicto.fecha)} quedaría con{' '}
                {formatearHoras(conflicto.horas_planificadas)} de gestión planificadas (límite:{' '}
                {formatearHoras(conflicto.limite_diario_horas)}). Son{' '}
                {formatearHoras(conflicto.exceso_horas)} de más. Todavía no se ha guardado nada.
              </p>
            </div>

            {!reduciendo && (
              <>
                <p className="pregunta-conflicto">{TEXTOS.preguntaConflicto}</p>
                <div className="modal-acciones">
                  <button type="button" className="boton boton-primario" onClick={() => volverAlFormulario()} disabled={guardando}>
                    {TEXTOS.otraFecha}
                  </button>
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => {
                      setHorasReducidas('')
                      setReduciendo(true)
                    }}
                    disabled={guardando}
                  >
                    {TEXTOS.reducir}
                  </button>
                </div>
              </>
            )}

            {reduciendo && (
              <form className="formulario" onSubmit={guardarConMenosHoras} noValidate>
                <div className="campo campo-estrecho">
                  <label htmlFor="dialogo-gestion-reducir">{TEXTOS.horasReducidas}</label>
                  <small id="dialogo-gestion-ayuda-reducir" className="ayuda-campo">
                    {(() => {
                      const { horasEnviadas, restoDelDia, cupo } = cupoParaEstaGestion()
                      return cupo >= 0.5
                        ? `Esta gestión quedaría con ${formatearHoras(horasEnviadas)}. Con ${formatearHoras(cupo)} o menos, el día queda dentro del límite.`
                        : `Ese día ya suma ${formatearHoras(restoDelDia)} sin contar esta gestión. Reducir sus horas no alcanza para quedar dentro del límite.`
                    })()}
                  </small>
                  <input
                    ref={horasReducidasRef}
                    id="dialogo-gestion-reducir"
                    type="number"
                    inputMode="decimal"
                    min="0.5"
                    step="0.5"
                    value={horasReducidas}
                    onChange={(evento) => setHorasReducidas(evento.target.value)}
                    aria-invalid={Boolean(errorReducir)}
                    aria-describedby={
                      errorReducir
                        ? 'dialogo-gestion-ayuda-reducir dialogo-gestion-error-reducir'
                        : 'dialogo-gestion-ayuda-reducir'
                    }
                  />
                  {errorReducir && (
                    <p id="dialogo-gestion-error-reducir" className="error-campo" role="alert">{errorReducir}</p>
                  )}
                </div>
                <div className="modal-acciones">
                  <button type="submit" className="boton boton-primario" disabled={guardando}>
                    {guardando && <span className="spinner" aria-hidden="true" />}
                    {guardando ? TEXTOS.guardando : TEXTOS.guardarReducidas}
                  </button>
                  <button type="button" className="boton boton-secundario" onClick={() => setReduciendo(false)} disabled={guardando}>
                    Volver
                  </button>
                </div>
              </form>
            )}

            {errorGeneral && (
              <div className="aviso aviso-error" role="alert">
                <p>{TEXTOS.errorGeneralTitulo}</p>
                <p>{TEXTOS.errorGeneralApoyo}</p>
              </div>
            )}

            {/* El conflicto advierte pero no bloquea: siempre hay salida para guardar tal cual o desistir. */}
            <div className="salidas-conflicto">
              <button type="button" className="enlace-boton" onClick={() => enviar(conflicto.datos, true)} disabled={guardando}>
                {TEXTOS.conSobrecarga}
              </button>
              <button type="button" className="enlace-boton" onClick={onCerrar} disabled={guardando}>
                {TEXTOS.cancelar}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
