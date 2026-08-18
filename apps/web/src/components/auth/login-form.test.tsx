import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';

const replace = vi.fn();
const refresh = vi.fn();
const signInWithPassword = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
}));

vi.mock('@/lib/supabase.client', () => ({
  createSupabaseBrowserClient: () => ({
    auth: { signInWithPassword },
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
    refresh.mockReset();
    signInWithPassword.mockReset();
    signInWithPassword.mockResolvedValue({ error: null });
  });

  it('provides labelled credential fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Username or email')).toBeRequired();
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('validates credentials with the backend, creates the Supabase session, and redirects through the role router', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            societyId: '1',
            username: 'superadmin',
            displayName: 'Super Admin',
            forcePasswordChange: false,
            roles: ['SUPER_ADMINISTRATOR'],
            permissions: ['REPORT_READ'],
            csrfToken: 'csrf',
          },
          supabaseLogin: { email: 'superadmin@residence.local' },
        }),
      }),
    );

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('Username or email'), {
      target: { value: 'superadmin' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'SecurePassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await vi.waitFor(() =>
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: 'superadmin@residence.local',
        password: 'SecurePassword123',
      }),
    );
    expect(replace).toHaveBeenCalledWith('/');
    expect(refresh).toHaveBeenCalled();
  });

  it('does not create a Supabase session when backend authentication fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid username or password.' }),
      }),
    );

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('Username or email'), {
      target: { value: 'superadmin' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid username or password.')).toBeVisible();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});
