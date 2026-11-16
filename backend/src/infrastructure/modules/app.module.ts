import { Module } from '@nestjs/common';
import { HealthModule } from '../health/health.module.js';

// Cada persona agrega solo la importación de su módulo (ver tabla de dueños en docs/PLAN.md).
@Module({
  imports: [HealthModule],
})
export class AppModule {}
