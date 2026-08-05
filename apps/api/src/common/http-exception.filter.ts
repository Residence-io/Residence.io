import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const raw =
      typeof body === 'object' && body && 'message' in body
        ? body.message
        : undefined;
    const message =
      status === 500
        ? 'An unexpected error occurred.'
        : Array.isArray(raw)
          ? 'The request contains invalid values.'
          : typeof raw === 'string'
            ? raw
            : 'Request failed.';
    response.status(status).json({
      statusCode: status,
      code: HttpStatus[status] ?? 'ERROR',
      message,
      correlationId: request.correlationId,
    });
  }
}
