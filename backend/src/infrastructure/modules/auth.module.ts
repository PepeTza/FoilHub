import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import type { PasswordHasher } from '../../application/ports/password-hasher.port.js';
import type { TokenService } from '../../application/ports/token-service.port.js';
import type { UserRepository } from '../../application/ports/user-repository.port.js';
import type { Clock } from '../../application/ports/clock.port.js';
import type { IdGenerator } from '../../application/ports/id-generator.port.js';
import { GetCurrentUserUseCase } from '../../application/use-cases/auth/get-current-user.use-case.js';
import { LoginUserUseCase } from '../../application/use-cases/auth/login-user.use-case.js';
import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user.use-case.js';
import {
  CLOCK,
  ID_GENERATOR,
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../../interface-adapters/di-tokens.js';
import { AuthController } from '../../interface-adapters/http/controllers/auth.controller.js';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../../interface-adapters/http/guards/jwt-auth.guard.js';
import { readSecret } from '../config/read-secret.js';
import { BcryptPasswordHasher } from '../security/bcrypt-password-hasher.js';
import {
  JwtTokenService,
  parseExpiresIn,
} from '../security/jwt-token-service.js';

const jwtExpiresIn = () => parseExpiresIn(process.env.JWT_EXPIRES_IN);

/**
 * Auth por HTTP. Exporta TOKEN_SERVICE y los guards para que otros módulos (ofertas,
 * propuestas) protejan sus rutas importando AuthModule.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: readSecret('JWT_SECRET'),
        signOptions: { algorithm: 'HS256', expiresIn: jwtExpiresIn() },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
    // Por réplica (sin almacenamiento compartido): suficiente para el proyecto (ARCHITECTURE §7).
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: Number(process.env.AUTH_THROTTLE_LIMIT ?? 10) },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    { provide: PASSWORD_HASHER, useValue: new BcryptPasswordHasher(12) },
    {
      provide: TOKEN_SERVICE,
      useFactory: (jwt: JwtService) => new JwtTokenService(jwt, jwtExpiresIn()),
      inject: [JwtService],
    },
    {
      provide: RegisterUserUseCase,
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        ids: IdGenerator,
        clock: Clock,
      ) => new RegisterUserUseCase(users, hasher, ids, clock),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, ID_GENERATOR, CLOCK],
    },
    {
      provide: LoginUserUseCase,
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        tokens: TokenService,
      ) => new LoginUserUseCase(users, hasher, tokens),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE],
    },
    {
      provide: GetCurrentUserUseCase,
      useFactory: (users: UserRepository) => new GetCurrentUserUseCase(users),
      inject: [USER_REPOSITORY],
    },
    JwtAuthGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [TOKEN_SERVICE, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class AuthModule {}
