// Supabase Edge Function: resolve-username
// Accepts { username: string }, returns { email: string } or { error: string }
// Used by login form to resolve username → email before Supabase signInWithPassword
// Rate limited by Supabase's built-in rate limiting

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { username } = (await req.json()) as { username?: string };
    if (!username || typeof username !== 'string') {
      return new Response(JSON.stringify({ error: 'username is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to query user_account table
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase
      .from('user_account')
      .select('email, username')
      .eq('normalized_username', username.trim().toUpperCase())
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const email =
      data.email ?? `${data.username.toLowerCase()}@residence.local`;
    return new Response(JSON.stringify({ email }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
