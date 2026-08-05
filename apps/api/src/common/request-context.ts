import type { AuthenticatedUser } from '@residence/shared';

export interface RequestUser extends AuthenticatedUser {
  sessionId: string;
}
