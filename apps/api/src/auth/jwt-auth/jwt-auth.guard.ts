import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from 'express';

interface JwtPayload {
    sub: string;
}

interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
    };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: AuthenticatedRequest = context.switchToHttp().getRequest();

        const authorization = request.headers.authorization;

        if (
            typeof authorization !== 'string' ||
            !authorization.startsWith('Bearer ') ||
            !authorization.slice(7).trim()
        ) {
            throw new UnauthorizedException();
        }

        const token = authorization.slice(7);

        let payload: JwtPayload;

        try {
            payload = await this.jwtService.verifyAsync(token);
        } catch {
            throw new UnauthorizedException();
        }

        if (!payload.sub || typeof payload.sub !== 'string') {
            throw new UnauthorizedException();
        }
        
        request.user = {
            userId: payload.sub,
        };

        return true;
    }
}