'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/states';

/**
 * Login form connected directly to Supabase Auth (Phase S8)
 */
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function login(identifier: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      supabaseLogin?: { email: string } | null;
    };
    if (!response.ok) throw new Error(payload.message ?? 'Sign in failed.');
    if (!payload.supabaseLogin?.email) {
      throw new Error(
        'Authentication succeeded, but Supabase Auth is not ready. Check FEATURE_SUPABASE_AUTH and the server-side Supabase credentials.',
      );
    }

    const { createSupabaseBrowserClient } =
      await import('@/lib/supabase.client');
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: payload.supabaseLogin.email,
      password,
    });
    if (error) throw new Error(error.message);
    return '/';
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(event.currentTarget);
    const identifier = (formData.get('identifier') as string).trim();
    const password = formData.get('password') as string;
    try {
      const destination = await login(identifier, password);
      router.replace(destination);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      {error ? <Alert>{error}</Alert> : null}
      <FormField label="Username or email" htmlFor="identifier">
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          required
        />
      </FormField>
      <FormField label="Password" htmlFor="password">
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              /* Eye-off icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"
                />
              </svg>
            ) : (
              /* Eye icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
      </FormField>
      <Button className="w-full" disabled={loading} type="submit">
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
