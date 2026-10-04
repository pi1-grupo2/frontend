import { useCallback, useEffect, useRef, useState } from 'react'
import { actualizarOrganizador, obtenerOrganizador } from '../api'
import Toast from '../components/Toast'
import { formatearHoras } from '../formato'

const LIMITE_MINIMO = 1
const LIMITE_MAXIMO = 16
const PASO = 0.5

// Textos provisionales. Los definitivos los entrega UX (tarea #231): se cambian aquí.
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
}

// Devuelve el mensaje de error del valor escrito, o una cadena vacía si es válido.
// Repite las reglas del backend para avisar sin esperar la respuesta del servidor.
function validarLimite(texto) {
  if (String(texto).trim() === '') return TEXTOS.errorVacio
  const valor = Number(texto)
  if (Number.isNaN(valor)) return TEXTOS.errorVacio
  if (valor < LIMITE_MINIMO || valor > LIMITE_MAXIMO) return TEXTOS.errorRango
  if ((valor / PASO) % 1 !== 0) return TEXTOS.errorPaso
  return ''
}

export default function Configuracion() {
  const campoRef = useRef(null)
  const [estado, setEstado] = useState('cargando') // cargando | error | listo
  const [limiteActual, setLimiteActual] = useState(null)
  const [valor, setValor] = useState('')
  const [errorCampo, setErrorCampo] = useState('')
  const [errorGuardar, setErrorGuardar] = useState(false)
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

  async function guardar(evento) {
    evento.preventDefault()
    setErrorGuardar(false)

    const fallo = validarLimite(valor)
    setErrorCampo(fallo)
    if (fallo) {
      campoRef.current?.focus()
      return
    }

    setGuardando(true)
    try {
      const organizador = await actualizarOrganizador({ limite_diario_horas: Number(valor) })
      const limite = Number(organizador.limite_diario_horas)
      setLimiteActual(limite)
      setValor(String(limite))
      setToast({
        titulo: TEXTOS.exitoTitulo,
        mensaje: `El aviso de sobrecarga usa ahora ${formatearHoras(limite)} por día.`,
      })
    } catch (error) {
      // Si la API rechaza el valor, su mensaje va en el campo. Cualquier otro fallo es del servicio.
      const rechazo = error.status === 400 ? error.datos?.limite_diario_horas?.[0] : null
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
              {guardando && <span className="spinner" aria-hidden="true" />}
              {guardando ? TEXTOS.guardando : TEXTOS.guardar}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
