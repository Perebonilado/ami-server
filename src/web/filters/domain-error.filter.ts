import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { UniqueConstraintError } from 'sequelize';
import { DomainError } from '../../business/domain/errors/domain-error.js';

const STATUS_TO_CODE: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  429: 'TOO_MANY_REQUESTS',
};

@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof DomainError) {
      this.logger.warn(
        `${request.method} ${request.url} -> ${exception.httpStatus} ${exception.code}: ${exception.message}`,
      );
      response
        .status(exception.httpStatus)
        .json({ error: { code: exception.code, message: exception.message } });
      return;
    }

    if (exception instanceof UniqueConstraintError) {
      this.logger.warn(`${request.method} ${request.url} -> 409 CONFLICT`);
      response.status(409).json({ error: { code: 'CONFLICT', message: 'That already exists. Refresh and try again.' } });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'object' && body !== null && 'message' in body
          ? flattenMessage((body as { message: unknown }).message)
          : exception.message;
      this.logger.warn(`${request.method} ${request.url} -> ${status}: ${message}`);
      response.status(status).json({
        error: { code: STATUS_TO_CODE[status] ?? 'INTERNAL_ERROR', message },
      });
      return;
    }

    this.logger.error(
      `${request.method} ${request.url} -> 500 INTERNAL_ERROR`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
}

function flattenMessage(message: unknown): string {
  if (Array.isArray(message)) return message.join('; ');
  return String(message);
}
