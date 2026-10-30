
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../../context/auth-context'

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  useEffect(() => {
    if (!isLogoutModalOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsLogoutModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLogoutModalOpen])

  function handleLogout() {
    logout()
    setIsLogoutModalOpen(false)
    navigate('/', { replace: true })
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#101014]/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500 font-black text-white">
              T
            </span>
            <span className="font-bold tracking-tight text-white">
              Tournament<span className="text-violet-300">Manager</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-white'
                }`
              }
            >
              Torneos
            </NavLink>

            {isAuthenticated ? (
              <>
                <Link
                  to="/tournaments/create"
                  className="hidden rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 sm:inline-flex"
                >
                  Crear torneo
                </Link>

                <span className="hidden text-sm text-zinc-300 md:inline">
                  {user?.username}
                </span>

                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="text-sm font-medium text-zinc-400 transition hover:text-white"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-zinc-300 transition hover:text-white"
                >
                  Iniciar sesión
                </Link>

                <Link
                  to="/register"
                  className="rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsLogoutModalOpen(false)
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            aria-describedby="logout-modal-description"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#17171e] p-6 shadow-2xl shadow-black/40 sm:p-7"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 17l5-5-5-5M15 12H3m9-8h5a2 2 0 012 2v12a2 2 0 01-2 2h-5"
                />
              </svg>
            </div>

            <h2
              id="logout-modal-title"
              className="text-xl font-bold text-white"
            >
              ¿Cerrar sesión?
            </h2>

            <p
              id="logout-modal-description"
              className="mt-3 text-sm leading-6 text-zinc-400"
            >
              ¿Estás seguro de que quieres cerrar tu sesión?
              Tendrás que volver a iniciar sesión para acceder a las
              funciones de tu cuenta.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus
                onClick={() => setIsLogoutModalOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                Sí, cerrar sesión
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default Navbar
