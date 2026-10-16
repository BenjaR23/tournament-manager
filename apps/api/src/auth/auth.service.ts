import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2'
import { RegisterDto } from "./dto/register.dto.js";

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
    }
}