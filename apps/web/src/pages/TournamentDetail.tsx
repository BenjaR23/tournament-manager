
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError, apiFetch } from '../lib/api';
import { useAuth } from '../context/auth-context';
import type { Tournament } from '../types/tournament';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(new Date(value))
}

function formatTournamentType(format: Tournament['format']) {
  return format === 'SINGLE_ELIMINATION'
    ? 'Eliminación directa'
    : 'Fase de grupos'
}

function formatSeries(seriesBestOf: number) {
  return `Al mejor de ${seriesBestOf} (Bo${seriesBestOf})`
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Ocurrió un error inesperado. Inténtalo nuevamente.'
}

function TournamentDetail() {
  const { id } = useParams()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [now, setNow] = useState(() => Date.now())

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteCountdown, setDeleteCountdown] = useState(5)

  useEffect(() => {
    if (!isDeleteModalOpen || deleteCountdown <= 0) return

    const timeout = window.setTimeout(() => {
      setDeleteCountdown((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timeout)
  }, [isDeleteModalOpen, deleteCountdown])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now())
    }, 60_000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadTournament() {
      if (!id) {
        setTournament(null)
        setError('No se proporcionó un identificador de torneo válido.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const result = await apiFetch<Tournament>(
          `/tournaments/${encodeURIComponent(id)}`,
        )

        if (!cancelled) {
          setTournament(result)
        }
      } catch (error) {
        if (cancelled) return

        setTournament(null)

        if (error instanceof ApiError && error.status === 404) {
          setError('El torneo que buscas no existe o ya no está disponible.')
        } else {
          setError(getErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadTournament()

    return () => {
      cancelled = true
    }
  }, [id, retryCount])

  async function handleJoinTournament() {
    if (!id || !tournament || isSubmitting) return

    setIsSubmitting(true)
    setActionError('')

    try {
      await apiFetch<unknown>(
        `/tournaments/${encodeURIComponent(id)}/participants`,
        {
          method: 'POST',
        },
      )

      setTournament((current) => {
        if (!current) return current

        return {
          ...current,
          isRegistered: true,
          _count: {
            ...current._count,
            participants: current._count.participants + 1,
          },
        }
      })
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLeaveTournament() {
    if (!id || !tournament || isSubmitting) return

    setIsSubmitting(true)
    setActionError('')

    try {
      await apiFetch<unknown>(
        `/tournaments/${encodeURIComponent(id)}/participants`,
        {
          method: 'DELETE',
        },
      )

      setTournament((current) => {
        if (!current) return current

        return {
          ...current,
          isRegistered: false,
          _count: {
            ...current._count,
            participants: Math.max(0, current._count.participants - 1),
          },
        }
      })
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDeleteTournament() {
    if (!id || !tournament || isDeleting) return

    setDeleteCountdown(5)
    setDeleteError('')
    setIsDeleteModalOpen(true)
  }

  async function confirmDeleteTournament() {
    if (!id || !tournament || isDeleting || deleteCountdown > 0) return

    setIsDeleting(true)
    setDeleteError('')

    try {
      await apiFetch<unknown>(
        `/tournaments/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
        },
      )

      navigate('/')
    } catch (error) {
      setDeleteError(getErrorMessage(error))
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  const startsAt = tournament
    ? new Date(tournament.startsAt).getTime()
    : 0

  const minimumNotice = 24 * 60 * 60 * 1000

  const hasStarted = startsAt <= now

  const isFull = tournament
    ? tournament._count.participants >= tournament.maxPlayers
    : false

  const canLeave = startsAt - now >= minimumNotice
  const isOwner = user?.id === tournament?.owner.id
  const canDelete = startsAt - now >= minimumNotice

  return (
    <section className="mx-auto max-w-5xl py-8 sm:py-12">
      <Link
        to="/"
        className="inline-flex text-sm font-medium text-zinc-400 transition hover:text-violet-300"
      >
        ← Volver a torneos
      </Link>

      {loading ? (
        <div role="status" className="mt-8 space-y-5">
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-white/10" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
          <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          <span className="sr-only">Cargando detalles del torneo...</span>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/5 p-6 sm:p-8"
        >
          <p className="text-sm font-semibold text-red-300">
            No se pudo cargar el torneo
          </p>

          <h1 className="mt-2 text-2xl font-bold text-white">
            No encontramos los detalles
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-300">
            {error}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setRetryCount((current) => current + 1)}
              className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Volver a intentar
            </button>

            <Link
              to="/"
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Ver otros torneos
            </Link>
          </div>
        </div>
      ) : tournament ? (
        <div className="mt-8 space-y-6">

          {isDeleteModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              onClick={() => {
                if (!isDeleting) setIsDeleteModalOpen(false)
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-modal-title"
                aria-describedby="delete-modal-description"
                className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1b1b24] p-6 shadow-2xl sm:p-8"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10">
                  <span className="text-2xl text-red-400">!</span>
                </div>

                <h2
                  id="delete-modal-title"
                  className="mt-5 text-xl font-bold text-white"
                >
                  ¿Eliminar torneo?
                </h2>

                <p
                  id="delete-modal-description"
                  className="mt-3 text-sm leading-6 text-zinc-400"
                >
                  Estás a punto de eliminar <strong className="text-white">{tournament.name}</strong>.
                  Esta acción también eliminará todas las inscripciones asociadas
                  y no se puede deshacer.
                </p>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isDeleting}
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-40"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={confirmDeleteTournament}
                    disabled={deleteCountdown > 0 || isDeleting}
                    className="rounded-xl border border-red-400/30 bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isDeleting
                      ? 'Eliminando...'
                      : deleteCountdown > 0
                        ? `Confirmar (${deleteCountdown}s)`
                        : 'Sí, eliminar torneo'}
                  </button>
                </div>
              </div>
            </div>
          )}
          <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/70 via-[#191622] to-[#121218] p-6 sm:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl"
            />

            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-200">
                  {tournament.game.name}
                </span>

                <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
                  {formatTournamentType(tournament.format)}
                </span>
              </div>

              <h1 className="mt-5 break-words text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {tournament.name}
              </h1>

              <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-zinc-300 sm:text-base">
                {tournament.description || 'Este torneo no tiene una descripción.'}
              </p>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-300">
                <span>
                  Organiza <strong className="text-white">{tournament.owner.username}</strong>
                </span>

                <span>{formatDate(tournament.startsAt)}</span>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-[#17171e] p-5">
              <p className="text-sm font-medium text-zinc-400">
                Participantes
              </p>

              <p className="mt-3 text-3xl font-bold text-white">
                {tournament._count.participants}
                <span className="text-lg font-medium text-zinc-500">
                  {' '}/ {tournament.maxPlayers}
                </span>
              </p>

              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-label="Ocupación del torneo"
                aria-valuemin={0}
                aria-valuemax={tournament.maxPlayers}
                aria-valuenow={Math.min(
                  tournament._count.participants,
                  tournament.maxPlayers,
                )}
              >
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (tournament._count.participants / tournament.maxPlayers) * 100,
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                {isFull
                  ? 'El torneo ha alcanzado su capacidad máxima.'
                  : `Quedan ${tournament.maxPlayers - tournament._count.participants} plazas disponibles.`}
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[#17171e] p-5">
              <p className="text-sm font-medium text-zinc-400">
                Formato de las series
              </p>

              <p className="mt-3 text-2xl font-bold text-white">
                {formatSeries(tournament.seriesBestOf)}
              </p>

              <p className="mt-3 text-sm leading-5 text-zinc-500">
                Cada enfrentamiento se disputa con esta configuración.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[#17171e] p-5">
              <p className="text-sm font-medium text-zinc-400">
                {tournament.format === 'GROUP_STAGE'
                  ? 'Partidas por rival'
                  : 'Modalidad'}
              </p>

              <p className="mt-3 text-2xl font-bold text-white">
                {tournament.format === 'GROUP_STAGE'
                  ? tournament.groupMatchesPerOpponent ?? 'No especificado'
                  : 'Eliminación directa'}
              </p>

              <p className="mt-3 text-sm leading-5 text-zinc-500">
                {tournament.format === 'GROUP_STAGE'
                  ? 'Cantidad de partidas previstas contra cada rival.'
                  : 'Quien pierde su enfrentamiento queda eliminado.'}
              </p>
            </article>
          </div>

          <section className="rounded-2xl border border-white/10 bg-[#17171e] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white">
              Participación
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {tournament.isRegistered
                ? 'Ya estás inscrito en este torneo.'
                : 'Consulta la disponibilidad y participa en este torneo.'}
            </p>

            {actionError && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300"
              >
                {actionError}
              </p>
            )}

            {!isAuthenticated ? (
              <div className="mt-5">
                <p className="text-sm text-zinc-400">
                  Inicia sesión para inscribirte en este torneo.
                </p>

                <Link
                  to="/login"
                  className="mt-4 inline-flex rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
                >
                  Iniciar sesión
                </Link>
              </div>
            ) : tournament.isRegistered ? (
              <div className="mt-5">
                {hasStarted ? (
                  <p className="text-sm text-amber-300">
                    El torneo ya comenzó. Ya no puedes retirarte.
                  </p>
                ) : !canLeave ? (
                  <p className="text-sm text-amber-300">
                    Ya no puedes retirarte: faltan menos de 24 horas para el inicio.
                  </p>
                ) : (
                  <p className="text-sm text-emerald-300">
                    Tu plaza está reservada.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleLeaveTournament}
                  disabled={!canLeave || hasStarted || isSubmitting}
                  className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? 'Procesando...' : 'Retirarme del torneo'}
                </button>
              </div>
            ) : (
              <div className="mt-5">
                {hasStarted ? (
                  <p className="text-sm text-amber-300">
                    Este torneo ya comenzó y no admite nuevas inscripciones.
                  </p>
                ) : isFull ? (
                  <p className="text-sm text-amber-300">
                    No quedan plazas disponibles en este torneo.
                  </p>
                ) : (
                  <p className="text-sm text-zinc-400">
                    Hay plazas disponibles. ¡Anímate a participar!
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleJoinTournament}
                  disabled={hasStarted || isFull || isSubmitting}
                  className="mt-4 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? 'Procesando...' : 'Inscribirme al torneo'}
                </button>
              </div>
            )}
          </section>

          {isOwner && (
            <section className="rounded-2xl border border-red-400/20 bg-[#17171e] p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white">
                Administración del torneo
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Como organizador, puedes eliminar este torneo y todas las
                inscripciones asociadas.
              </p>

              {deleteError && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300"
                >
                  {deleteError}
                </p>
              )}

              {!canDelete ? (
                <p className="mt-4 text-sm text-amber-300">
                  No puedes eliminar el torneo durante las últimas 24 horas
                  antes de su inicio ni después de que haya comenzado.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleDeleteTournament}
                  disabled={isDeleting}
                  className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isDeleting ? 'Eliminando torneo...' : 'Eliminar torneo'}
                </button>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-[#17171e] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white">
              Información del torneo
            </h2>

            <dl className="mt-5 divide-y divide-white/10">
              <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <dt className="text-sm text-zinc-400">Juego</dt>
                <dd className="text-sm font-medium text-white">
                  {tournament.game.name}
                </dd>
              </div>

              <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <dt className="text-sm text-zinc-400">Fecha de inicio</dt>
                <dd className="text-sm font-medium text-white">
                  {formatDate(tournament.startsAt)}
                </dd>
              </div>

              <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <dt className="text-sm text-zinc-400">Capacidad máxima</dt>
                <dd className="text-sm font-medium text-white">
                  {tournament.maxPlayers} jugadores
                </dd>
              </div>

              <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <dt className="text-sm text-zinc-400">Organizador</dt>
                <dd className="text-sm font-medium text-white">
                  {tournament.owner.username}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      ) : null}
    </section>
  )
}

export default TournamentDetail
