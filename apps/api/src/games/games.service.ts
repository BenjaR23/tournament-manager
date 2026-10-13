import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class GamesService {
    constructor(private readonly prismaService: PrismaService) {}

    async getGames() {
        const games = await this.prismaService.game.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
            },
            orderBy: {
                name: 'asc',
            }
        });

        return games;
    }
}