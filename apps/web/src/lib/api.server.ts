import 'server-only';
import type { AuthenticatedUser } from '@residence/shared';
import { createSupabaseServerClient } from './supabase.server';
import { nestServerApi } from './nest-api.server';

/**
 * Resolve the authenticated browser session through Supabase and load the
 * authoritative application profile exposed by the database security layer.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .schema('api')
      .rpc('fn_my_profile');
    if (error || !data || data.status !== 'ACTIVE') return null;
    return data as AuthenticatedUser;
  } catch {
    return null;
  }
}

/**
 * Server Components use the same NestJS domain API as browser mutations.
 * Supabase owns the browser session; NestJS owns application/domain behavior.
 * Never return mocked data for an unsupported route.
 */
export async function serverApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  return nestServerApi<T>(path, options);
}
