import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import { TournamentsService } from "./tournaments.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

describe('TournamentsService', () => {
    let tournamentsService: TournamentsService;

    const prisma = {
        tournament: {
            findMany: jest.fn<() => Promise<{
                id: string,
                name: string,
                description: string | null,
                startsAt: Date,
                maxPlayers: number,
                format: string,
                seriesBestOf: number,
                groupMatchesPerOpponent: number | null,
                owner: {
                    id: string,
                    username: string,
                },
                game: {
                    id: string,
                    name: string,
                    slug: string,
                },
                _count: {
                    participants: number,
                },
            }[]>>(),
            count: jest.fn<() => Promise<number>>(),
        },
    };

    beforeEach(async () => {
        jest.resetAllMocks();

        const moduleRef = await Test.createTestingModule({
            providers: [
                TournamentsService,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        tournamentsService = moduleRef.get(TournamentsService);
    });

    it('should return all tournaments', async () => {
        const tournament = {
            id: "1263-1244-7457",
            name: "Pokemon Tournament",
            description: null,
            startsAt: new Date("2026-11-15T18:00:00.000Z"),
            maxPlayers: 16,
            format: "SINGLE_ELIMINATION",
            seriesBestOf: 3,
            groupMatchesPerOpponent: null,
            owner: {
                id: "2893-5723-5257",
                username: "Rodrigo",
            },
            game: {
                id: "3550efbe-28d0-4047-91f1-811d89e9ad26",
                name: "Pokémon",
                slug: "pokemon",
            },
            _count: {
                participants: 4,
            },
        };

        prisma.tournament.findMany.mockResolvedValue([tournament]);
        prisma.tournament.count.mockResolvedValue(1);

        const result = await tournamentsService.getTournaments({
            page: 1,
            limit: 12,
            participantsOrder: 'desc',
        });

        expect(result).toEqual({
            data: [tournament],
            meta: {
                page: 1,
                limit: 12,
                total: 1,
                totalPages: 1,
            },
        });

        expect(prisma.tournament.findMany).toHaveBeenCalled();
        expect(prisma.tournament.count).toHaveBeenCalled();
    });

    it('should return empty data when no tournaments exist', async () => {
        prisma.tournament.findMany.mockResolvedValue([]);
        prisma.tournament.count.mockResolvedValue(0);

        const result = await tournamentsService.getTournaments({
            page: 1,
            limit: 12,
            participantsOrder: 'desc',
        });

        expect(result).toEqual({
            data: [],
            meta: {
                page: 1,
                limit: 12,
                total: 0,
                totalPages: 0,
            },
        });
    });

    it('should apply pagination correctly', async () => {
        prisma.tournament.findMany.mockResolvedValue([]);
        prisma.tournament.count.mockResolvedValue(25);

        await tournamentsService.getTournaments({
            page: 2,
            limit: 12,
            participantsOrder: 'desc',
        });

        expect(prisma.tournament.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 12,
                take: 12,
            }),
        );
    });

    it('should filter tournaments by game slug', async () => {
        prisma.tournament.findMany.mockResolvedValue([]);
        prisma.tournament.count.mockResolvedValue(0);

        await tournamentsService.getTournaments({
            page: 1,
            limit: 12,
            game: 'pokemon',
            participantsOrder: 'desc',
        });

        expect(prisma.tournament.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    game: {
                        slug: 'pokemon',
                    },
                },
            }),
        );

        expect(prisma.tournament.count).toHaveBeenCalledWith({
            where: {
                game: {
                    slug: 'pokemon',
                },
            },
        });
    });

    it('should filter tournaments by Chilean calendar date', async () => {
        prisma.tournament.findMany.mockResolvedValue([]);
        prisma.tournament.count.mockResolvedValue(0);

        await tournamentsService.getTournaments({
            page: 1,
            limit: 12,
            date:'2026-06-15',
            participantsOrder: 'desc',
        });

        expect(prisma.tournament.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    startsAt: {
                        gte: new Date('2026-06-15T04:00:00.000Z'),
                        lt: new Date('2026-06-16T04:00:00.000Z'),
                    },
                },
            }),
        );
    });

    it('should apply the requested participant ordering', async () => {
        prisma.tournament.findMany.mockResolvedValue([]);
        prisma.tournament.count.mockResolvedValue(0);

        await tournamentsService.getTournaments({
            page: 1,
            limit: 12,
            participantsOrder: 'asc',
        });

        expect(prisma.tournament.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy : [
                    { startsAt: 'asc' },
                    { participants: { _count: 'asc' } },
                    { id: 'asc' },
                ],
            }),
        );
    });

    it('should propagate Prisma errors', async () => {
        const error = new Error('Database error');

        prisma.tournament.findMany.mockRejectedValue(error);

        await expect(
            tournamentsService.getTournaments({
                page: 1,
                limit: 12,
                participantsOrder: 'desc',
            }),
        ).rejects.toThrow('Database error');
    });
});