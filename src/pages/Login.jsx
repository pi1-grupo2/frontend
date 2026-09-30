import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { iniciarSesion } from '../api'
import { useSesion } from '../components/ProveedorSesion'
import { guardarSesion } from '../sesion'

function validar(correo, password) {
  const errores = {}
  const limpio = correo.trim()
  if (!limpio) errores.correo = 'El correo es obligatorio.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) errores.correo = 'Ingresa un correo válido.'
  if (!password) errores.password = 'La contraseña es obligatoria.'
  return errores
}

export default function Login() {
  const { sesion, comprobando } = useSesion()
  const navigate = useNavigate()
  const ubicacion = useLocation()
  const destino = ubicacion.state?.desde && ubicacion.state.desde !== '/login'
    ? ubicacion.state.desde
    : '/hoy'
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!comprobando && sesion) navigate(destino, { replace: true })
  }, [comprobando, sesion, destino, navigate])

  async function enviar(evento) {
    evento.preventDefault()
    const fallo = validar(correo, password)
    setErrores(fallo)
    setErrorGeneral('')
    if (Object.keys(fallo).length > 0) return

    setCargando(true)
    try {
      const datos = await iniciarSesion(correo.trim().toLowerCase(), password)
      guardarSesion(datos)
      navigate(destino, { replace: true })
    } catch (error) {
      if (error.status === 401) setErrorGeneral('Credenciales inválidas')
      else setErrorGeneral('Tuvimos un inconveniente al conectar con el servidor. Intenta nuevamente.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="pantalla-login">
      <form className="tarjeta-login formulario" onSubmit={enviar} noValidate>
        <p className="marca marca-login"><span aria-hidden="true">⚡</span> EventFlow</p>
        <h1>Iniciar sesión</h1>
        <p className="intro">Entra con tu correo para ver tus eventos y gestiones.</p>

        {errorGeneral && (
          <div className="aviso aviso-error" role="alert">
            <p>{errorGeneral}</p>
          </div>
        )}

        <div className="campo">
          <label htmlFor="login-correo">Correo</label>
          <input
            id="login-correo"
            type="email"
            autoComplete="username"
            value={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            placeholder="natalia@demo.com"
            aria-invalid={Boolean(errores.correo)}
            disabled={cargando}
          />
          {errores.correo && <p className="error-campo" role="alert">{errores.correo}</p>}
        </div>

        <div className="campo">
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            aria-invalid={Boolean(errores.password)}
            disabled={cargando}
          />
          {errores.password && <p className="error-campo" role="alert">{errores.password}</p>}
        </div>

        <button type="submit" className="boton boton-primario boton-completo" disabled={cargando}>
          {cargando && <span className="spinner" aria-hidden="true" />}
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
