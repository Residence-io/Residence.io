import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  it('denies a resident from an administrator endpoint', () => {
    const reflector = {
      getAllAndOverride: () => ['ADMINISTRATOR'],
    } as unknown as Reflector;
    const context = {
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: ['RESIDENT'] } }),
      }),
    } as never;
    expect(() => new RolesGuard(reflector).canActivate(context)).toThrow(
      ForbiddenException,
    );
  });
});
