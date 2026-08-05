'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase browser client for React client components.
 * Local to apps/web — avoids shared package subpath resolution issues.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
