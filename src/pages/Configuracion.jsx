import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { actualizarOrganizador, obtenerOrganizador } from '../api'
import Toast from '../components/Toast'
import { formatearHoras } from '../formato'

const LIMITE_MINIMO = 1
const LIMITE_MAXIMO = 16
const PASO = 0.5

const TEXTOS = {
  titulo: 'Configuración',
  intro:
    'El límite diario es el máximo de horas de gestión que se planifican en un día. '
    + 'Al reprogramar una gestión, la aplicación avisa si ese día supera el límite.',
  seccion: 'Límite diario de horas',
  etiqueta: 'Horas por día',
  ayuda: 'Entre 1 y 16. Se aceptan medias horas, por ejemplo 6,5.',
  guardar: 'Guardar límite',
  guardando: 'Guardando...',
  cargando: 'Cargando la configuración...',
  errorCargaTitulo: 'No se pudo cargar la configuración',
  errorCargaApoyo: 'Tuvimos un inconveniente al conectar con el servidor. Intentar de nuevo en unos minutos.',
  reintentar: 'Reintentar',
  errorVacio: 'Indicar un valor entre 1 y 16.',
  errorRango: 'El límite debe estar entre 1 y 16 horas.',
  errorPaso: 'El límite se define en horas completas o medias, por ejemplo 6 o 6,5.',
  errorGuardarTitulo: 'No fue posible guardar el límite.',
  errorGuardarApoyo: 'El valor escrito se conserva. Intentar de nuevo en unos minutos.',
  exitoTitulo: 'Límite actualizado.',
  conflictoTitulo: 'Ese límite dejaría días por encima.',
  revisarDias: 'Revisar esos días',
  guardarConSobrecarga: 'Guardar aunque supere el límite',
  conservar: 'Conservar el límite actual',
}

function textoDiasPorEncima(limite, dias) {
  const horas = formatearHoras(limite)
  if (dias === 1) return `Con ${horas}, 1 día quedaría por encima del límite.`
  return `Con ${horas}, ${dias} días quedarían por encima del límite.`
}

// "6,5" y "6.5" son el mismo límite. La ayuda del campo usa la coma.
function normalizarLimite(texto) {
  return String(texto).trim().replace(',', '.')
}

// Devuelve el mensaje de error del valor escrito, o una cadena vacía si es válido.
// Repite las reglas del backend para avisar sin esperar la respuesta del servidor.
function validarLimite(texto) {
  const limpio = normalizarLimite(texto)
  if (limpio === '') return TEXTOS.errorVacio
  const valor = Number(limpio)
  if (Number.isNaN(valor)) return TEXTOS.errorVacio
  if (valor < LIMITE_MINIMO || valor > LIMITE_MAXIMO) return TEXTOS.errorRango
  if ((valor / PASO) % 1 !== 0) return TEXTOS.errorPaso
  return ''
}

