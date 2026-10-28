import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError, apiFetch } from '../lib/api'
import type { Tournament } from '../types/tournament'

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

function TournamentDetail() {
  const { id } = useParams()

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

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
          setError(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar los detalles del torneo.',
          )
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

                <span>
                  {formatDate(tournament.startsAt)}
                </span>
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
                {tournament._count.participants >= tournament.maxPlayers
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
