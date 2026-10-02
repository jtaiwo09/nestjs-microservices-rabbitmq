import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError, ErrorCode } from '@repo/common';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { AuthenticatedMessage } from '@repo/auth';

const PATTERN_HANDLER_METADATA = 'microservices:handler_type';
const EVENT_HANDLER_TYPE = 2;

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const handlerType = Reflect.getMetadata(
      PATTERN_HANDLER_METADATA,
      context.getHandler(),
    );
    if (handlerType === EVENT_HANDLER_TYPE) return true;

    const rpcContext = context.switchToRpc();

    const data = rpcContext.getData<AuthenticatedMessage>();

    if (!data?.auth.sub) {
      throw new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Unauthorized',
      });
    }

    return true;
  }
}
