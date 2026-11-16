import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  /** Monitoreo y demo. A4 agrega aquí el chequeo de la base de datos. */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([]);
  }

  /** Healthcheck de Docker: nunca consulta la BD (ver CLAUDE.md, reglas de Swarm). */
  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }
}
