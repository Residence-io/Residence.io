import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { argon2id, hash, verify } from 'argon2';

@Injectable()
export class PasswordService {
  constructor(private readonly config: ConfigService) {}

  hash(password: string): Promise<string> {
    return hash(password, {
      type: argon2id,
      memoryCost: this.config.getOrThrow<number>('password.memoryCost'),
      timeCost: this.config.getOrThrow<number>('password.timeCost'),
      parallelism: 1,
    });
  }

  async verify(hashValue: string, password: string): Promise<boolean> {
    try {
      return await verify(hashValue, password);
    } catch {
      return false;
    }
  }
}
