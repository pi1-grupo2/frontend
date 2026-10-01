import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { crearCuenta } from '../api'
import { guardarSesion } from '../sesion'

function validar(nombre, correo, password, confirmacion) {
  const errores = {}
  if (!nombre.trim()) errores.nombre = 'Falta el nombre.'
  const limpio = correo.trim()
  if (!limpio) errores.correo = 'Falta el correo electrónico.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) {
    errores.correo = 'El correo debe tener el formato nombre@correo.com.'
  }
  if (!password) errores.password = 'Falta la contraseña.'
  else if (password.length < 8) errores.password = 'La contraseña debe tener al menos 8 caracteres.'
  if (password && confirmacion !== password) errores.confirmacion = 'Las contraseñas no coinciden.'
  return errores
}

function Campo({ id, etiqueta, ayuda, error, children }) {
  return (
    <div className="campo">
      <label htmlFor={id}>
        {etiqueta} <span className="obligatorio" aria-hidden="true">*</span>
      </label>
      {children}
      {ayuda && !error && <p className="ayuda-campo" id={`${id}-ayuda`}>{ayuda}</p>}
      {error && (
        <p className="error-campo" id={`${id}-error`} role="alert">
          <span aria-hidden="true">!</span> {error}
        </p>
      )}
    </div>
  )
}

export default function Registro() {
  const navigate = useNavigate()
  const nombreRef = useRef(null)
  const correoRef = useRef(null)
  const passwordRef = useRef(null)
  const confirmacionRef = useRef(null)
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [cargando, setCargando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    const fallo = validar(nombre, correo, password, confirmacion)
    setErrores(fallo)
    setErrorGeneral(null)
    if (Object.keys(fallo).length > 0) {
      const foco = [
        ['nombre', nombreRef],
        ['correo', correoRef],
        ['password', passwordRef],
        ['confirmacion', confirmacionRef],
      ].find(([clave]) => fallo[clave])
      foco?.[1].current?.focus()
      return
    }

    setCargando(true)
    try {
      const datos = await crearCuenta(nombre.trim(), correo.trim().toLowerCase(), password)
      guardarSesion(datos)
      navigate('/hoy', { replace: true, state: { cuentaCreada: true } })
    } catch (error) {
      const detalle = JSON.stringify(error.datos ?? '').toLowerCase()
      if (error.status === 409 || detalle.includes('correo')) {
        setErrorGeneral({
          titulo: 'No fue posible crear la cuenta con este correo.',
          apoyo: 'Si ya existe una cuenta, se puede iniciar sesión.',
          enlace: true,
        })
      } else {
        setErrorGeneral({
          titulo: 'No fue posible crear la cuenta en este momento.',
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
        <h1>Crear cuenta</h1>
        <p className="intro intro-pagina">Cada cuenta ve solo sus propios eventos.</p>

        {errorGeneral && (
          <div className="aviso aviso-error" role="alert">
            <p>{errorGeneral.titulo}</p>
            <p>{errorGeneral.apoyo}</p>
            {errorGeneral.enlace && <p><Link to="/login">Iniciar sesión</Link></p>}
          </div>
        )}

        <Campo id="registro-nombre" etiqueta="Nombre" ayuda="Así aparece en la aplicación." error={errores.nombre}>
          <input
            ref={nombreRef}
            id="registro-nombre"
            autoComplete="name"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            placeholder="Nombre y apellido"
            aria-invalid={Boolean(errores.nombre)}
            aria-describedby={errores.nombre ? 'registro-nombre-error' : 'registro-nombre-ayuda'}
            disabled={cargando}
          />
        </Campo>

        <Campo id="registro-correo" etiqueta="Correo electrónico" error={errores.correo}>
          <input
            ref={correoRef}
            id="registro-correo"
            type="email"
            autoComplete="email"
            value={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            placeholder="nombre@correo.com"
            aria-invalid={Boolean(errores.correo)}
            aria-describedby={errores.correo ? 'registro-correo-error' : undefined}
            disabled={cargando}
          />
        </Campo>

        <Campo id="registro-password" etiqueta="Contraseña" ayuda="Mínimo 8 caracteres." error={errores.password}>
          <input
            ref={passwordRef}
            id="registro-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            aria-invalid={Boolean(errores.password)}
            aria-describedby={errores.password ? 'registro-password-error' : 'registro-password-ayuda'}
            disabled={cargando}
          />
        </Campo>

        <Campo id="registro-confirmacion" etiqueta="Confirmar contraseña" error={errores.confirmacion}>
          <input
            ref={confirmacionRef}
            id="registro-confirmacion"
            type="password"
            autoComplete="new-password"
            value={confirmacion}
            onChange={(evento) => setConfirmacion(evento.target.value)}
            aria-invalid={Boolean(errores.confirmacion)}
            aria-describedby={errores.confirmacion ? 'registro-confirmacion-error' : undefined}
            disabled={cargando}
          />
        </Campo>

        <button type="submit" className="boton boton-primario boton-completo" disabled={cargando}>
          {cargando && <span className="spinner" aria-hidden="true" />}
          {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
        <p className="enlace-cuenta">
          <Link to="/login">Iniciar sesión con una cuenta existente</Link>
        </p>
      </form>
    </div>
  )
}
