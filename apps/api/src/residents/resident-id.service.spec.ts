import { ResidentIdService } from './resident-id.service';

describe('ResidentIdService', () => {
  it('uses the atomic database result and configurable format', async () => {
    let next = 0n;
    const transaction = {
      $queryRaw: jest
        .fn()
        .mockImplementation(() => Promise.resolve([{ value: ++next }])),
      systemSetting: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ settingValue: 'R-{YEAR}-{SEQUENCE}' }),
      },
    };
    const service = new ResidentIdService();
    const ids = await Promise.all(
      Array.from({ length: 25 }, () =>
        service.next(
          transaction as never,
          '14e6b1c0-1b6b-4a46-8808-c675dcf62058',
          new Date('2026-01-01T00:00:00Z'),
        ),
      ),
    );
    expect(new Set(ids).size).toBe(25);
    expect(ids[0]).toBe('R-2026-000001');
    expect(ids[24]).toBe('R-2026-000025');
  });
});
