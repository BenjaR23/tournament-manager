const API_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
).replace(/\/$/, '')

const TOKEN_KEY = 'tournament-manager-token'

export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired'

export class ApiError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers)

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getStoredToken()

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  })

  if (response.status === 401 && headers.has('Authorization')) {
    window.dispatchEvent(
      new Event(AUTH_SESSION_EXPIRED_EVENT),
    )
  }

  if (!response.ok) {
    let message = `Error al consultar la API (${response.status})`

    try {
      const body: unknown = await response.json()

      if (
        typeof body === 'object' &&
        body !== null &&
        'message' in body
      ) {
        const apiMessage = body.message

        if (typeof apiMessage === 'string') {
          message = apiMessage
        } else if (
          Array.isArray(apiMessage) &&
          apiMessage.every((item) => typeof item === 'string')
        ) {
          message = apiMessage.join(', ')
        }
      }
    } catch {
      // Conservamos el mensaje genérico si el servidor no devuelve JSON.
    }

    throw new ApiError(message, response.status)
  }

  return response.json() as Promise<T>
}
