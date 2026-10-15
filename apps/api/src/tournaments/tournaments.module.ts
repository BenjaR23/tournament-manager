import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { TournamentsController } from "./tournaments.controller.js";
import { TournamentService } from "./tournaments.service.js";

@Module({
    imports: [PrismaModule],
    providers: [TournamentService],
    controllers: [TournamentsController],
})
export class TournamentsModule {}