
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ApiError } from '../lib/api'
import { useAuth } from '../contexts/auth-context'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const registrationSuccess =
    (location.state as { registered?: boolean } | null)?.registered

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ usernameOrEmail: usernameOrEmail.trim(), password })

      const destination =
        (location.state as { from?: string } | null)?.from ?? '/'

      navigate(destination, { replace: true })
    } catch (error) {
      setError(
        error instanceof ApiError && error.status === 401
          ? 'El usuario, correo o contraseña no son correctos.'
          : error instanceof Error
            ? error.message
            : 'No fue posible iniciar sesión.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-8 sm:py-14">
      <div className="rounded-2xl border border-white/10 bg-[#17171e] p-6 sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-violet-300">Bienvenido de nuevo</p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Iniciar sesión
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Accede a tu cuenta para participar y organizar torneos.
          </p>
        </div>

        {registrationSuccess && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-200"
          >
            Tu cuenta se creó correctamente. Ya puedes iniciar sesión.
          </div>
        )}

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
              Usuario o correo electrónico
            </span>
            <input
              autoComplete="username"
              required
              value={usernameOrEmail}
              onChange={(event) => setUsernameOrEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#101014] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400"
              placeholder="Tu usuario o correo"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-300">
              Contraseña
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#101014] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400"
              placeholder="Tu contraseña"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          ¿Todavía no tienes cuenta?{' '}
          <Link
            to="/register"
            className="font-semibold text-violet-300 hover:text-violet-200"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
