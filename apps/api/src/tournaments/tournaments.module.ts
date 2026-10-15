import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { TournamentsController } from "./tournaments.controller.js";
import { TournamentsService } from "./tournaments.service.js";

@Module({
    imports: [PrismaModule],
    providers: [TournamentsService],
    controllers: [TournamentsController],
})
export class TournamentsModule {}