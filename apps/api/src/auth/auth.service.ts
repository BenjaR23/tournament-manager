import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2'
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { Prisma } from "../generated/prisma/client.js";

@Injectable()
export class AuthService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async register(registerDto: RegisterDto) {
        const existingUser = await this.prismaService.user.findFirst({
            where: {
                OR: [
                    { username: registerDto.username },
                    { email: registerDto.email },
                ],
            },
        });

        if (existingUser) {
            throw new ConflictException('A user with this username or email already exists.');
        }

        const passwordHash = await hash(registerDto.password);

        try {
            const user = await this.prismaService.user.create({
                select: {
                    id: true,
                    username: true,
                    email: true,
                    createdAt: true,
                },
                data: {
                    username: registerDto.username,
                    email: registerDto.email,
                    passwordHash,
                },
            });

            return user;
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('A user with this username or email already exists.');
            }

            throw error;
        }
    }

    async login(loginDto: LoginDto) {
        const user = await this.prismaService.user.findFirst({
            where: {
                OR: [
                    { username: loginDto.usernameOrEmail},
                    { email: loginDto.usernameOrEmail },
                ],
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid username/email or password.');
        }

        const isPasswordValid = await verify(user.passwordHash, loginDto.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid username/email or password.');
        }

        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
        });

        return {
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        };
    }

    async deleteAccount(userId: string, password: string) {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                passwordHash: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials.');
        }

        const isPasswordValid = await verify(user.passwordHash, password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials.');
        }

        await this.prismaService.$transaction(async (tx) => {
            await tx.tournament.deleteMany({
                where: {
                    ownerId: userId,
                },
            });

            await tx.user.delete({
                where: {
                    id: userId,
                },
            });
        });

        return {
            message: 'Account deleted successfully',
        };
    }
}