export default function Configuracion() {
  const campoRef = useRef(null)
  const conservarRef = useRef(null)
  const [estado, setEstado] = useState('cargando') // cargando | error | listo
  const [limiteActual, setLimiteActual] = useState(null)
  const [valor, setValor] = useState('')
  const [errorCampo, setErrorCampo] = useState('')
  const [errorGuardar, setErrorGuardar] = useState(false)
  const [conflicto, setConflicto] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)
  const cerrarToast = useCallback(() => setToast(null), [])

  // El límite se lee siempre de la API. La copia que queda en la sesión del navegador
  // es la del momento de iniciar sesión y no se entera de los cambios.
  const cargar = useCallback(() => {
    let vigente = true
    setEstado('cargando')
    obtenerOrganizador()
      .then((organizador) => {
        if (!vigente) return
        const limite = Number(organizador.limite_diario_horas)
        setLimiteActual(limite)
        setValor(String(limite))
        setEstado('listo')
      })
      .catch(() => {
        if (vigente) setEstado('error')
      })
    return () => {
      vigente = false
    }
  }, [])

  useEffect(() => cargar(), [cargar])

  function conservarLimite() {
    setConflicto(null)
    setValor(limiteActual === null ? '' : String(limiteActual))
    setErrorCampo('')
  }

  useEffect(() => {
    if (!conflicto) return undefined
    conservarRef.current?.focus()
    function tecla(evento) {
      if (evento.key !== 'Escape') return
      evento.preventDefault()
      setConflicto(null)
      setValor(limiteActual === null ? '' : String(limiteActual))
      setErrorCampo('')
    }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [conflicto, limiteActual])

  async function guardar(evento, confirmar = false) {
    evento?.preventDefault?.()
    setErrorGuardar(false)

    const fallo = validarLimite(valor)
    setErrorCampo(fallo)
    if (fallo) {
      campoRef.current?.focus()
      return
    }

    setGuardando(true)
    try {
      const cuerpo = { limite_diario_horas: Number(normalizarLimite(valor)) }
      if (confirmar) cuerpo.confirmar_sobrecarga = true
      const organizador = await actualizarOrganizador(cuerpo)
      const limite = Number(organizador.limite_diario_horas)
      setLimiteActual(limite)
      setValor(String(limite))
      setConflicto(null)
      setToast({
        titulo: TEXTOS.exitoTitulo,
        mensaje: `El aviso de sobrecarga usa ahora ${formatearHoras(limite)} por día.`,
      })
    } catch (error) {
      const datos = error.datos
      if (!confirmar && error.status === 409 && datos?.codigo === 'sobrecarga_por_limite') {
        const dias = Array.isArray(datos.dias) ? datos.dias.length : 0
        setConflicto({
          limite: datos.limite_diario_horas ?? Number(normalizarLimite(valor)),
          dias: dias > 0 ? dias : 1,
        })
        return
      }
      // Si la API rechaza el valor, su mensaje va en el campo. Cualquier otro fallo es del servicio.
      const rechazo = error.status === 400 ? datos?.limite_diario_horas?.[0] : null
      if (rechazo) {
        setErrorCampo(rechazo)
        campoRef.current?.focus()
      } else {
        setErrorGuardar(true)
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="pagina">
      {toast && <Toast titulo={toast.titulo} mensaje={toast.mensaje} onClose={cerrarToast} />}

      <h1>{TEXTOS.titulo}</h1>
      <p className="intro">{TEXTOS.intro}</p>

      {estado === 'cargando' && (
        <div role="status">
          <span className="solo-lectores">{TEXTOS.cargando}</span>
          <div className="esqueleto esqueleto-bloque" aria-hidden="true" />
        </div>
      )}

      {estado === 'error' && (
        <div className="aviso aviso-error" role="alert">
          <h2>{TEXTOS.errorCargaTitulo}</h2>
          <p>{TEXTOS.errorCargaApoyo}</p>
          <button type="button" className="boton boton-primario" onClick={cargar}>
            {TEXTOS.reintentar}
          </button>
        </div>
      )}

      {estado === 'listo' && (
        <form className="formulario" onSubmit={guardar} noValidate>
          <fieldset>
            <legend>{TEXTOS.seccion}</legend>
            <p className="intro-seccion">
              Límite actual: <strong>{formatearHoras(limiteActual)} por día</strong>.
            </p>

            <div className="campo campo-estrecho">
              <label htmlFor="limite-diario">
                {TEXTOS.etiqueta} <span className="obligatorio" aria-hidden="true">*</span>
              </label>
              <small id="ayuda-limite-diario" className="ayuda-campo">{TEXTOS.ayuda}</small>
              <input
                ref={campoRef}
                id="limite-diario"
                type="number"
                inputMode="decimal"
                min={LIMITE_MINIMO}
                max={LIMITE_MAXIMO}
                step={PASO}
                value={valor}
                onChange={(evento) => setValor(evento.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errorCampo)}
                aria-describedby={
                  errorCampo ? 'ayuda-limite-diario error-limite-diario' : 'ayuda-limite-diario'
                }
              />
              {errorCampo && (
                <p id="error-limite-diario" className="error-campo" role="alert">{errorCampo}</p>
              )}
            </div>
          </fieldset>

          {errorGuardar && (
            <div className="aviso aviso-error" role="alert">
              <p>{TEXTOS.errorGuardarTitulo}</p>
              <p>{TEXTOS.errorGuardarApoyo}</p>
            </div>
          )}

          <div className="acciones-formulario">
            <button type="submit" className="boton boton-primario" disabled={guardando}>
              {guardando && !conflicto && <span className="spinner" aria-hidden="true" />}
              {guardando && !conflicto ? TEXTOS.guardando : TEXTOS.guardar}
            </button>
          </div>
        </form>
      )}

      {conflicto && (
        <div className="modal-fondo" onClick={conservarLimite}>
          <div
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="limite-conflicto-titulo"
            aria-describedby="limite-conflicto-mensaje"
            onClick={(evento) => evento.stopPropagation()}
          >
            <h2 id="limite-conflicto-titulo">{TEXTOS.conflictoTitulo}</h2>
            <p id="limite-conflicto-mensaje">{textoDiasPorEncima(conflicto.limite, conflicto.dias)}</p>
            <div className="modal-acciones">
              <Link className="boton boton-primario" to="/hoy">{TEXTOS.revisarDias}</Link>
              <button
                type="button"
                className="boton boton-secundario"
                disabled={guardando}
                onClick={() => guardar(null, true)}
              >
                {guardando && <span className="spinner" aria-hidden="true" />}
                {guardando ? TEXTOS.guardando : TEXTOS.guardarConSobrecarga}
              </button>
              <button
                ref={conservarRef}
                type="button"
                className="boton boton-secundario"
                disabled={guardando}
                onClick={conservarLimite}
              >
                {TEXTOS.conservar}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
