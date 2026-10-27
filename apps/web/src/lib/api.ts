const API_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
).replace(/\/$/, '')

export class ApiError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

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
      // Si el servidor no devuelve JSON, conservamos el error genérico.
    }

    throw new ApiError(message, response.status)
  }

  return response.json() as Promise<T>
}