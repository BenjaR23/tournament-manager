
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { apiFetch } from '../lib/api'
import type {
  Game,
  PaginatedResponse,
  Tournament,
} from '../types/tournament'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(new Date(value))
}

function formatTournamentType(format: Tournament['format']) {
  return format === 'SINGLE_ELIMINATION'
    ? 'Eliminación directa'
    : 'Fase de grupos'
}

function Home() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [games, setGames] = useState<Game[]>([])

  const [game, setGame] = useState('')
  const [date, setDate] = useState('')
  const [participantsOrder, setParticipantsOrder] = useState('')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadGames() {
      try {
        const result = await apiFetch<Game[]>('/games')

        if (!cancelled) {
          setGames(result)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('No se pudieron cargar los juegos:', error)
        }
      }
    }

    void loadGames()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadTournaments() {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
      })

      if (game) params.set('game', game)
      if (date) params.set('date', date)
      if (participantsOrder) {
        params.set('participantsOrder', participantsOrder)
      }

      try {
        const result = await apiFetch<PaginatedResponse<Tournament>>(
          `/tournaments?${params.toString()}`,
        )

        if (cancelled) return

        setTournaments(result.data)
        setTotal(result.meta.total)
        setTotalPages(result.meta.totalPages)
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar los torneos.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadTournaments()

    return () => {
      cancelled = true
    }
  }, [page, game, date, participantsOrder, retryCount])

  function resetFilters() {
    setGame('')
    setDate('')
    setParticipantsOrder('')
    setPage(1)
  }

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/70 via-[#191622] to-[#121218] px-6 py-12 sm:px-10 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl"
        />

        <div className="relative max-w-2xl">
          <span className="inline-flex rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-200">
            Tu próxima competición comienza aquí
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Encuentra tu próximo torneo.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
            Descubre competiciones, reúne a tus amigos y demuestra lo que
            puedes hacer.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#tournaments"
              className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Explorar torneos
            </a>

            <Link
              to="/tournaments/create"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Crear torneo
            </Link>
          </div>
        </div>
      </section>

      <section id="tournaments" className="scroll-mt-24 space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-violet-300">
              Competición
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              Explorar torneos
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {total} {total === 1 ? 'torneo disponible' : 'torneos disponibles'}
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="self-start text-sm font-medium text-zinc-400 transition hover:text-white sm:self-auto"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-zinc-300">Juego</span>
            <select
              value={game}
              onChange={(event) => {
                setGame(event.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-white/10 bg-[#18181f] px-3 py-3 text-sm text-white outline-none transition focus:border-violet-400"
            >
              <option value="">Todos los juegos</option>
              {games.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-zinc-300">
              Fecha de inicio
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-white/10 bg-[#18181f] px-3 py-3 text-sm text-white outline-none transition focus:border-violet-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-zinc-300">
              Participantes
            </span>
            <select
              value={participantsOrder}
              onChange={(event) => {
                setParticipantsOrder(event.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-white/10 bg-[#18181f] px-3 py-3 text-sm text-white outline-none transition focus:border-violet-400"
            >
              <option value="">Sin preferencia</option>
              <option value="desc">Más participantes</option>
              <option value="asc">Menos participantes</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div
            role="status"
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
              />
            ))}
            <span className="sr-only">Cargando torneos...</span>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6"
          >
            <h3 className="font-semibold text-red-200">
              No se pudieron cargar los torneos
            </h3>
            <p className="mt-2 text-sm text-zinc-300">{error}</p>
            <button
              type="button"
              onClick={() => setRetryCount((current) => current + 1)}
              className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              Volver a intentar
            </button>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
            <h3 className="text-lg font-semibold text-white">
              No encontramos torneos
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Prueba con otros filtros o sé el primero en organizar uno.
            </p>
            <Link
              to="/tournaments/create"
              className="mt-5 inline-flex rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400"
            >
              Crear un torneo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tournaments.map((tournament) => {
              const participantCount = tournament._count.participants
              const full = participantCount >= tournament.maxPlayers

              return (
                <article
                  key={tournament.id}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-[#17171e] p-5 transition duration-200 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-[#1b1a24]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-lg border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-xs font-medium text-violet-200">
                      {tournament.game.name}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        full
                          ? 'bg-red-400/10 text-red-300'
                          : 'bg-emerald-400/10 text-emerald-300'
                      }`}
                    >
                      {full ? 'Completo' : 'Inscripciones abiertas'}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-white transition group-hover:text-violet-200">
                    {tournament.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-400">
                    {tournament.description || 'Sin descripción disponible.'}
                  </p>

                  <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-zinc-500">Fecha</span>
                      <span className="text-right text-zinc-200">
                        {formatDate(tournament.startsAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-zinc-500">Participantes</span>
                      <span className="font-medium text-zinc-200">
                        {participantCount} / {tournament.maxPlayers}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-zinc-500">Formato</span>
                      <span className="text-right text-zinc-200">
                        {formatTournamentType(tournament.format)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-zinc-500">Organiza</span>
                      <span className="text-zinc-200">
                        {tournament.owner.username}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/tournaments/${tournament.id}`}
                    className="mt-6 block rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-violet-400/40 hover:bg-violet-500/10"
                  >
                    Ver torneo
                  </Link>
                </article>
              )
            })}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <nav
            aria-label="Paginación de torneos"
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>

            <span className="text-sm text-zinc-400">
              Página {page} de {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </nav>
        )}
      </section>
    </div>
  )
}

export default Home
