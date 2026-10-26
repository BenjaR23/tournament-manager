
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Tournament critical flows (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    const suffix = randomUUID();
    const ownerUsername = `owner-${suffix.slice(0, 12)}`;
    const participantUsername = `player-${suffix.slice(0, 12)}`;
    const ownerEmail = `owner-${suffix}@test.local`;
    const participantEmail = `player-${suffix}@test.local`;
    const password = 'TestPassword123!';
    const tournamentName = `E2E Tournament ${suffix}`;

    beforeAll(async () => {
        const moduleFixture: TestingModule =
            await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        prisma = app.get(PrismaService);
    });

    afterAll(async () => {
        try {
            await prisma.tournament.deleteMany({
                where: { name: tournamentName },
            });

            await prisma.user.deleteMany({
                where: {
                    OR: [
                        { username: ownerUsername },
                        { username: participantUsername },
                        { email: ownerEmail },
                        { email: participantEmail },
                    ],
                },
            });
        } finally {
            await app.close();
        }
    });

    it('should create, join and leave a tournament through HTTP', async () => {
        // Register both users through the API.
        const ownerRegistration = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                username: ownerUsername,
                email: ownerEmail,
                password,
            })
            .expect(201);

        const participantRegistration = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                username: participantUsername,
                email: participantEmail,
                password,
            })
            .expect(201);

        // Obtain real JWTs through the login endpoint.
        const ownerLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                usernameOrEmail: ownerEmail,
                password,
            })
            .expect(201);

        const participantLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                usernameOrEmail: participantUsername,
                password,
            })
            .expect(201);

        const ownerToken = ownerLogin.body.accessToken;
        const participantToken = participantLogin.body.accessToken;

        expect(ownerToken).toEqual(expect.any(String));
        expect(participantToken).toEqual(expect.any(String));

        // Discover a real game instead of relying on a hardcoded ID.
        const gamesResponse = await request(app.getHttpServer())
            .get('/games')
            .expect(200);

        expect(gamesResponse.body.length).toBeGreaterThan(0);

        const gameId = gamesResponse.body[0].id;

        // Create a tournament as the authenticated owner.
        const startsAt = new Date(
            Date.now() + 48 * 60 * 60 * 1000,
        ).toISOString();

        const creation = await request(app.getHttpServer())
            .post('/tournaments')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: tournamentName,
                description: 'E2E critical flow',
                startsAt,
                gameId,
                maxPlayers: 4,
                format: 'SINGLE_ELIMINATION',
                seriesBestOf: 3,
            })
            .expect(201);

        const persistedTournament = await prisma.tournament.findFirstOrThrow({
            where: { name: tournamentName },
        });

        const tournamentId = persistedTournament.id;

        expect(creation.body).toEqual(
            expect.objectContaining({
                name: tournamentName,
                maxPlayers: 4,
                owner: expect.objectContaining({
                    id: ownerRegistration.body.id,
                    username: ownerUsername,
                }),
                game: expect.objectContaining({ id: gameId }),
            }),
        );

        // Verify that the tournament was persisted.
        await expect(
            prisma.tournament.findUnique({
                where: { id: tournamentId },
            }),
        ).resolves.toEqual(
            expect.objectContaining({
                name: tournamentName,
                ownerId: ownerRegistration.body.id,
                gameId,
            }),
        );

        // The public listing should include the newly created tournament.
        const listing = await request(app.getHttpServer())
            .get('/tournaments')
            .expect(200);

        expect(listing.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: tournamentId,
                    name: tournamentName,
                    owner: expect.objectContaining({
                        id: ownerRegistration.body.id,
                        username: ownerUsername,
                    }),
                    game: expect.objectContaining({
                        id: gameId,
                    }),
                    _count: expect.objectContaining({
                        participants: 0,
                    }),
                }),
            ]),
        );

        // The second user joins through the protected HTTP endpoint.
        const participation = await request(app.getHttpServer())
            .post(`/tournaments/${tournamentId}/participants`)
            .set('Authorization', `Bearer ${participantToken}`)
            .expect(201);

        expect(participation.body).toEqual(
            expect.objectContaining({
                tournamentId,
                userId: participantRegistration.body.id,
            }),
        );

        await expect(
            prisma.tournamentParticipant.findUnique({
                where: {
                    tournamentId_userId: {
                        tournamentId,
                        userId: participantRegistration.body.id,
                    },
                },
            }),
        ).resolves.toEqual(
            expect.objectContaining({
                tournamentId,
                userId: participantRegistration.body.id,
            }),
        );

        // The same user leaves through HTTP.
        await request(app.getHttpServer())
            .delete(`/tournaments/${tournamentId}/participants`)
            .set('Authorization', `Bearer ${participantToken}`)
            .expect(200)
            .expect({
                message: 'You have left the tournament successfully',
            });

        // Verify that the participation was actually deleted.
        await expect(
            prisma.tournamentParticipant.findUnique({
                where: {
                    tournamentId_userId: {
                        tournamentId,
                        userId: participantRegistration.body.id,
                    },
                },
            }),
        ).resolves.toBeNull();
    });

    it('should reject protected tournament endpoints without a JWT', async () => {
        const tournamentId = randomUUID();

        await request(app.getHttpServer())
            .post('/tournaments')
            .expect(401);

        await request(app.getHttpServer())
            .post(`/tournaments/${tournamentId}/participants`)
            .expect(401);

        await request(app.getHttpServer())
            .delete(`/tournaments/${tournamentId}/participants`)
            .expect(401);
    });
});
