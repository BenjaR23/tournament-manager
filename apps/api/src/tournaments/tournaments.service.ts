import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { fromZonedTime } from 'date-fns-tz';
import { CreateTournamentDto } from "./dto/create-tournament.dto.js";
import { TournamentFormat } from "../generated/prisma/enums.js";

interface ListTournamentsParams {
    page: number,
    limit: number,
    game?: string,
    date?: string,
    participantsOrder?: 'asc' | 'desc',
}

@Injectable()
export class TournamentsService {
    constructor(private readonly prismaService: PrismaService) {}

    async getTournaments(params: ListTournamentsParams) {
        const page = Number.isInteger(params.page) && params.page >= 1
            ? params.page
            : 1;

        const limit = Number.isInteger(params.limit) && params.limit >= 1
            ? params.limit
            : 12;

        let start: Date | undefined;
        let end: Date | undefined;

        if (params.date) {
            const [year, month, day] = params.date.split('-').map(Number);

            const nextDay = new Date(Date.UTC(year, month - 1, day + 1));

            const nextDate = [
                nextDay.getUTCFullYear(),
                String(nextDay.getUTCMonth() + 1).padStart(2, '0'),
                String(nextDay.getUTCDate()).padStart(2, '0'),
            ].join('-');

            start = fromZonedTime(
                `${params.date} 00:00:00`,
                'America/Santiago',
            );

            end = fromZonedTime(
                `${nextDate} 00:00:00`,
                'America/Santiago',
            );
        }

        const where = {
            ...(params.game && {
                game: {
                    slug: params.game,
                },
            }),

            ...(start && end && {
                startsAt: {
                    gte: start,
                    lt: end,
                },
            }),
        };

        const orderBy = [
            { startsAt: 'asc' as const },
            ...(params.participantsOrder
                ? [{ participants: { _count: params.participantsOrder } }]
                : []),
            { id: 'asc' as const },
        ];

        const [tournaments, total] = await Promise.all([
            this.prismaService.tournament.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    startsAt: true,
                    maxPlayers: true,
                    format: true,
                    seriesBestOf: true,
                    groupMatchesPerOpponent: true,
                    owner: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    game: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    _count: {
                        select: {
                            participants: true,
                        },
                    },
                },
                orderBy,
            }),
            this.prismaService.tournament.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data: tournaments,
            meta: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    };

    async getTournamentDetail(id: string, userId?: string) {
        const tournamentDetail = await this.prismaService.tournament.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                name: true,
                description: true,
                startsAt: true,
                maxPlayers: true,
                format: true,
                seriesBestOf: true,
                groupMatchesPerOpponent: true,
                owner: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                game: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
        });

        if (!tournamentDetail) {
            throw new NotFoundException('Tournament not found');
        }

        let isRegistered = false;

        if (userId) {
            const participant = await this.prismaService.tournamentParticipant.findUnique({
                where: {
                    tournamentId_userId: {
                        tournamentId: id,
                        userId,
                    },
                },
                select: {
                    id: true,
                },
            });

            isRegistered = Boolean(participant);
        }

        return {
            ...tournamentDetail,
            isRegistered,
        }
    };

    async createTournament(body: CreateTournamentDto, ownerId: string) {
        const startsAt = new Date(body.startsAt);

        if (startsAt <= new Date()) {
            throw new BadRequestException('The tournament start date must be in the future');
        }

        if (body.format === TournamentFormat.SINGLE_ELIMINATION && body.groupMatchesPerOpponent !== undefined) {
            throw new BadRequestException('You cannot configure matches per opponent for a single-elimination tournament');
        }

        const groupMatchesPerOpponent =
            body.format === TournamentFormat.GROUP_STAGE
                ? body.groupMatchesPerOpponent
                : null;

        const game = await this.prismaService.game.findUnique({
            where: { id: body.gameId },
            select: { id: true },
        });

        if (!game) {
            throw new NotFoundException('The selected game was not found');
        }

        const newTournament = await this.prismaService.tournament.create({
            select: {
                name: true,
                description: true,
                maxPlayers: true,
                format: true,
                seriesBestOf: true,
                startsAt: true,
                groupMatchesPerOpponent: true,
                game: true,
                owner: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                _count: {
                    select: {
                        participants: true,
                    }
                }
            },
            data: {
                name: body.name,
                description: body.description,
                maxPlayers: body.maxPlayers,
                format: body.format,
                seriesBestOf: body.seriesBestOf,
                startsAt,
                groupMatchesPerOpponent,
                game: {
                    connect: {
                        id: body.gameId
                    },
                },
                owner: {
                    connect: {
                        id: ownerId,
                    },
                },
            },
        });

        return newTournament;
    };

    async joinTournament(tournamentId: string, userId: string) {
        return this.prismaService.$transaction(async (tx) => {
            // Lock the tournament row to prevent concurrent registrations
            const tournaments = await tx.$queryRaw<{ id: string }[]>`
                SELECT "id"
                FROM "Tournament"
                WHERE "id" = ${tournamentId}
                FOR UPDATE
            `;

            if (tournaments.length === 0) {
                throw new NotFoundException('Tournament not found');
            }

            const tournament = await tx.tournament.findUnique({
                select: {
                    id: true,
                    startsAt: true,
                    maxPlayers: true,
                },
                where: {
                    id: tournamentId,
                },
            });

            if (!tournament) {
                throw new NotFoundException('Tournament not found');
            }

            if (tournament.startsAt <= new Date()) {
                throw new BadRequestException(
                    'You cannot join a tournament that has already started',
                );
            }

            const isRegistered = await tx.tournamentParticipant.findUnique({
                select: {
                    id: true,
                },
                where: {
                    tournamentId_userId: {
                        tournamentId,
                        userId,
                    },
                },
            });

            if (isRegistered) {
                throw new ConflictException(
                    'You are already registered for this tournament',
                );
            }

            const participantCount = await tx.tournamentParticipant.count({
                where: {
                    tournamentId,
                },
            });

            if (participantCount >= tournament.maxPlayers) {
                throw new ConflictException(
                    'The tournament has reached its maximum capacity',
                );
            }

            return tx.tournamentParticipant.create({
                select: {
                    id: true,
                    tournamentId: true,
                    userId: true,
                    joinedAt: true,
                },
                data: {
                    tournamentId,
                    userId,
                },
            });
        });
    }

    async leaveTournament(tournamentId: string, userId: string) {
        return this.prismaService.$transaction(async (tx) => {
            const tournaments = await tx.$queryRaw<{ id: string }[]>`
                SELECT "id"
                FROM "Tournament"
                WHERE "id" = ${tournamentId}
                FOR UPDATE
            `;

            if (tournaments.length === 0) {
                throw new NotFoundException('Tournament not found')
            }

            const tournament = await tx.tournament.findUnique({
                select: {
                    id: true,
                    startsAt: true,
                },
                where: {
                    id: tournamentId,
                },
            });

            if (!tournament) {
                throw new NotFoundException('Tournament not found');
            }

            const now = Date.now();
            const startsAt = tournament.startsAt.getTime();
            const minimumNotice = 24 * 60 * 60 * 1000;

            if (startsAt <= now) {
                throw new BadRequestException(
                    'You cannot leave a tournament that has already started',
                );
            }

            if (startsAt - now < minimumNotice) {
                throw new BadRequestException(
                    'You can only leave a tournament at least 24 hours before it starts'
                );
            }

            const participation = await tx.tournamentParticipant.findUnique({
                where: {
                    tournamentId_userId: {
                        tournamentId,
                        userId,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (!participation) {
                throw new NotFoundException(
                    'You are not registered for this tournament',
                );
            }

            await tx.tournamentParticipant.delete({
                where: {
                    tournamentId_userId: {
                        tournamentId,
                        userId,
                    },
                },
            });

            return {
                message: 'You have left the tournament successfully',
            };
        });
    }

    async deleteTournament(tournamentId: string, userId: string) {
        return this.prismaService.$transaction(async (tx) => {
            const tournaments = await tx.$queryRaw<{ id: string}[]>`
                SELECT "id"
                FROM "Tournament"
                WHERE "id" = ${tournamentId}
                FOR UPDATE
            `;

            if(tournaments.length === 0) {
                throw new NotFoundException('Tournament not found')
            }

            const tournament = await tx.tournament.findUnique({
                select: {
                    id: true,
                    ownerId: true,
                    startsAt: true,
                },
                where: {
                    id: tournamentId
                },
            });

            if (!tournament) {
                throw new NotFoundException('Tournament not found')
            }

            if (tournament.ownerId !== userId) {
                throw new ForbiddenException('User is not owner')
            }

            const now = Date.now();
            const startsAt = tournament.startsAt.getTime();
            const minimumNotice = 24 * 60 * 60 * 1000;

            if (startsAt <= now) {
                throw new BadRequestException(
                    'You cannot delete a tournament that has already started',
                );
            }

            if (startsAt - now < minimumNotice) {
                throw new BadRequestException(
                    'You can only delete a tournament at least 24 hours before it starts'
                );
            }

            const deletedTournament = await tx.tournament.delete({
                where: {
                    id: tournamentId
                },
            });

            return {
                message: 'Tournament deleted successfully',
                tournamentId: deletedTournament.id,
            };
        })
    }
}