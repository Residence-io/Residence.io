import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { PrivateStorageService } from './private-storage.service';

describe('PrivateStorageService', () => {
  const root = join(process.cwd(), '.tmp', 'resident-storage-tests');
  const service = new PrivateStorageService(
    {
      getOrThrow: (key: string) =>
        key === 'resident.storage.root' ? root : 1024,
    } as unknown as ConfigService,
    {
      isStorageEnabled: false,
    } as any,
  );
  afterAll(() => rm(root, { recursive: true, force: true }));
  it('stores randomized private objects after signature validation', async () => {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
    const stored = await service.store(
      '14e6b1c0-1b6b-4a46-8808-c675dcf62058',
      png,
      '../../photo.png',
      'image/png',
    );
    expect(stored.objectKey).toMatch(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.png$/);
    expect(stored.originalFileName).not.toContain('/');
    expect(await service.read(stored.objectKey)).toEqual(png);
  });
  it('rejects invalid signatures, oversized files, and traversal keys', async () => {
    await expect(
      service.store(
        '14e6b1c0-1b6b-4a46-8808-c675dcf62058',
        Buffer.from('not a file'),
        'bad.pdf',
        'application/pdf',
      ),
    ).rejects.toThrow('Only valid');
    await expect(
      service.store(
        '14e6b1c0-1b6b-4a46-8808-c675dcf62058',
        Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(2000)]),
        'large.pdf',
        'application/pdf',
      ),
    ).rejects.toThrow('exceeds');
    await expect(service.read('../secret.pdf')).rejects.toThrow(
      'Invalid private object reference',
    );
  });
});
