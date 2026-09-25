import { useEffect, useRef } from 'react'

export default function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  onConfirmar,
  onCancelar,
  cargando,
}) {
  const cancelarRef = useRef(null)
  const confirmarRef = useRef(null)

  useEffect(() => {
    if (!abierto) return undefined

    cancelarRef.current?.focus()

    function alTeclado(evento) {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        onCancelar()
        return
      }

      if (evento.key !== 'Tab') return

      const primero = cancelarRef.current
      const ultimo = confirmarRef.current
      if (!primero || !ultimo) return

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
  }, [abierto, onCancelar])

  if (!abierto) return null

  return (
    <div className="modal-fondo" onClick={onCancelar}>
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        aria-describedby="modal-mensaje"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id="modal-titulo">{titulo}</h2>
        <p id="modal-mensaje">{mensaje}</p>
        <div className="modal-acciones">
          <button
            ref={cancelarRef}
            type="button"
            className="boton boton-secundario"
            onClick={onCancelar}
            disabled={cargando}
          >
            Cancelar
          </button>
          <button
            ref={confirmarRef}
            type="button"
            className="boton boton-peligro-solido"
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Eliminando...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
