import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, USER_SERVICE_PROVIDER } from '@repo/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { LocalStrategy } from './strategies/local.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';

@Module({
  imports: [
    PassportModule.register({}),
    JwtModule.register({}),
    ClientsModule.registerAsync([USER_SERVICE_PROVIDER]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    LocalAuthGuard,
    JwtAuthGuard,
    JwtRefreshGuard,
    GoogleAuthGuard,
  ],
  exports: [PassportModule, JwtAuthGuard],
})
export class AuthModule {}
