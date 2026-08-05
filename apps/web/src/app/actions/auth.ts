'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase.server';

/**
 * Phase S8: Server action to sign out via Supabase Auth.
 * Call this from any component using a form action or button.
 */
export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
