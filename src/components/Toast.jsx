import { useEffect } from 'react'

export default function Toast({ titulo, mensaje, onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3000)
    return () => clearTimeout(id)
  }, [onClose])

  return (
    <div className="toast" role="status">
      <strong>{titulo}</strong>
      <p>{mensaje}</p>
    </div>
  )
}
