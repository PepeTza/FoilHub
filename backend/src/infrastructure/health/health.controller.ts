import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  /** Readiness: consulta la BD. 503 si no responde. Para monitoreo y la demo. */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () =>
        this.prismaHealth.pingCheck('database', this.prisma, { timeout: 1500 }),
    ]);
  }

  /** Liveness: nunca consulta la BD. Lo usa el healthcheck de Docker (ver CLAUDE.md). */
  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }
}
