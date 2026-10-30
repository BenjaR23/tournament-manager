
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError, apiFetch } from '../lib/api'
import type { Game } from '../types/tournament'

type TournamentFormat = 'SINGLE_ELIMINATION' | 'GROUP_STAGE'

interface CreateTournamentPayload {
  name: string
  description?: string
  startsAt: string
  gameId: string
  maxPlayers: number
  format: TournamentFormat
  seriesBestOf: number
  groupMatchesPerOpponent?: number
}

function getLocalDateTimeMinimum() {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 1)

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const inputClassName =
  'w-full rounded-xl border border-white/10 bg-[#101014] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400'

const labelClassName = 'block space-y-2'

const labelTextClassName = 'text-sm font-medium text-zinc-300'

function CreateTournament() {
  const [games, setGames] = useState<Game[]>([])
  const [gamesLoading, setGamesLoading] = useState(true)
  const [gamesError, setGamesError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [gameId, setGameId] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('16')
  const [format, setFormat] =
    useState<TournamentFormat>('SINGLE_ELIMINATION')
  const [seriesBestOf, setSeriesBestOf] = useState('3')
  const [groupMatchesPerOpponent, setGroupMatchesPerOpponent] =
    useState('1')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [minimumDateTime, setMinimumDateTime] = useState(
    getLocalDateTimeMinimum,
  )

  useEffect(() => {
    let cancelled = false

    async function loadGames() {
      setGamesLoading(true)
      setGamesError('')

      try {
        const result = await apiFetch<Game[]>('/games')

        if (!cancelled) {
          setGames(result)
          setGameId((current) => current || result[0]?.id || '')
        }
      } catch (error) {
        if (!cancelled) {
          setGamesError(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar los juegos.',
          )
        }
      } finally {
        if (!cancelled) {
          setGamesLoading(false)
        }
      }
    }

    void loadGames()

    return () => {
      cancelled = true
    }
  }, [])

  function handleFormatChange(nextFormat: TournamentFormat) {
    setFormat(nextFormat)
    setError('')
    setSuccess(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess(false)

    const startDate = new Date(startsAt)

    if (!startsAt || Number.isNaN(startDate.getTime())) {
      setError('Selecciona una fecha y hora de inicio válidas.')
      return
    }

    if (startDate.getTime() <= Date.now()) {
      setError('La fecha de inicio debe estar en el futuro.')
      return
    }

    const parsedMaxPlayers = Number(maxPlayers)
    const parsedBestOf = Number(seriesBestOf)
    const parsedGroupMatches = Number(groupMatchesPerOpponent)

    if (
      !Number.isInteger(parsedMaxPlayers) ||
      parsedMaxPlayers < 2 ||
      parsedMaxPlayers > 128 ||
      parsedMaxPlayers % 2 !== 0
    ) {
      setError('La capacidad debe ser un número par entre 2 y 128.')
      return
    }

    if (![1, 3, 5].includes(parsedBestOf)) {
      setError('La serie debe ser al mejor de 1, 3 o 5 partidas.')
      return
    }

    if (
      format === 'GROUP_STAGE' &&
      (!Number.isInteger(parsedGroupMatches) ||
        parsedGroupMatches < 1 ||
        parsedGroupMatches > 5)
    ) {
      setError('Las partidas por rival deben estar entre 1 y 5.')
      return
    }

    if (!gameId) {
      setError('Selecciona un juego para el torneo.')
      return
    }

    const payload: CreateTournamentPayload = {
      name: name.trim(),
      ...(description.trim()
        ? { description: description.trim() }
        : {}),
      startsAt: startDate.toISOString(),
      gameId,
      maxPlayers: parsedMaxPlayers,
      format,
      seriesBestOf: parsedBestOf,
      ...(format === 'GROUP_STAGE'
        ? { groupMatchesPerOpponent: parsedGroupMatches }
        : {}),
    }

    setSubmitting(true)

    try {
      await apiFetch<unknown>('/tournaments', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setSuccess(true)
      setName('')
      setDescription('')
      setStartsAt('')
      setMaxPlayers('16')
      setFormat('SINGLE_ELIMINATION')
      setSeriesBestOf('3')
      setGroupMatchesPerOpponent('1')
      setMinimumDateTime(getLocalDateTimeMinimum())
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setError(
          'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.',
        )
      } else {
        setError(
          error instanceof Error
            ? error.message
            : 'No fue posible crear el torneo.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl py-8 sm:py-12">
      <div className="mb-8">
        <Link
          to="/"
          className="text-sm font-medium text-zinc-400 transition hover:text-violet-300"
        >
          ← Volver a torneos
        </Link>

        <p className="mt-6 text-sm font-medium text-violet-300">
          Organiza la competición
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Crear torneo
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
          Configura el juego, la fecha y las reglas. Revisa los datos
          antes de publicar tu torneo.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#17171e] p-5 sm:p-8">
        {success && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4"
          >
            <p className="font-semibold text-emerald-200">
              ¡Torneo creado correctamente!
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-300">
              Tu torneo ya se ha enviado al servidor. Puedes volver al
              listado para encontrarlo.
            </p>
            <Link
              to="/"
              className="mt-3 inline-flex text-sm font-semibold text-emerald-200 hover:text-emerald-100"
            >
              Ver torneos →
            </Link>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm leading-6 text-red-200"
          >
            {error}
          </div>
        )}

        {gamesError && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
            <p className="text-sm text-red-200">{gamesError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 text-sm font-semibold text-white underline underline-offset-4"
            >
              Volver a cargar
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="tournament-name" className={labelTextClassName}>
              Nombre del torneo
            </label>
            <input
              id="tournament-name"
              required
              minLength={3}
              maxLength={80}
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setSuccess(false)
              }}
              className={inputClassName}
              placeholder="Ej. Copa de otoño"
            />
            <p className="text-xs text-zinc-500">
              Entre 3 y 80 caracteres.
            </p>
          </div>

          <div className={labelClassName}>
            <label htmlFor="tournament-description" className={labelTextClassName}>
              Descripción <span className="font-normal text-zinc-500">(opcional)</span>
            </label>
            <textarea
              id="tournament-description"
              rows={4}
              maxLength={500}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
                setSuccess(false)
              }}
              className={`${inputClassName} resize-y`}
              placeholder="Explica las reglas adicionales o la información relevante."
            />
            <p className="text-right text-xs text-zinc-500">
              {description.length}/500
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className={labelClassName}>
              <label htmlFor="tournament-game" className={labelTextClassName}>
                Juego
              </label>
              <select
                id="tournament-game"
                required
                disabled={gamesLoading || games.length === 0}
                value={gameId}
                onChange={(event) => {
                  setGameId(event.target.value)
                  setSuccess(false)
                }}
                className={inputClassName}
              >
                {gamesLoading ? (
                  <option value="">Cargando juegos...</option>
                ) : games.length === 0 ? (
                  <option value="">No hay juegos disponibles</option>
                ) : (
                  games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className={labelClassName}>
              <label htmlFor="tournament-start" className={labelTextClassName}>
                Fecha y hora de inicio
              </label>
              <input
                id="tournament-start"
                type="datetime-local"
                required
                min={minimumDateTime}
                value={startsAt}
                onChange={(event) => {
                  setStartsAt(event.target.value)
                  setSuccess(false)
                }}
                className={inputClassName}
              />
              <p className="text-xs leading-5 text-zinc-500">
                La hora se interpreta según la zona horaria local del navegador.
              </p>
            </div>
          </div>

          <div className={labelClassName}>
            <label htmlFor="tournament-capacity" className={labelTextClassName}>
              Capacidad máxima
            </label>
            <select
              id="tournament-capacity"
              value={maxPlayers}
              onChange={(event) => {
                setMaxPlayers(event.target.value)
                setSuccess(false)
              }}
              className={inputClassName}
            >
              {[2, 4, 8, 16, 32, 64, 128].map((capacity) => (
                <option key={capacity} value={capacity}>
                  {capacity} jugadores
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500">
              Debe ser un número par entre 2 y 128.
            </p>
          </div>

          <div className="space-y-3">
            <p className={labelTextClassName}>Formato del torneo</p>

            <label
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                format === 'SINGLE_ELIMINATION'
                  ? 'border-violet-400/50 bg-violet-400/5'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <input
                type="radio"
                name="format"
                value="SINGLE_ELIMINATION"
                checked={format === 'SINGLE_ELIMINATION'}
                onChange={() => handleFormatChange('SINGLE_ELIMINATION')}
                className="mt-1 accent-violet-500"
              />
              <span>
                <span className="block font-semibold text-white">
                  Eliminación directa
                </span>
                <span className="mt-1 block text-sm leading-5 text-zinc-400">
                  Quien pierde queda eliminado del torneo.
                </span>
              </span>
            </label>

            <label
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                format === 'GROUP_STAGE'
                  ? 'border-violet-400/50 bg-violet-400/5'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <input
                type="radio"
                name="format"
                value="GROUP_STAGE"
                checked={format === 'GROUP_STAGE'}
                onChange={() => handleFormatChange('GROUP_STAGE')}
                className="mt-1 accent-violet-500"
              />
              <span>
                <span className="block font-semibold text-white">
                  Fase de grupos
                </span>
                <span className="mt-1 block text-sm leading-5 text-zinc-400">
                  Los participantes se enfrentan entre sí según las reglas del torneo.
                </span>
              </span>
            </label>
          </div>

          {format === 'GROUP_STAGE' && (
            <div className={labelClassName}>
              <label htmlFor="group-matches" className={labelTextClassName}>
                Partidas por rival
              </label>
              <select
                id="group-matches"
                value={groupMatchesPerOpponent}
                onChange={(event) => {
                  setGroupMatchesPerOpponent(event.target.value)
                  setSuccess(false)
                }}
                className={inputClassName}
              >
                {[1, 2, 3, 4, 5].map((count) => (
                  <option key={count} value={count}>
                    {count} {count === 1 ? 'partida' : 'partidas'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={labelClassName}>
            <label htmlFor="series-best-of" className={labelTextClassName}>
              Formato de las series
            </label>
            <select
              id="series-best-of"
              value={seriesBestOf}
              onChange={(event) => {
                setSeriesBestOf(event.target.value)
                setSuccess(false)
              }}
              className={inputClassName}
            >
              <option value="1">Al mejor de 1 (Bo1)</option>
              <option value="3">Al mejor de 3 (Bo3)</option>
              <option value="5">Al mejor de 5 (Bo5)</option>
            </select>
            <p className="text-xs leading-5 text-zinc-500">
              Define cuántas partidas puede requerir cada enfrentamiento.
            </p>
          </div>

          <div className="border-t border-white/10 pt-6">
            <button
              type="submit"
              disabled={submitting || gamesLoading || games.length === 0}
              className="w-full rounded-xl bg-violet-500 px-5 py-3.5 font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Creando torneo...' : 'Crear torneo'}
            </button>
            <p className="mt-3 text-center text-xs leading-5 text-zinc-500">
              Al crear el torneo, quedará asociado a tu cuenta.
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}

export default CreateTournament
