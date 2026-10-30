export interface AuthUser {
    id: string
    username: string
    email: string
}

export interface LoginResponse {
    accessToken: string
    user: AuthUser
}

export interface LoginResponse {
    accessToken: string
    user: AuthUser
}

export interface RegisterResponse {
    id: string
    username: string
    email: string
    createdAt: string
}

export interface RegisterPayload {
    username: string
    email: string
    password: string
}

export interface LoginPayload {
    usernameOrEmail: string
    password: string
}