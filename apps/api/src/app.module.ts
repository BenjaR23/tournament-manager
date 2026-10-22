import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { GamesModule } from './games/games.module.js';
import { TournamentsModule } from './tournaments/tournaments.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    HealthModule,
    PrismaModule,
    GamesModule,
    TournamentsModule,
    AuthModule,
  ],
})
export class AppModule {}
