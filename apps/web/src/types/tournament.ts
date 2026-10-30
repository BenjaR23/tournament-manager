export interface Game {
    id: string
    name: string
    slug: string
}

export interface Tournament {
    id: string
    name: string
    description: string | null
    startsAt: string
    maxPlayers: number
    format: 'SINGLE_ELIMINATION' | 'GROUP_STAGE'
    seriesBestOf: number
    groupMatchesPerOpponent: number | null
    owner: {
        id: string
        username: string
    }
    game: Game
    _count: {
        participants: number
    }
    isRegistered: boolean
}

export interface PaginatedResponse<T> {
    data: T[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}