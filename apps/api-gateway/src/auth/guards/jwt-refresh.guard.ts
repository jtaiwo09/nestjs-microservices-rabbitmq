import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Triggers JwtRefreshStrategy. Used only on POST /auth/refresh.
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
