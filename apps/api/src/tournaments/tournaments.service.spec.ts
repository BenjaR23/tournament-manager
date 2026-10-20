import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import { TournamentsService } from "./tournaments.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TournamentFormat } from "../generated/prisma/enums.js";

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
            create: jest.fn<() => Promise<any>>(),
        },
        game: {
            findUnique: jest.fn<() => Promise<{ id: string } | null>>(),
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

    it('should create a tournament for the given owner and game', async () => {
        const body = {
            name: 'Pokemon Tournament',
            description: 'Test tournament',
            startsAt: '2026-11-15T18:00:00.000Z',
            gameId: '3550efbe-28d0-4047-91f1-811d89e9ad26',
            maxPlayers: 16,
            format: TournamentFormat.SINGLE_ELIMINATION,
            seriesBestOf: 3,
        };

        const ownerId = '2893-5723-5257';

        const createdTournament = {
            id: '1263-1244-7457',
            name: body.name,
            description: body.description,
            startsAt: new Date(body.startsAt),
            maxPlayers: body.maxPlayers,
            format: body.format,
            seriesBestOf: body.seriesBestOf,
            groupMatchesPerOpponent: null,
            game: {
                id: body.gameId,
                name: 'Pokemon',
                slug: 'pokemon',
            },
            owner: {
                id: ownerId,
                username: 'Rodrigo',
            },
            _count: {
                participants: 0,
            },
        };

        prisma.game.findUnique.mockResolvedValue({ id: body.gameId });
        prisma.tournament.create.mockResolvedValue(createdTournament);

        const result = await tournamentsService.createTournament(body, ownerId);

        expect(result).toEqual(createdTournament);

        expect(prisma.game.findUnique).toHaveBeenCalledWith({
            where: { id: body.gameId },
            select: { id: true },
        });

        expect(prisma.tournament.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    name: body.name,
                    startsAt: new Date(body.startsAt),
                    game: { connect: { id: body.gameId }},
                    owner: { connect: { id: ownerId }},
                    groupMatchesPerOpponent: null,
                }),
            }),
        );
    });

    it('should reject a tournament with a pas start date', async () => {
        const body = {
            name: 'Past Tournament',
            startsAt: '2020-01-01T12:00:00.000Z',
            gameId: '3550efbe-28d0-4047-91f1-811d89e9ad26',
            maxPlayers: 16,
            format: TournamentFormat.SINGLE_ELIMINATION,
            seriesBestOf: 3,
        };

        await expect(tournamentsService.createTournament(body, '2893-5723-5257')).rejects.toThrow(BadRequestException);

        expect(prisma.game.findUnique).not.toHaveBeenCalled();
        expect(prisma.tournament.create).not.toHaveBeenCalled();
    });

    it('should reject a tournament when the game does not exist', async () => {
        const body = {
            name: 'Pokemon Tournament',
            startsAt: '2026-11-15T18:00:00.000Z',
            gameId: '3550efbe-28d0-4047-91f1-811d89e9ad26',
            maxPlayers: 16,
            format: TournamentFormat.SINGLE_ELIMINATION,
            seriesBestOf: 3,
        };

        prisma.game.findUnique.mockResolvedValue(null);

        await expect(tournamentsService.createTournament(body, '2893-5723-5257')).rejects.toThrow(NotFoundException);

        expect(prisma.tournament.create).not.toHaveBeenCalled();
    });
});