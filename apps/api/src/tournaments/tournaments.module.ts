import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { TournamentsController } from "./tournaments.controller.js";
import { TournamentsService } from "./tournaments.service.js";
import { JwtAuthModule } from "../auth/jwt-auth/jwt-auth.module.js";

@Module({
    imports: [
        PrismaModule,
        JwtAuthModule,
    ],
    providers: [TournamentsService],
    controllers: [TournamentsController],
})
export class TournamentsModule {}