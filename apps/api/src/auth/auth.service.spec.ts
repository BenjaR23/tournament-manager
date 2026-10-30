import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import { AuthService } from "./auth.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { JwtService } from "@nestjs/jwt";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client.js";
import { hash } from "argon2";

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

    const jwtServiceMock = {
        signAsync: jest.fn<() => Promise<string>>(),
    }

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
                    useValue: jwtServiceMock,
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
        ).rejects.toThrow(ConflictException);

        expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if create fails with P2002', async () => {
        const prismaError = new Prisma.PrismaClientKnownRequestError(
            'Unique constraint failed',
            {
                code: 'P2002',
                clientVersion: 'test',
                meta: {
                    target: ['username'],
                },
            },
        );

        prisma.user.findFirst.mockResolvedValue(null);
        prisma.user.create.mockRejectedValue(prismaError);

        await expect(
            authService.register({
                username: 'test',
                email: 'test@example.com',
                password: 'password123',
            }),
        ).rejects.toThrow(ConflictException);

        expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should rethrow unexpected errors during user creation', async () => {
        const databaseError = new Error('Database unavailable');

        prisma.user.findFirst.mockResolvedValue(null);
        prisma.user.create.mockRejectedValue(databaseError);

        await expect(
            authService.register({
                username: 'test',
                email: 'test@example.com',
                password: 'password123',
            }),
        ).rejects.toBe(databaseError);
    });

    it('should login successfuly', async () => {
        const password = 'password123';

        const user = {
            id: '1328-6816-6548-1594',
            username: 'testuser',
            email: 'testuser@example.com',
            passwordHash: await hash('password123'),
            createdAt: new Date(),
        };

        prisma.user.findFirst.mockResolvedValue(user);

        const token = 'mock-jwt-token';
        jwtServiceMock.signAsync.mockResolvedValue(token);
        const result = await authService.login({
            usernameOrEmail: user.username,
            password: password,
        });
        
        expect(result.accessToken).toEqual(token);
        expect(result.user).toEqual({
            id: user.id,
            username: user.username,
            email: user.email,
        });
        expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({ sub: user.id });
    })

    it('should reject login when user does not exist', async () => {
        prisma.user.findFirst.mockResolvedValue(null);

        await expect(
            authService.login({
                usernameOrEmail: 'wrong-name',
                password: 'wrong-pasword',
            })
        ).rejects.toThrow(UnauthorizedException);

        expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    })

    it('should reject login when password is incorrect', async () => {
        const password = 'test123';
        
        const user = {
            id: '3513-8568-1616-8916',
            username: 'test',
            email: 'test@example.cl',
            createdAt: new Date(),
            passwordHash: await hash(password),
        };

        prisma.user.findFirst.mockResolvedValue(user);

        await expect(
            authService.login({
                usernameOrEmail: user.username,
                password: 'wrong-password',
            }),
        ).rejects.toThrow(UnauthorizedException);

        expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    })
});