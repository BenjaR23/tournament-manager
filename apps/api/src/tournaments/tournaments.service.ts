import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { fromZonedTime } from 'date-fns-tz';

interface ListTournamentsParams {
    page: number,
    limit: number,
    game?: string,
    date?: string,
    participantsOrder: 'asc' | 'desc',
}

@Injectable()
export class TournamentsService {
    constructor(private readonly prismaService: PrismaService) {}

    async getTournaments(params: ListTournamentsParams) {
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

        const [tournaments, total] = await Promise.all([
            this.prismaService.tournament.findMany({
                where,
                skip: (params.page - 1) * params.limit,
                take: params.limit,
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
                orderBy: [
                    { startsAt: 'asc'},
                    { participants: { _count: params.participantsOrder } },
                    { id: 'asc' },
                ],
            }),
            this.prismaService.tournament.count({ where }),
        ]);

        const totalPages = Math.ceil(total / params.limit);

        return {
            data: tournaments,
            meta: {
                page: params.page,
                limit: params.limit,
                total,
                totalPages,
            },
        };
    };
}