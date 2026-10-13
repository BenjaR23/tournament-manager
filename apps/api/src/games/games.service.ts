import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class GamesService {
    constructor(private readonly prismaService: PrismaService) {}

    getGames() {
        return this.prismaService.game.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
            },
            orderBy: {
                name: 'asc',
            }
        });
    }
}