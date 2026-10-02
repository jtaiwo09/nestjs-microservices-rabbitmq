import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ErrorCode, type ServiceError } from '@repo/common';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const { status, body } = this.normalize(exception);
    response.status(status).json(body);
  }

  private normalize(exception: unknown): { status: number; body: ServiceError } {
    // NestJS built-in HTTP exceptions (NotFoundException, UnauthorizedException, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message = typeof res === 'string' ? res : (res as Record<string, unknown>).message as string ?? exception.message;

      return {
        status,
        body: {
          code: this.httpStatusToCode(status),
          message,
        },
      };
    }

    // Service errors from downstream microservices (AppError instances serialised over RabbitMQ)
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      'message' in exception
    ) {
      const err = exception as ServiceError;
      return {
        status: this.serviceCodeToHttpStatus(err.code),
        body: err,
      };
    }

    // Unexpected errors — log for investigation, return generic 500
    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : exception);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      },
    };
  }

  private httpStatusToCode(status: number): string {
    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_FAILED,
      [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
      [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
      [HttpStatus.NOT_FOUND]: ErrorCode.INTERNAL_ERROR,
      [HttpStatus.CONFLICT]: ErrorCode.USER_ALREADY_EXISTS,
    };
    return map[status] ?? ErrorCode.INTERNAL_ERROR;
  }

  private serviceCodeToHttpStatus(code: string): number {
    const map: Record<string, number> = {
      [ErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
      [ErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
      [ErrorCode.VALIDATION_FAILED]: HttpStatus.BAD_REQUEST,
      [ErrorCode.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.USER_ALREADY_EXISTS]: HttpStatus.CONFLICT,
      [ErrorCode.ORDER_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.INVENTORY_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.INSUFFICIENT_INVENTORY]: HttpStatus.CONFLICT,
      [ErrorCode.PAYMENT_FAILED]: HttpStatus.PAYMENT_REQUIRED,
    };
    return map[code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
