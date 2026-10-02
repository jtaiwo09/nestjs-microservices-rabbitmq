import { RpcException } from "@repo/common";

export interface ServiceError {
  message: string;
  code: ErrorCode | string;
  details?: Record<string, unknown>;
  correlationId?: string;
}

export enum ErrorCode {
  USER_NOT_FOUND = "USER_NOT_FOUND",
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",

  ORDER_NOT_FOUND = "ORDER_NOT_FOUND",
  ORDER_ALREADY_CANCELLED = "ORDER_ALREADY_CANCELLED",

  PAYMENT_FAILED = "PAYMENT_FAILED",

  VALIDATION_FAILED = "VALIDATION_FAILED",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  INTERNAL_ERROR = "INTERNAL_ERROR",

  INVENTORY_NOT_FOUND = "INVENTORY_NOT_FOUND",
  INSUFFICIENT_INVENTORY = "INSUFFICIENT_INVENTORY",
}

export interface AppErrorOptions {
  code: ErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode | string;
  readonly details?: Record<string, unknown>;

  constructor(options: AppErrorOptions) {
    super(options.message, {
      cause: options.cause,
    });

    this.name = "AppError";
    this.code = options.code;
    this.details = options.details;
  }
}

export function normalizeError(error: unknown): ServiceError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: error?.details,
    };
  }

  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: "An unexpected error occurred",
  };
}

export function toRpcException(error: ServiceError): RpcException {
  const err = normalizeError(error);
  return new RpcException(err);
}
