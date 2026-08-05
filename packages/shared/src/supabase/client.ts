'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

export type { Database };

/**
 * Creates a Supabase browser client for use in React client components.
 * Uses NEXT_PUBLIC_ env vars — safe to call from the browser.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
