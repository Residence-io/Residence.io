'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/states';

export function ForgotPasswordForm() {
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier: data.get('identifier') }),
    });
    setMessage('If that account exists, reset instructions will be sent.');
  }
  return (
    <form className="space-y-5" onSubmit={submit}>
      {message ? <Alert tone="success">{message}</Alert> : null}
      <FormField label="Username or email" htmlFor="identifier">
        <Input id="identifier" name="identifier" required />
      </FormField>
      <Button className="w-full">Request reset</Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: search.get('token'),
        newPassword: data.get('newPassword'),
      }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      setError(body.message ?? 'The reset link is invalid or expired.');
      return;
    }
    router.replace('/login?reset=complete');
  }
  return (
    <form className="space-y-5" onSubmit={submit}>
      {error ? <Alert>{error}</Alert> : null}
      <FormField
        label="New password"
        htmlFor="newPassword"
        hint="Use at least 12 characters with uppercase, lowercase, and a number."
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          minLength={12}
          required
        />
      </FormField>
      <Button className="w-full">Reset password</Button>
    </form>
  );
}

export function ChangePasswordForm({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify({
        currentPassword: data.get('currentPassword'),
        newPassword: data.get('newPassword'),
      }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      setError(body.message ?? 'Password change failed.');
      return;
    }
    router.replace('/login?password=changed');
    router.refresh();
  }
  return (
    <form className="space-y-5" onSubmit={submit}>
      {error ? <Alert>{error}</Alert> : null}
      <FormField label="Current password" htmlFor="currentPassword">
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
        />
      </FormField>
      <FormField
        label="New password"
        htmlFor="newPassword"
        hint="Use at least 12 characters with uppercase, lowercase, and a number."
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          minLength={12}
          required
        />
      </FormField>
      <Button className="w-full">Change password</Button>
    </form>
  );
}
