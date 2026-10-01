import { createContext, useContext, useEffect, useState } from 'react'
import { obtenerSesion } from '../api'
import { cerrarSesion, leerSesion, marcarAviso } from '../sesion'

const ContextoSesion = createContext(null)

export function ProveedorSesion({ children }) {
  const [sesion, setSesion] = useState(() => leerSesion())
  const [comprobando, setComprobando] = useState(() => Boolean(leerSesion()?.token))

  useEffect(() => {
    function sincronizar() {
      setSesion(leerSesion())
    }
    window.addEventListener('eventflow-sesion', sincronizar)
    return () => window.removeEventListener('eventflow-sesion', sincronizar)
  }, [])

  useEffect(() => {
    const guardada = leerSesion()
    if (!guardada?.token) {
      setComprobando(false)
      return undefined
    }

    let vigente = true
    obtenerSesion()
      .then(() => {
        if (vigente) setSesion(leerSesion())
      })
      .catch((error) => {
        if (!vigente) return
        if (error.status === 401 || error.status === 403) {
          marcarAviso('expirada')
          cerrarSesion()
          setSesion(null)
        }
      })
      .finally(() => {
        if (vigente) setComprobando(false)
      })

    return () => {
      vigente = false
    }
  }, [])

  useEffect(() => {
    function revisar() {
      if (!sessionStorage.getItem('eventflow.sesion')) return
      if (!leerSesion()) {
        cerrarSesion()
        setSesion(null)
      }
    }
    window.addEventListener('focus', revisar)
    const reloj = window.setInterval(revisar, 30000)
    return () => {
      window.removeEventListener('focus', revisar)
      window.clearInterval(reloj)
    }
  }, [])

  return (
    <ContextoSesion.Provider value={{ sesion, comprobando }}>
      {children}
    </ContextoSesion.Provider>
  )
}

export function useSesion() {
  return useContext(ContextoSesion)
}
