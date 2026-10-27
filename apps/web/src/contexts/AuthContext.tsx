import { useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from './auth-context'
import { apiFetch, clearStoredToken, storeToken } from '../lib/api'
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from '../types/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem('tournament-manager-user')

    if (!storedUser) return null

    try {
      return JSON.parse(storedUser) as AuthUser
    } catch {
      localStorage.removeItem('tournament-manager-user')
      return null
    }
  })

  async function login(payload: LoginPayload) {
    const result = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    storeToken(result.accessToken)
    localStorage.setItem(
      'tournament-manager-user',
      JSON.stringify(result.user),
    )
    setUser(result.user)
  }

  
  async function register(
    payload: RegisterPayload,
  ): Promise<RegisterResponse> {
    const result = await apiFetch<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    // Una vez creada la cuenta, iniciamos sesión automáticamente.
    await login({
      usernameOrEmail: payload.email,
      password: payload.password,
    })

    return result
  }


  function logout() {
    clearStoredToken()
    localStorage.removeItem('tournament-manager-user')
    setUser(null)
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
