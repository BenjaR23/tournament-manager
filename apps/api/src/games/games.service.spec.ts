import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import { GamesService } from "./games.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

describe('GamesService', () => {
    let gamesService: GamesService;

    const prisma = {
        game: {
            findMany: jest.fn<() => Promise<{
                id: string;
                name: string;
                slug: string;
            }[]>>(),
        },
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const moduleRef = await Test.createTestingModule({
            providers: [
                GamesService,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        gamesService = moduleRef.get(GamesService);
    });

    it('should return all games', async () => {
        prisma.game.findMany.mockResolvedValue([
            {
                id: '1297-3481-2583',
                name: 'Pokemon',
                slug: 'pokemon',
            },
            {
                id: '8274-6361-2873',
                name: 'Super Smash Bros',
                slug: 'super-smash-bros',
            },
        ]);

        const result = await gamesService.getGames();

        expect(result).toEqual([
            {
                id: '1297-3481-2583',
                name: 'Pokemon',
                slug: 'pokemon',
            },
            {
                id: '8274-6361-2873',
                name: 'Super Smash Bros',
                slug: 'super-smash-bros',
            },
        ]);
    });

    it('should query games ordered by name ascending', async () => {
        await gamesService.getGames();

       expect(prisma.game.findMany).toHaveBeenCalledWith({
            select: {
                id: true,
                name: true,
                slug: true
            },
            orderBy: {
                name: 'asc',
            },
        });
    })
})