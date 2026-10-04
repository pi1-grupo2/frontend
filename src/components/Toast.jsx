import { useEffect } from 'react'

// duracion: los mensajes largos necesitan más tiempo en pantalla para alcanzar a leerse.
export default function Toast({ titulo, mensaje, onClose, duracion = 3000 }) {
  useEffect(() => {
    const id = setTimeout(onClose, duracion)
    return () => clearTimeout(id)
  }, [onClose, duracion])

  return (
    <div className="toast" role="status">
      <strong>{titulo}</strong>
      <p>{mensaje}</p>
    </div>
  )
}
