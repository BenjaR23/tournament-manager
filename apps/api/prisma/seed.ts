
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const games = [
    { name: "Pokémon", slug: "pokemon" },
    { name: "Super Smash Bros. Ultimate", slug: "super-smash-bros-ultimate" },
    { name: "Street Fighter 6", slug: "street-fighter-6" },
    { name: "Tekken 8", slug: "tekken-8" },
    { name: "Mortal Kombat 1", slug: "mortal-kombat-1" },
    { name: "Rocket League", slug: "rocket-league" },
    { name: "EA Sports FC 26", slug: "ea-sports-fc-26" },
    { name: "League of Legends", slug: "league-of-legends" },
    { name: "Valorant", slug: "valorant" },
    { name: "Counter-Strike 2", slug: "counter-strike-2" },
];

async function main() {
    for (const game of games) {
        await prisma.game.upsert({
            where: { slug: game.slug },
            update: { name: game.name },
            create: game,
        });
    }

    console.log(`Seed completada: ${games.length} juegos procesados.`);
}

main()
    .catch((error) => {
        console.error("Error al ejecutar la seed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
