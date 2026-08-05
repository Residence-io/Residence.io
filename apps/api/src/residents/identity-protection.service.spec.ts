import { ConfigService } from '@nestjs/config';
import { IdentityProtectionService } from './identity-protection.service';

describe('IdentityProtectionService', () => {
  const service = new IdentityProtectionService({
    getOrThrow: () => 'test-identity-key-with-at-least-32-characters',
  } as unknown as ConfigService);
  it('encrypts, masks, and creates a stable keyed lookup without storing plaintext', () => {
    const first = service.protect('35202-1234567-1');
    const second = service.protect('3520212345671');
    expect(first.ciphertext).not.toContain('35202');
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(first.searchHash).toBe(second.searchHash);
    expect(first.lastFour).toBe('5671');
    expect(service.reveal(first.ciphertext)).toBe('3520212345671');
  });
});
