import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import { TournamentsService } from "./tournaments.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { BadRequestException, NotFoundException, ConflictException, ForbiddenException } from "@nestjs/common";
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
            findUnique: jest.fn<() => Promise<{
                id: string,
                startsAt: Date,
                maxPlayers?: number,
                ownerId?: string
            }>>(),
            delete: jest.fn<() => Promise<{ id: string }>>(),
        },
        game: {
            findUnique: jest.fn<() => Promise<{ id: string } | null>>(),
        },
        tournamentParticipant: {
            findUnique: jest.fn<() => Promise<{ id: string } | null>>(),
            count: jest.fn<() => Promise<number>>(),
            create: jest.fn<() => Promise<{
                id: string,
                tournamentId: string,
                userId: string,
                joinedAt: Date,
            }>>(),
            delete: jest.fn<() => Promise<{
                tournamentId_userId: {
                    tournamentId: string,
                    userId: string,
                },
            }>>(),
        },
        $queryRaw: jest.fn<() => Promise<{ id: string }[]>>(),
        $transaction: jest.fn<(...args: any[]) => Promise<any>>(),
    };

    beforeEach(async () => {
        jest.resetAllMocks();
        prisma.$transaction.mockImplementation(async (callback) => callback(prisma))

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

    it('should reject a tournament with a past start date', async () => {
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
    
    it('should register a user for a tournament', async () => {
        const tournamentId = 'tournament-123';
        const userId = 'user-123';

        const tournament = {
            id: tournamentId,
            startsAt: new Date(Date.now() + 86_400_000),
            maxPlayers: 16,
        };

        const participant = {
            id: 'participant-123',
            tournamentId,
            userId,
            joinedAt: new Date(),
        };

        prisma.$queryRaw.mockResolvedValue([{ id: tournamentId }]);
        prisma.tournament.findUnique.mockResolvedValue(tournament);
        prisma.tournamentParticipant.findUnique.mockResolvedValue(null);
        prisma.tournamentParticipant.count.mockResolvedValue(5);
        prisma.tournamentParticipant.create.mockResolvedValue(participant);

        const result = await tournamentsService.joinTournament(
            tournamentId,
            userId,
        );

        expect(result).toEqual(participant);

        expect(prisma.tournamentParticipant.create).toHaveBeenCalledWith({
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

    it('should reject registration when the tournament does not exist', async () => {
        prisma.$queryRaw.mockResolvedValue([]);

        await expect(
            tournamentsService.joinTournament('missing-tournament', 'user-123'),
        ).rejects.toThrow(NotFoundException);

        expect(prisma.tournamentParticipant.create).not.toHaveBeenCalled();
    });

    it('should reject registration whe the tournament has already started', async () => {
        const tournamentId = 'tournament-123';

        prisma.$queryRaw.mockResolvedValue([{ id: tournamentId }]);
        prisma.tournament.findUnique.mockResolvedValue({
            id: tournamentId,
            startsAt: new Date(Date.now() - 60_000),
            maxPlayers: 16,
        });

        await expect(
            tournamentsService.joinTournament(tournamentId, 'user-123'),
        ).rejects.toThrow(BadRequestException);
    });

    it('should reject registration when the user is already registered', async () => {
        const tournamentId = 'tournament-123';

        prisma.$queryRaw.mockResolvedValue([{ id: tournamentId }]);
        prisma.tournament.findUnique.mockResolvedValue({
            id: tournamentId,
            startsAt: new Date(Date.now() + 86_400_000),
            maxPlayers: 16,
        });
        prisma.tournamentParticipant.findUnique.mockResolvedValue({
            id: 'participant-123',
        });

        await expect(
            tournamentsService.joinTournament(tournamentId, 'user-123'),
        ).rejects.toThrow(ConflictException);

        expect(prisma.tournamentParticipant.count).not.toHaveBeenCalled();
        expect(prisma.tournamentParticipant.create).not.toHaveBeenCalled();
    });

    it('should reject registration when the tournament id full', async () => {
        const tournamentId = 'tournament-123';

        prisma.$queryRaw.mockResolvedValue([{ id: tournamentId }]);
        prisma.tournament.findUnique.mockResolvedValue({
            id: tournamentId,
            startsAt: new Date(Date.now() + 86_400_000),
            maxPlayers: 16,
        });
        prisma.tournamentParticipant.findUnique.mockResolvedValue(null);
        prisma.tournamentParticipant.count.mockResolvedValue(16);

        await expect(
            tournamentsService.joinTournament(tournamentId, 'user-123'),
        ).rejects.toThrow(ConflictException);

        expect(prisma.tournamentParticipant.create).not.toHaveBeenCalled();
    });

    it('should leave a tournament successfully', async () => {
        const tournamentId = 'tournament-123';
        const userId = 'user-123';

        prisma.$queryRaw.mockResolvedValue([{ id: tournamentId}]);
        prisma.tournament.findUnique.mockResolvedValue({
            id: tournamentId,
            startsAt: new Date(Date.now() + 48 * 60 * 60 *1000),
        });
        prisma.tournamentParticipant.findUnique.mockResolvedValue({ id: 'participant-123' });
        prisma.tournamentParticipant.delete.mockResolvedValue({
            tournamentId_userId: {
                tournamentId,
                userId,
            },
        });

        const result = await tournamentsService.leaveTournament(
            tournamentId,
            userId,
        );

        expect(result).toEqual({
            message: 'You have left the tournament successfully',
        });

        expect(prisma.tournamentParticipant.delete).toHaveBeenCalledTimes(1);

        expect(prisma.tournamentParticipant.delete).toHaveBeenCalledWith({
            where: {
                tournamentId_userId: {
                    tournamentId,
                    userId,
                },
            },
        });
    });

    it('should reject leaving when the tournament does not exist', async () => {
        prisma.$queryRaw.mockResolvedValue([]);

        await expect(
            tournamentsService.leaveTournament(
                'missing-tournament',
                'user-123',
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prisma.tournament.findUnique).not.toHaveBeenCalled();
        expect(prisma.tournamentParticipant.delete).not.toHaveBeenCalled();
    });

    it('should reject leaving when the tournament has already started', async () => {
        const tournamentId = 'tournament-123';

        prisma.$queryRaw.mockResolvedValue([{ id: tournamentId }]);
        prisma.tournament.findUnique.mockResolvedValue({
            id: tournamentId,
            startsAt: new Date(Date.now() - 60_000),
        });

        await expect(
            tournamentsService.leaveTournament(tournamentId, 'user-123'),
        ).rejects.toThrow(BadRequestException);

        expect(prisma.tournamentParticipant.findUnique).not.toHaveBeenCalled();
        expect(prisma.tournamentParticipant.delete).not.toHaveBeenCalled();
    });

    it('should reject leaving when less tha 24 hours remain before the tournament', async () => {
        const tournamentId = 'tournament-123';

        prisma.$queryRaw.mockResolvedValue([{ id: tournamentId }]);
        prisma.tournament.findUnique.mockResolvedValue({
            id: tournamentId,
            startsAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        });

        await expect(
            tournamentsService.leaveTournament(tournamentId, 'user-123'),
        ).rejects.toThrow(BadRequestException);

        expect(prisma.tournamentParticipant.findUnique).not.toHaveBeenCalled();
        expect(prisma.tournamentParticipant.delete).not.toHaveBeenCalled();
    });

    it('should reject leaving when the user is not registered', async () => {
        const tournamentId = 'tournament-123';

        prisma.$queryRaw.mockResolvedValue([{ id: tournamentId }]);
        prisma.tournament.findUnique.mockResolvedValue({
            id: tournamentId,
            startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        });
        prisma.tournamentParticipant.findUnique.mockResolvedValue(null);

        await expect(
            tournamentsService.leaveTournament(tournamentId, 'user-123'),
        ).rejects.toThrow(NotFoundException);

        expect(prisma.tournamentParticipant.delete).not.toHaveBeenCalled();
    });

    it('should delete a tournament successfully', async () => {
        const tournamentId = 'tournament-123';
        const userId = 'user-123';

        prisma.$queryRaw.mockResolvedValue([{ id: tournamentId }]);
        prisma.tournament.findUnique.mockResolvedValue({
            id: tournamentId,
            ownerId: userId,
            startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        });
        prisma.tournament.delete.mockResolvedValue({ id: tournamentId });

        const result = await tournamentsService.deleteTournament(
            tournamentId,
            userId,
        );

        expect(result).toEqual({
            message: 'Tournament deleted successfully',
            tournamentId,
        });

        expect(prisma.tournament.delete).toHaveBeenCalledWith({
            where: { id: tournamentId },
        });
    });

    it('should reject deleting a tournament that does not exist', async () => {
        prisma.$queryRaw.mockResolvedValue([]);

        await expect(
            tournamentsService.deleteTournament('missing-tournament', 'user-123'),
        ).rejects.toThrow(NotFoundException);

        expect(prisma.tournament.findUnique).not.toHaveBeenCalled();
        expect(prisma.tournament.delete).not.toHaveBeenCalled();
    });

    it('should reject deleting a tournament owned by another user', async () => {
        const tournamentId = 'tournament-123';

        prisma.$queryRaw.mockResolvedValue([{ id: tournamentId }]);
        prisma.tournament.findUnique.mockResolvedValue({
            id: tournamentId,
            ownerId: 'another-user',
            startsAt: new Date(Date.now() + 48 * 60 * 60 *1000),
        });

        await expect(
            tournamentsService.deleteTournament(tournamentId, 'user-123'),
        ).rejects.toThrow(ForbiddenException);

        expect(prisma.tournament.delete).not.toHaveBeenCalled();
    });

    it('should reject deleting a tournament when less than 24 hours remain', async () => {
        const tournamentId = 'tournament-123';

        prisma.$queryRaw.mockResolvedValue([{ id: tournamentId }]);
        prisma.tournament.findUnique.mockResolvedValue({
            id: tournamentId,
            ownerId: 'user-123',
            startsAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        });

        await expect(
            tournamentsService.deleteTournament(tournamentId, 'user-123'),
        ).rejects.toThrow(BadRequestException);

        expect(prisma.tournament.delete).not.toHaveBeenCalled();
    });

    it('should reject deleting a tournament that has already started', async () => {
        const tournamentId = 'tournamend-123';

        prisma.$queryRaw.mockResolvedValue([{ id: tournamentId }]);
        prisma.tournament.findUnique.mockResolvedValue({
            id: tournamentId,
            ownerId: 'user-123',
            startsAt: new Date(Date.now() - 60_000),
        });

        await expect(
            tournamentsService.deleteTournament(tournamentId, 'user-123'),
        ).rejects.toThrow(BadRequestException);

        expect(prisma.tournament.delete).not.toHaveBeenCalled();
    });
});