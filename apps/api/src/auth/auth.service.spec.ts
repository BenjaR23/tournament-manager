import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import { AuthService } from "./auth.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { JwtService } from "@nestjs/jwt";
import { ConflictException } from "@nestjs/common";

describe('AuthService', () => {
    let authService: AuthService;

    const prisma = {
        user: {
            findFirst: jest.fn<(
                args: {
                    where: {
                        OR: [
                            { username: string },
                            { email: string },
                        ];
                    };
                }
            ) => Promise<{
                id: string,
                username: string,
                email: string,
                createdAt: Date,
            } | null>>(),
            create: jest.fn<(
                args: {
                    data: {
                        username: string;
                        email: string;
                        passwordHash: string;
                    };
                    select: {
                        id: true;
                        username: true;
                        email: true;
                        createdAt: true;
                    };
                }
            ) => Promise<{
                id: string,
                username: string,
                email: string,
                createdAt: Date,
            }>>(),
        },
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const moduleRef = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
                {
                    provide: JwtService,
                    useValue: {},
                },
            ],
        }).compile();

        authService = moduleRef.get(AuthService);
    });

    it('should register a user successfully', async () => {
        const publicUser = {
            id: 'user-123',
            username: "test",
            email: 'test@example.com',
            createdAt: new Date(),
        };

        prisma.user.findFirst.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue(publicUser);

        const result = await authService.register({
            username: 'test',
            email: 'test@example.com',
            password: 'password123',
        });

        const createArgs = prisma.user.create.mock.calls[0][0];

        expect(createArgs.data.passwordHash).not.toBe('password123');
        expect(createArgs.data.passwordHash).toBeTruthy();

        expect(prisma.user.findFirst).toHaveBeenCalledWith({
            where: {
                OR: [
                    { username: 'test' },
                    { email: 'test@example.com' },
                ],
            },
        });

        expect(result).toEqual(publicUser);
        expect(prisma.user.findFirst).toHaveBeenCalled();
        expect(prisma.user.create).toHaveBeenCalled();
        expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw a ConflictException if user already exists', async () => {
        const existingUser = {
            id: 'user-123',
            username: "test",
            email: 'test@example.com',
            createdAt: new Date(),
        };

        prisma.user.findFirst.mockResolvedValue(existingUser);

        await expect(
            authService.register({
                username: 'test',
                email: 'test@example.com',
                password: 'password123',
            }),
        ).rejects.toThrow('A user with this username or email already exists.');

        await expect(
            authService.register({
                username: 'test',
                email: 'test@example.com',
                password: 'password123',
            }),
        ).rejects.toThrow(ConflictException);

        expect(prisma.user.create).not.toHaveBeenCalled();
    })
});