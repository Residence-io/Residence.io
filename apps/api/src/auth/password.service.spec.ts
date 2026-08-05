import { ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService({
    getOrThrow: (key: string) => (key.endsWith('memoryCost') ? 19456 : 2),
  } as unknown as ConfigService);
  it('hashes with Argon2 and verifies the correct password', async () => {
    const digest = await service.hash('SecurePassword123');
    expect(digest).not.toContain('SecurePassword123');
    await expect(service.verify(digest, 'SecurePassword123')).resolves.toBe(
      true,
    );
    await expect(service.verify(digest, 'wrong')).resolves.toBe(false);
  });
});
