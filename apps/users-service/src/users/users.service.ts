import { Injectable } from '@nestjs/common';
import { AppError, ErrorCode } from '@repo/common';
import type {
  CreateUserPayload,
  DeleteRefreshTokenPayload,
  FindOrCreateGoogleAccountPayload,
  FindRefreshTokenPayload,
  StoreRefreshTokenPayload,
} from '@repo/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthProvider } from '../generated/prisma/enums.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });
  }

  // Creates a user and a LOCAL account with a pre-hashed password.
  // The gateway hashes with bcrypt before calling this — plaintext passwords never arrive here.
  async createWithLocalAccount(payload: CreateUserPayload) {
    const existing = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (existing) {
      throw new AppError({
        code: ErrorCode.USER_ALREADY_EXISTS,
        message: `User with email ${payload.email} already exists`,
      });
    }

    return this.prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name,
        accounts: {
          create: {
            provider: AuthProvider.LOCAL,
            passwordHash: payload.passwordHash,
          },
        },
      },
      include: { accounts: true },
    });
  }

  async findOrCreateGoogleAccount(payload: FindOrCreateGoogleAccountPayload) {
    return this.prisma.$transaction(async (tx) => {
      const existingAccount = await tx.account.findFirst({
        where: {
          provider: AuthProvider.GOOGLE,
          providerAccountId: payload.googleId,
        },
        include: { user: true },
      });

      if (existingAccount) {
        return existingAccount;
      }

      const existingUser = await tx.user.findUnique({
        where: { email: payload.email },
      });

      if (existingUser) {
        const existingGoogleAccount = await tx.account.findFirst({
          where: { userId: existingUser.id, provider: AuthProvider.GOOGLE },
          include: { user: true },
        });

        if (existingGoogleAccount) {
          return existingGoogleAccount;
        }

        return tx.account.create({
          data: {
            userId: existingUser.id,
            provider: AuthProvider.GOOGLE,
            providerAccountId: payload.googleId,
          },
          include: { user: true },
        });
      }

      return tx.account.create({
        data: {
          provider: AuthProvider.GOOGLE,
          providerAccountId: payload.googleId,
          user: {
            create: {
              email: payload.email,
              name: payload.name,
            },
          },
        },
        include: { user: true },
      });
    });
  }

  async storeRefreshToken(payload: StoreRefreshTokenPayload) {
    return this.prisma.refreshToken.create({
      data: {
        userId: payload.userId,
        tokenHash: payload.tokenHash,
        expiresAt: payload.expiresAt,
      },
    });
  }

  async findRefreshToken(payload: FindRefreshTokenPayload) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash: payload.tokenHash },
    });
  }

  async deleteRefreshToken(payload: DeleteRefreshTokenPayload) {
    await this.prisma.refreshToken.deleteMany({
      where: { tokenHash: payload.tokenHash },
    });
  }
}
