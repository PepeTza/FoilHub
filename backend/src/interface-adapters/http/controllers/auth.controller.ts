import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { GetCurrentUserUseCase } from '../../../application/use-cases/auth/get-current-user.use-case.js';
import { LoginUserUseCase } from '../../../application/use-cases/auth/login-user.use-case.js';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/register-user.use-case.js';
import type { AuthenticatedUser } from '../authenticated-request.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { LoginRequestDto } from '../dto/login.request.dto.js';
import { RegisterRequestDto } from '../dto/register.request.dto.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import {
  AuthPresenter,
  type LoginResponseDto,
  type MeResponseDto,
  type UserSummaryDto,
} from '../presenters/auth.presenter.js';

/** Rate limit solo en /api/auth/* (ThrottlerModule en AuthModule). */
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly getCurrentUser: GetCurrentUserUseCase,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterRequestDto): Promise<UserSummaryDto> {
    return AuthPresenter.userSummary(await this.registerUser.execute(body));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
    return AuthPresenter.login(await this.loginUser.execute(body));
  }

  /** El frontend lo llama en cada recarga: no cuenta para el rate limit. */
  @Get('me')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser): Promise<MeResponseDto> {
    return AuthPresenter.me(
      await this.getCurrentUser.execute({ userId: user.id }),
    );
  }
}
