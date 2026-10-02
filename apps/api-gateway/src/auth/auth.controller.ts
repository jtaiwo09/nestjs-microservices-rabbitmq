import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import { Public } from '../common/decorators/public.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { GoogleProfile } from './strategies/google.strategy.js';
import type { AuthUser } from '../common/auth/types/authenticated-user.js';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(dto);
    this.setTokenCookies(res, tokens);
    return { message: 'Registration successful' };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(user);
    this.setTokenCookies(res, tokens);
    return { message: 'Login successful' };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: { sub: string; role: string; refreshToken: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refresh(user);
    this.setTokenCookies(res, tokens);
    return { message: 'Tokens refreshed' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      string | undefined;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie(ACCESS_TOKEN_COOKIE);
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    return { message: 'Logged out successfully' };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @CurrentUser() profile: GoogleProfile,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.googleAuth(profile);
    this.setTokenCookies(res, tokens);
    res.redirect('/');
  }

  private setTokenCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...COOKIE_BASE,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...COOKIE_BASE,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
