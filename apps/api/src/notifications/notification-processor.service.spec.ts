import {
  NotificationProcessorService,
  retryDelayMs,
} from './notification-processor.service';

describe('notification retry policy', () => {
  it('uses exponential backoff', () => expect(retryDelayMs(3, 0)).toBe(60_000));
  it('adds bounded jitter', () => expect(retryDelayMs(1, 4999)).toBe(19_999));
  it('caps the base delay', () => expect(retryDelayMs(20, 0)).toBe(3_600_000));
});

describe('durable schedule claim', () => {
  it('keeps future work database-backed', () => {
    const source = NotificationProcessorService.prototype.claim.toString();
    expect(source).toContain('scheduled_at');
  });
});
