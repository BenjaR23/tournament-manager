import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { GamesModule } from './games/games.module.js';

@Module({
  imports: [
    HealthModule,
    PrismaModule,
    GamesModule,
  ],
})
export class AppModule {}
