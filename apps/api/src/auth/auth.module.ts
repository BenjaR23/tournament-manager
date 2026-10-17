import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtModule } from "@nestjs/jwt";

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined.');
}

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: '1d',
            }
        })
    ],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}