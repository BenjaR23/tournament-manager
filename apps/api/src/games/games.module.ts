import { Module } from "@nestjs/common";
import { GamesService } from "./games.service.js";
import { GamesController } from "./games.controller.js";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
    imports: [PrismaModule],
    providers: [GamesService],
    controllers: [GamesController],
})
export class GamesModule {}