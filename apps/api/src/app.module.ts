import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [HealthModule, PrismaModule],
})
export class AppModule {}
