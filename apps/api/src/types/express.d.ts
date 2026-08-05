import type { RequestUser } from '../common/request-context';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      user?: RequestUser;
    }
  }
}

export {};
