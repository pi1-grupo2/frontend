import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { iniciarSesion } from '../api'
import { useSesion } from '../components/ProveedorSesion'
import { guardarSesion } from '../sesion'

const AVISOS = {
  protegida: {
    titulo: 'Para ver esta página es necesario iniciar sesión.',
  },
  cerrada: {
    titulo: 'Sesión cerrada.',
  },
  expirada: {
    titulo: 'La sesión expiró.',
    apoyo: 'Iniciar sesión de nuevo para continuar.',
  },
}

function validar(correo, password) {
  const errores = {}
  const limpio = correo.trim()
  if (!limpio) errores.correo = 'Falta el correo electrónico.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) {
    errores.correo = 'El correo debe tener el formato nombre@correo.com.'
  }
  if (!password) errores.password = 'Falta la contraseña.'
  return errores
}

export default function Login() {
  const { sesion, comprobando } = useSesion()
  const navigate = useNavigate()
  const ubicacion = useLocation()
  const destino = ubicacion.state?.desde && ubicacion.state.desde !== '/login'
    ? ubicacion.state.desde
    : '/hoy'
  const aviso = AVISOS[ubicacion.state?.aviso]
  const correoRef = useRef(null)
  const passwordRef = useRef(null)
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!comprobando && sesion) navigate(destino, { replace: true })
  }, [comprobando, sesion, destino, navigate])

  async function enviar(evento) {
    evento.preventDefault()
    const fallo = validar(correo, password)
    setErrores(fallo)
    setErrorGeneral(null)
    if (Object.keys(fallo).length > 0) {
      if (fallo.correo) correoRef.current?.focus()
      else passwordRef.current?.focus()
      return
    }

    setCargando(true)
    try {
      const datos = await iniciarSesion(correo.trim().toLowerCase(), password)
      guardarSesion(datos)
      navigate(destino, { replace: true })
    } catch (error) {
      if (error.status === 401) {
        setErrorGeneral({
          titulo: 'Correo o contraseña incorrectos.',
          apoyo: 'Revisar los datos e intentar de nuevo.',
        })
      } else {
        setErrorGeneral({
          titulo: 'No fue posible iniciar sesión en este momento.',
          apoyo: 'Intentar de nuevo en unos minutos.',
        })
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="pantalla-login">
      <form className="tarjeta-login formulario" onSubmit={enviar} noValidate>
        <p className="marca marca-login"><span aria-hidden="true">⚡</span> EventFlow</p>
        <h1>Iniciar sesión</h1>
        <p className="intro intro-pagina">Acceso a los eventos y gestiones del organizador.</p>

        {aviso && (
          <div className="aviso aviso-estado" role="status">
            <p>{aviso.titulo}</p>
            {aviso.apoyo && <p>{aviso.apoyo}</p>}
          </div>
        )}

        {errorGeneral && (
          <div className="aviso aviso-error" role="alert">
            <p>{errorGeneral.titulo}</p>
            <p>{errorGeneral.apoyo}</p>
          </div>
        )}

        <div className="campo">
          <label htmlFor="login-correo">
            Correo electrónico <span className="obligatorio" aria-hidden="true">*</span>
          </label>
          <input
            ref={correoRef}
            id="login-correo"
            type="email"
            autoComplete="email"
            value={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            placeholder="nombre@correo.com"
            aria-invalid={Boolean(errores.correo)}
            aria-describedby={errores.correo ? 'login-correo-error' : undefined}
            disabled={cargando}
          />
          {errores.correo && (
            <p className="error-campo" id="login-correo-error" role="alert">
              <span aria-hidden="true">!</span> {errores.correo}
            </p>
          )}
        </div>

        <div className="campo">
          <label htmlFor="login-password">
            Contraseña <span className="obligatorio" aria-hidden="true">*</span>
          </label>
          <input
            ref={passwordRef}
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            aria-invalid={Boolean(errores.password)}
            aria-describedby={errores.password ? 'login-password-error' : undefined}
            disabled={cargando}
          />
          {errores.password && (
            <p className="error-campo" id="login-password-error" role="alert">
              <span aria-hidden="true">!</span> {errores.password}
            </p>
          )}
        </div>

        <button type="submit" className="boton boton-primario boton-completo" disabled={cargando}>
          {cargando && <span className="spinner" aria-hidden="true" />}
          {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
        <p className="enlace-cuenta">
          <Link to="/registro">Crear una cuenta nueva</Link>
        </p>
      </form>
    </div>
  )
}
