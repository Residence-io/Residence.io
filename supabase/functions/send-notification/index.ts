/**
 * Supabase Edge Function: send-notification
 * Phase S7: Delivers a notification_delivery via email or SMS.
 * Supports Resend (RESEND_API_KEY) for email. SMS is a placeholder.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM =
  Deno.env.get('NOTIFICATION_EMAIL_FROM') ?? 'no-reply@residence.app';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST')
    return new Response('Method not allowed', { status: 405 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  let deliveryId: string;
  try {
    const body = (await req.json()) as { deliveryId?: string };
    deliveryId = body.deliveryId ?? '';
    if (!deliveryId) throw new Error('deliveryId is required');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: delivery, error } = await supabase
    .from('notification_delivery')
    .select(`id, channel, status, recipient_id`)
    .eq('id', deliveryId)
    .eq('status', 'QUEUED')
    .single();

  if (error || !delivery) {
    return new Response(
      JSON.stringify({ error: 'Delivery not found or not QUEUED' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const { data: recipient } = await supabase
    .from('notification_recipient')
    .select(
      `user_account_id, notification:notification_id ( subject, body_text )`,
    )
    .eq('id', delivery.recipient_id)
    .single();

  const { data: user } = await supabase
    .from('user_account')
    .select('email, display_name')
    .eq('id', (recipient as any)?.user_account_id)
    .maybeSingle();

  const notif = (recipient as any)?.notification;

  await supabase
    .from('notification_delivery')
    .update({ status: 'SENDING', sent_at: new Date().toISOString() })
    .eq('id', deliveryId);

  try {
    if (delivery.channel === 'EMAIL') {
      await sendEmail({
        to: user?.email ?? '',
        toName: user?.display_name ?? '',
        subject: notif?.subject ?? '',
        body: notif?.body_text ?? '',
      });
    } else if (delivery.channel === 'SMS') {
      console.log(`[SMS placeholder] delivery ${deliveryId}`);
    }
    // IN_APP: no external delivery needed

    await supabase
      .from('notification_delivery')
      .update({ status: 'SENT' })
      .eq('id', deliveryId);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    await supabase
      .from('notification_delivery')
      .update({ status: 'FAILED', failed_at: new Date().toISOString() })
      .eq('id', deliveryId);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function sendEmail(opts: {
  to: string;
  toName: string;
  subject: string;
  body: string;
}): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log(`[SANDBOX] Email to ${opts.to}: ${opts.subject}`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: opts.toName ? `${opts.toName} <${opts.to}>` : opts.to,
      subject: opts.subject,
      text: opts.body,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error: ${res.status} ${err}`);
  }
}
