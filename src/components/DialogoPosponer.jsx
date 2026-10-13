import { useEffect, useRef, useState } from 'react'

const ENFOCABLES = 'button:not([disabled]), textarea:not([disabled])'

/**
 * Pide la nota opcional antes de posponer una gestión (US-09).
 * No guarda nada: la pantalla que lo abre hace el PATCH.
 */
export default function DialogoPosponer({ nombre, onConfirmar, onCerrar }) {
  const dialogoRef = useRef(null)
  const notaRef = useRef(null)
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const origen = document.activeElement
    notaRef.current?.focus()
    return () => {
      if (origen instanceof HTMLElement && document.contains(origen)) origen.focus()
    }
  }, [])

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

  async function guardar(evento) {
    evento.preventDefault()
    setGuardando(true)
    setError(false)
    try {
      await onConfirmar(nota.trim())
    } catch {
      setError(true)
      setGuardando(false)
    }
  }

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
          <strong>{nombre}</strong> sigue en su fecha. La nota es opcional.
        </p>
        <form className="formulario" onSubmit={guardar} noValidate>
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
          {error && (
            <div className="aviso aviso-error" role="alert">
              <p>No se pudo posponer la gestión.</p>
              <p>Sigue como estaba. Intenta de nuevo en unos minutos.</p>
            </div>
          )}
          <div className="modal-acciones">
            <button type="submit" className="boton boton-primario" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Posponer'}
            </button>
            <button type="button" className="boton boton-secundario" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
