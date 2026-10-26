
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Authentication (e2e)', () => {
    let app: INestApplication;
    let prismaService: PrismaService;

    const suffix = randomUUID();
    const username = `e2e-${suffix.slice(0, 12)}`;
    const email = `e2e-${suffix}@test.local`;
    const password = 'TestPassword123!';

    beforeAll(async () => {
        const moduleFixture: TestingModule =
            await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        prismaService = app.get(PrismaService);
    });

    afterAll(async () => {
        try {
            await prismaService.user.deleteMany({
                where: {
                    OR: [
                        { username },
                        { email },
                    ],
                },
            });
        } finally {
            await app.close();
        }
    });

    it('should register a user and allow them to log in', async () => {
        const registration = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                username,
                email,
                password,
            })
            .expect(201);

        expect(registration.body).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                username,
                email,
                createdAt: expect.any(String),
            }),
        );

        expect(registration.body).not.toHaveProperty('passwordHash');

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                usernameOrEmail: email,
                password,
            })
            .expect(201);

        expect(login.body).toEqual(
            expect.objectContaining({
                accessToken: expect.any(String),
                user: {
                    id: registration.body.id,
                    username,
                    email,
                },
            }),
        );

        expect(login.body.user).not.toHaveProperty('passwordHash');
    });
});
