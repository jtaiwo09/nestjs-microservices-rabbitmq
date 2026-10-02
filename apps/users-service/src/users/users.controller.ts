import { Controller } from '@nestjs/common';
import { MESSAGE_PATTERNS, MessagePattern, Payload } from '@repo/common';
import type {
  CreateUserPayload,
  DeleteRefreshTokenPayload,
  FindOrCreateGoogleAccountPayload,
  FindRefreshTokenPayload,
  StoreRefreshTokenPayload,
} from '@repo/common';
import { UsersService } from './users.service.js';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(MESSAGE_PATTERNS.USERS.GET)
  getUser(@Payload() id: string) {
    return this.usersService.findById(id);
  }

  @MessagePattern(MESSAGE_PATTERNS.USERS.FIND_BY_EMAIL)
  findByEmail(@Payload() email: string) {
    return this.usersService.findByEmail(email);
  }

  @MessagePattern(MESSAGE_PATTERNS.USERS.CREATE)
  createUser(@Payload() payload: CreateUserPayload) {
    return this.usersService.createWithLocalAccount(payload);
  }

  @MessagePattern(MESSAGE_PATTERNS.USERS.FIND_OR_CREATE_GOOGLE_ACCOUNT)
  findOrCreateGoogleAccount(@Payload() payload: FindOrCreateGoogleAccountPayload) {
    return this.usersService.findOrCreateGoogleAccount(payload);
  }

  @MessagePattern(MESSAGE_PATTERNS.USERS.STORE_REFRESH_TOKEN)
  storeRefreshToken(@Payload() payload: StoreRefreshTokenPayload) {
    return this.usersService.storeRefreshToken(payload);
  }

  @MessagePattern(MESSAGE_PATTERNS.USERS.FIND_REFRESH_TOKEN)
  findRefreshToken(@Payload() payload: FindRefreshTokenPayload) {
    return this.usersService.findRefreshToken(payload);
  }

  @MessagePattern(MESSAGE_PATTERNS.USERS.DELETE_REFRESH_TOKEN)
  deleteRefreshToken(@Payload() payload: DeleteRefreshTokenPayload) {
    return this.usersService.deleteRefreshToken(payload);
  }
}
