import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh: vi.fn() }),
}));

describe('LoginForm', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('provides labelled credential fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Username or email')).toBeRequired();
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('redirects a resident after successful login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            societyId: '1',
            username: 'resident',
            displayName: 'Resident',
            forcePasswordChange: false,
            roles: ['RESIDENT'],
            permissions: [],
            csrfToken: 'csrf',
          },
        }),
      }),
    );
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('Username or email'), {
      target: { value: 'resident' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'SecurePassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await vi.waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/resident/dashboard'),
    );
  });
});
