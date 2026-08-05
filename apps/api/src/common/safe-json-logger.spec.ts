import { redactLogValue } from './safe-json-logger';

describe('redactLogValue', () => {
  it('redacts nested secrets without changing safe operational fields', () => {
    expect(
      redactLogValue({
        correlationId: 'request-1',
        password: '',
        nested: { authorization: '', status: 'ready' },
      }),
    ).toEqual({
      correlationId: 'request-1',
      password: '[REDACTED]',
      nested: { authorization: '[REDACTED]', status: 'ready' },
    });
  });
});
