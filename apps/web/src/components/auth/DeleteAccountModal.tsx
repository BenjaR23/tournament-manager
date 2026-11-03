import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/auth-context'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DeleteAccountModal({
  isOpen,
  onClose,
}: DeleteAccountModalProps) {
  const { deleteAccount } = useAuth()

  const [password, setPassword] = useState('')
  const [countdown, setCountdown] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setPassword('')
    setCountdown(5)
    setIsSubmitting(false)
    setError(null)

    const interval = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isSubmitting, onClose])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (countdown > 0 || isSubmitting || !password.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      await deleteAccount(password)
      onClose()
      window.location.replace('/')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar la cuenta. Inténtalo nuevamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-xl"
      >
        <div className="mb-5">
          <h2
            id="delete-account-title"
            className="text-xl font-semibold text-white"
          >
            Eliminar cuenta
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Esta acción es permanente y no se puede deshacer. Se eliminarán:
          </p>

          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-300">
            <li>Tu cuenta y tus datos personales.</li>
            <li>Todos los torneos que hayas creado.</li>
            <li>Tus inscripciones en otros torneos.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="delete-account-password"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Confirma tu contraseña
          </label>

          <input
            id="delete-account-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contraseña actual"
            disabled={isSubmitting}
            required
            className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-500 disabled:opacity-50"
          />

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={countdown > 0 || isSubmitting || !password.trim()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting
                ? 'Eliminando...'
                : countdown > 0
                  ? `Espera ${countdown}s`
                  : 'Eliminar cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}