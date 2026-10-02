import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@repo/config';
import { ClientProxy, ErrorCode, MESSAGE_PATTERNS, USER_SERVICE } from '@repo/common';
import type {
  AccountWithUser,
  CreateUserPayload,
  FindOrCreateGoogleAccountPayload,
  UserResponse,
} from '@repo/common';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import type { RegisterDto } from './dto/register.dto.js';
import type { JwtPayload } from './types/jwt-payload.js';
import type { GoogleProfile } from './strategies/google.strategy.js';
import type { AuthUser } from '../common/auth/types/authenticated-user.js';

const BCRYPT_SALT = 12;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_SERVICE)
    private readonly userClient: ClientProxy,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateLocalUser(email: string, password: string) {
    const user = await firstValueFrom<
      | (UserResponse & {
          accounts: { provider: string; passwordHash: string | null }[];
        })
      | null
    >(this.userClient.send(MESSAGE_PATTERNS.USERS.FIND_BY_EMAIL, email));

    if (!user) return null;

    const localAccount = user.accounts?.find((a) => a.provider === 'LOCAL');

    if (!localAccount?.passwordHash) return null;

    const passwordMatches = await bcrypt.compare(
      password,
      localAccount.passwordHash,
    );

    if (!passwordMatches) return null;

    return { sub: user.id, role: user.role };
  }

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT);

    const payload: CreateUserPayload = {
      email: dto.email,
      name: dto.name,
      passwordHash,
    };

    const user = await firstValueFrom<UserResponse | null>(
      this.userClient.send(MESSAGE_PATTERNS.USERS.CREATE, payload),
    ).catch((err: { code?: string }) => {
      if (err?.code === ErrorCode.USER_ALREADY_EXISTS) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw err;
    });

    if (!user) throw new ConflictException('Registration failed');

    return this.issueTokens({ sub: user.id, role: user.role });
  }

  async login(user: AuthUser) {
    return this.issueTokens(user);
  }

  async refresh(user: { sub: string; role: string; refreshToken: string }) {
    const tokenHash = hashToken(user.refreshToken);

    const stored = await firstValueFrom<{
      id: string;
      userId: string;
      expiresAt: Date;
    } | null>(
      this.userClient.send(MESSAGE_PATTERNS.USERS.FIND_REFRESH_TOKEN, {
        tokenHash,
      }),
    );

    if (!stored || stored.userId !== user.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > new Date(stored.expiresAt)) {
      throw new UnauthorizedException('Refresh token expired');
    }

    await firstValueFrom(
      this.userClient.send(MESSAGE_PATTERNS.USERS.DELETE_REFRESH_TOKEN, {
        tokenHash,
      }),
    );

    return this.issueTokens({ sub: user.sub, role: user.role });
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    await firstValueFrom(
      this.userClient.send(MESSAGE_PATTERNS.USERS.DELETE_REFRESH_TOKEN, {
        tokenHash,
      }),
    ).catch(() => {});
  }

  async googleAuth(profile: GoogleProfile) {
    const payload: FindOrCreateGoogleAccountPayload = {
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
    };

    const account = await firstValueFrom<AccountWithUser>(
      this.userClient.send(
        MESSAGE_PATTERNS.USERS.FIND_OR_CREATE_GOOGLE_ACCOUNT,
        payload,
      ),
    );

    return this.issueTokens({ sub: account.user.id, role: account.user.role });
  }

  private async issueTokens(user: AuthUser) {
    const payload: JwtPayload = { sub: user.sub, role: user.role };

    const ACCESS_TTL_SECONDS = 15 * 60;
    const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: ACCESS_TTL_SECONDS,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: REFRESH_TTL_SECONDS,
      }),
    ]);

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await firstValueFrom(
      this.userClient.send(MESSAGE_PATTERNS.USERS.STORE_REFRESH_TOKEN, {
        userId: user.sub,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
      }),
    );

    return { accessToken, refreshToken };
  }
}
