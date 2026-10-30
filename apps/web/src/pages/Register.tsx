
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../lib/api'
import { useAuth } from '../context/auth-context'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 8 || password.length > 72) {
      setError('La contraseña debe tener entre 8 y 72 caracteres.')
      return
    }

    setLoading(true)

    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
      })

      navigate('/', { replace: true })
    } catch (error) {
      setError(
        error instanceof ApiError && error.status === 409
          ? 'Ese nombre de usuario o correo ya está registrado.'
          : error instanceof Error
            ? error.message
            : 'No fue posible crear la cuenta.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-8 sm:py-14">
      <div className="rounded-2xl border border-white/10 bg-[#17171e] p-6 sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-violet-300">
            Únete a la comunidad
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Crear cuenta
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Regístrate para organizar torneos y competir con otros jugadores.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-300">
              Nombre de usuario
            </span>
            <input
              autoComplete="username"
              required
              minLength={3}
              maxLength={20}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#101014] px-4 py-3 text-white outline-none transition focus:border-violet-400"
              placeholder="Entre 3 y 20 caracteres"
            />
            <span className="text-xs text-zinc-500">
              Entre 3 y 20 caracteres.
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-300">
              Correo electrónico
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#101014] px-4 py-3 text-white outline-none transition focus:border-violet-400"
              placeholder="tu@correo.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-300">
              Contraseña
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#101014] px-4 py-3 text-white outline-none transition focus:border-violet-400"
              placeholder="Al menos 8 caracteres"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-300">
              Confirmar contraseña
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#101014] px-4 py-3 text-white outline-none transition focus:border-violet-400"
              placeholder="Repite tu contraseña"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-semibold text-violet-300 hover:text-violet-200"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
