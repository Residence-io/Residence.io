import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const incoming = request.header('x-correlation-id');
    request.correlationId =
      incoming && /^[a-zA-Z0-9-]{8,100}$/.test(incoming)
        ? incoming
        : randomUUID();
    response.setHeader('x-correlation-id', request.correlationId);
    next();
  }
}
