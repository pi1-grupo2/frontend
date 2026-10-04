export const TIPOS_EVENTO = [
  { value: 'boda', label: 'Boda' },
  { value: 'corporativo', label: 'Corporativo / Congreso' },
  { value: 'social', label: 'Social / Fiesta' },
  { value: 'cumpleanos', label: 'Cumpleaños' },
  { value: 'otro', label: 'Otro tipo de evento' },
]

export function etiquetaTipo(valor) {
  return TIPOS_EVENTO.find((tipo) => tipo.value === valor)?.label ?? valor
}

export function formatearFechaHora(iso) {
  if (!iso) return ''
  const fecha = new Date(iso)
  const dia = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha)
  const hora = new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(fecha)
  return `${dia} — ${hora}`
}

export function fechaDeIso(iso) {
  if (!iso) return ''
  const fecha = new Date(iso)
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

export function horaDeIso(iso) {
  if (!iso) return ''
  const fecha = new Date(iso)
  const horas = String(fecha.getHours()).padStart(2, '0')
  const minutos = String(fecha.getMinutes()).padStart(2, '0')
  return `${horas}:${minutos}`
}

export function etiquetaSituacion(situacion) {
  const etiquetas = {
    VENCIDA: 'Vencida',
    PARA_HOY: 'Para hoy',
    PROXIMA: 'Próxima',
    EJECUTADA: 'Ejecutada',
  }
  return etiquetas[situacion] ?? situacion
}

const FORMATO_HORAS = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 })

// 6 se muestra como "6 h" y 6.5 como "6,5 h". Acepta número o texto ("6.0"), que es como llega de la API.
export function formatearHoras(valor) {
  return `${FORMATO_HORAS.format(Number(valor))} h`
}
