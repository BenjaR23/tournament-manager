import { jest } from "@jest/globals";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "./jwt-auth.guard.js";

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;

    const jwtServiceMock = {
        verifyAsync: jest.fn<(token: string) => Promise<{ sub: string }>>(),
    };

    type MockRequest = {
        headers: {
            authorization: string;
        };
        user?: {
            userId: string;
        };
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const moduleRef = await Test.createTestingModule({
            providers: [
                JwtAuthGuard,
                {
                    provide: JwtService,
                    useValue: jwtServiceMock,
                },
            ],
        }).compile();

        guard = moduleRef.get(JwtAuthGuard);
    });

    it('should reject request without token', async () => {
        const request = {
            headers: {},
        };

        const context = {
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        } as unknown as ExecutionContext;

        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject request with invalid token', async () => {
        const request = {
            headers: {
                authorization: 'Bearer invalid-token'
            }
        };

        const context = {
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        } as unknown as ExecutionContext;

        jwtServiceMock.verifyAsync.mockRejectedValue(
            new Error('Invalid token')
        );

        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject request with expired token', async () => {
        const request = {
            headers: {
                authorization: 'Bearer expired-token',
            },
        };

        const context = {
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        } as unknown as ExecutionContext;

        jwtServiceMock.verifyAsync.mockRejectedValue(
            new Error('jwt expired'),
        );

        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should allow request with valid token and attach user', async () => {
        const request: MockRequest = {
            headers: {
                authorization: 'Bearer valid-token',
            },
        };

        const context = {
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        } as unknown as ExecutionContext;

        jwtServiceMock.verifyAsync.mockResolvedValue({ sub: 'user123' });

        const result = await guard.canActivate(context);

        expect(result).toEqual(true);
        expect(request.user).toEqual({ userId: 'user123' });
        expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('valid-token');
    });
});