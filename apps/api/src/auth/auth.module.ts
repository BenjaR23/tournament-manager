import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthModule } from "./jwt-auth/jwt-auth.module.js";

@Module({
    imports: [
        PrismaModule,
        JwtAuthModule,
    ],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}