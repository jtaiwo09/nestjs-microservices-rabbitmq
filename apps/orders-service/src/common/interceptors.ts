import {
  NestInterceptor,
  CallHandler,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

export class ExecutionTimeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ExecutionTimeInterceptor.name);

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();

    const handler = ctx.getHandler().name;

    const controller = ctx.getClass().name;

    const rpcContext = ctx.switchToRpc();
    const message = rpcContext.getData();

    // console.log('Message:', message);

    return next.handle().pipe(
      tap({
        next: (result) => {
          const duration = Date.now() - start;

          this.logger.log(
            `${controller}.${handler} completed in ${duration}ms`,
          );
          return { success: true, data: result };
        },

        error: (error) => {
          const duration = Date.now() - start;

          this.logger.error(
            `${controller}.${handler} failed after ${duration}ms`,
            error?.stack,
          );
        },
      }),
    );
  }
}
