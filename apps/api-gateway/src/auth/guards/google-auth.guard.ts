import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Triggers GoogleStrategy. Used on GET /auth/google and GET /auth/google/callback.
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
