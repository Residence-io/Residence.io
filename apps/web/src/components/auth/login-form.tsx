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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  async function loginViaSupabase(identifier: string, password: string) {
    const { createSupabaseBrowserClient } =
      await import('@/lib/supabase.client');
    const supabase = createSupabaseBrowserClient();

    // Resolve username → email via Edge Function if needed
    let email = identifier;
    if (!identifier.includes('@')) {
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/resolve-username`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: identifier }),
          },
        );
        const body = (await res.json()) as { email?: string; error?: string };
        if (res.ok && body.email) {
          email = body.email;
        } else {
          email = `${identifier.toLowerCase()}@example.test`;
        }
      } catch {
        // Fallback if edge function fetch fails (e.g. not deployed yet)
        email = `${identifier.toLowerCase()}@example.test`;
      }
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      { email, password },
    );
    if (signInError || !data.user)
      throw new Error(signInError?.message ?? 'Sign in failed.');

    return '/'; // root page redirects based on fn_my_profile
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(event.currentTarget);
    const identifier = (formData.get('identifier') as string).trim();
    const password = formData.get('password') as string;
    try {
      const destination = await loginViaSupabase(identifier, password);
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
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </FormField>
      <Button className="w-full" disabled={loading} type="submit">
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
