
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { TournamentsService } from '../src/tournaments/tournaments.service.js';
import { TournamentFormat } from '../src/generated/prisma/enums.js';

describe('Tournament concurrency (e2e)', () => {
    let app: INestApplication;
    let prismaService: PrismaService;
    let tournamentsService: TournamentsService;

    beforeAll(async () => {
        const moduleFixture: TestingModule =
            await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        prismaService = app.get(PrismaService);
        tournamentsService = app.get(TournamentsService);
    });

    afterAll(async () => {
        await app.close();
    });

    it('should prevent concurrent registrations from exceeding tournament capacity', async () => {
        const suffix = randomUUID();
        const createdUserIds: string[] = [];
        let tournamentId: string | undefined;

        try {
            // 1. Find a game already created by the seed.
            const game = await prismaService.game.findUnique({
                where: { slug: 'pokemon' },
                select: { id: true },
            });

            if (!game) {
                throw new Error(
                    'The Pokémon game was not found. Run the database seed first.',
                );
            }

            // 2. Create the owner and three different participants.
            const owner = await prismaService.user.create({
                data: {
                    username: `owner-${suffix}`,
                    email: `owner-${suffix}@test.local`,
                    passwordHash: 'not-a-real-password-hash',
                },
            });
            createdUserIds.push(owner.id);

            const initialUser = await prismaService.user.create({
                data: {
                    username: `initial-${suffix}`,
                    email: `initial-${suffix}@test.local`,
                    passwordHash: 'not-a-real-password-hash',
                },
            });
            createdUserIds.push(initialUser.id);

            const userA = await prismaService.user.create({
                data: {
                    username: `player-a-${suffix}`,
                    email: `player-a-${suffix}@test.local`,
                    passwordHash: 'not-a-real-password-hash',
                },
            });
            createdUserIds.push(userA.id);

            const userB = await prismaService.user.create({
                data: {
                    username: `player-b-${suffix}`,
                    email: `player-b-${suffix}@test.local`,
                    passwordHash: 'not-a-real-password-hash',
                },
            });
            createdUserIds.push(userB.id);

            // 3. Create a tournament with capacity for two players.
            const tournament = await prismaService.tournament.create({
                data: {
                    name: `Concurrency test ${suffix}`,
                    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    maxPlayers: 2,
                    format: TournamentFormat.SINGLE_ELIMINATION,
                    seriesBestOf: 1,
                    gameId: game.id,
                    ownerId: owner.id,
                },
                select: { id: true },
            });
            tournamentId = tournament.id;

            // 4. Fill the first spot.
            await tournamentsService.joinTournament(
                tournamentId,
                initialUser.id,
            );

            // 5. Both users attempt to take the final spot simultaneously.
            const results = await Promise.allSettled([
                tournamentsService.joinTournament(
                    tournamentId,
                    userA.id,
                ),
                tournamentsService.joinTournament(
                    tournamentId,
                    userB.id,
                ),
            ]);

            const successful = results.filter(
                (result) => result.status === 'fulfilled',
            );
            const rejected = results.filter(
                (result) => result.status === 'rejected',
            );

            // 6. Exactly one registration should succeed.
            expect(successful).toHaveLength(1);
            expect(rejected).toHaveLength(1);

            if (rejected[0].status === 'rejected') {
                expect(rejected[0].reason).toBeInstanceOf(
                    ConflictException,
                );
                expect(rejected[0].reason.message).toBe(
                    'The tournament has reached its maximum capacity',
                );
            }

            // 7. Verify the actual final state in PostgreSQL.
            const finalCount =
                await prismaService.tournamentParticipant.count({
                    where: { tournamentId },
                });

            expect(finalCount).toBe(2);
        } finally {
            // Clean up only the records created by this test.
            if (tournamentId) {
                await prismaService.tournament.deleteMany({
                    where: { id: tournamentId },
                });
            }

            if (createdUserIds.length > 0) {
                await prismaService.user.deleteMany({
                    where: {
                        id: { in: createdUserIds },
                    },
                });
            }
        }
    });
});
