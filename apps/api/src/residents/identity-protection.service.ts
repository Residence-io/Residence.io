import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  createHash,
  randomBytes,
} from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IdentityProtectionService {
  private readonly key: Buffer;
  constructor(config: ConfigService) {
    this.key = createHash('sha256')
      .update(config.getOrThrow<string>('resident.identityDataKey'))
      .digest();
  }

  normalize(value: string): string {
    return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  protect(value: string) {
    const normalized = this.normalize(value);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(normalized, 'utf8'),
      cipher.final(),
    ]);
    return {
      ciphertext: [iv, cipher.getAuthTag(), encrypted]
        .map((part) => part.toString('base64url'))
        .join('.'),
      searchHash: createHmac('sha256', this.key)
        .update(normalized)
        .digest('hex'),
      lastFour: normalized.slice(-4),
    };
  }

  searchHash(value: string): string {
    return createHmac('sha256', this.key)
      .update(this.normalize(value))
      .digest('hex');
  }

  reveal(ciphertext: string): string {
    const [iv, tag, encrypted] = ciphertext
      .split('.')
      .map((value) => Buffer.from(value, 'base64url'));
    if (!iv || !tag || !encrypted)
      throw new Error('Invalid protected identity value.');
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }
}
