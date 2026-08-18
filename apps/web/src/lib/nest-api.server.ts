import 'server-only';
import { createSupabaseServerClient } from './supabase.server';

function apiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!value) throw new Error('NEXT_PUBLIC_API_URL is not configured.');
  return value;
}

export async function nestServerApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);
  if (session?.access_token) {
    headers.set('authorization', `Bearer ${session.access_token}`);
  }
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('content-type')
  ) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl()}/${path.replace(/^\//, '')}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const payload = (await response.json()) as {
        message?: string | string[];
      };
      if (Array.isArray(payload.message)) message = payload.message.join(' ');
      else if (payload.message) message = payload.message;
    } catch {
      // Keep the status-based message for non-JSON responses.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json'))
    return (await response.json()) as T;
  return (await response.text()) as T;
}
