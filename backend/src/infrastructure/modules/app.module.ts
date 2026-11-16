import { Module } from '@nestjs/common';
import { HealthModule } from '../health/health.module.js';
import { CoreModule } from './core.module.js';

// Cada persona agrega solo la importación de su módulo (ver tabla de dueños en docs/PLAN.md).
@Module({
  imports: [CoreModule, HealthModule],
})
export class AppModule {}
